import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { buildSystemPrompt, DEFAULT_PARAMETERS, HIGH_SCHOOL_SYSTEM_PROMPT } from '@/lib/interview-parameters'
import type { InterviewParameters } from '@/lib/interview-parameters'

export async function POST(request: NextRequest) {
  try {
    const { program_id, variant_slug } = await request.json()

    if (!program_id) {
      return NextResponse.json({ error: 'program_id is required' }, { status: 400 })
    }

    // Use admin client for all DB operations (avoids RLS/auth cookie issues)
    const admin = createAdminSupabase()

    // Get program config
    const { data: program, error: programError } = await admin
      .from('programs')
      .select('*')
      .eq('id', program_id)
      .single()

    if (programError || !program) {
      return NextResponse.json({ error: `Program not found: ${programError?.message}` }, { status: 404 })
    }

    // Load variant parameters if variant_slug provided
    let variantId: string | null = null
    let parameters: InterviewParameters = DEFAULT_PARAMETERS
    let systemPrompt = program.system_prompt
    let debugInfo: any = { variant_slug_received: variant_slug || null }

    if (variant_slug) {
      const { data: variant, error: variantError } = await admin
        .from('interview_variants')
        .select('*')
        .eq('program_id', program_id)
        .eq('slug', variant_slug)
        .single()

      debugInfo.variant_found = !!variant
      debugInfo.variant_error = variantError?.message || null

      // If variant not found in DB but slug is 'high-school', still use built-in prompt
      if (!variant && variant_slug === 'high-school') {
        debugInfo.using_builtin_fallback_no_variant = true
        systemPrompt = HIGH_SCHOOL_SYSTEM_PROMPT
        parameters = {
          ...DEFAULT_PARAMETERS,
          max_questions: 8,
          min_questions: 5,
          strictness: 'light' as const,
          tone: 'casual' as const,
          language_preference: 'Turkish',
        }
      }

      if (variant) {
        variantId = variant.id
        parameters = { ...DEFAULT_PARAMETERS, ...variant.parameters }

        // Check for system_prompt_override in multiple locations
        const promptOverride = variant.system_prompt_override
          || variant.parameters?.system_prompt_override
          || parameters.system_prompt_override

        debugInfo.has_db_override = !!variant.system_prompt_override
        debugInfo.has_params_override = !!variant.parameters?.system_prompt_override
        debugInfo.has_merged_override = !!parameters.system_prompt_override
        debugInfo.using_override = !!promptOverride
        debugInfo.variant_slug_in_db = variant.slug

        if (promptOverride) {
          systemPrompt = promptOverride
        } else if (variant_slug === 'high-school' || variant.slug === 'high-school') {
          // Fallback: use built-in high school prompt for high-school variants
          systemPrompt = HIGH_SCHOOL_SYSTEM_PROMPT
          debugInfo.using_builtin_fallback = true
        } else {
          systemPrompt = buildSystemPrompt(program.system_prompt, parameters)
        }

        // Increment interview count
        await admin
          .from('interview_variants')
          .update({ interview_count: (variant.interview_count || 0) + 1 })
          .eq('id', variant.id)
      }
    } else {
      // Check for default variant
      const { data: defaultVariant } = await admin
        .from('interview_variants')
        .select('*')
        .eq('program_id', program_id)
        .eq('is_default', true)
        .single()

      if (defaultVariant) {
        variantId = defaultVariant.id
        parameters = { ...DEFAULT_PARAMETERS, ...defaultVariant.parameters }
        const defaultOverride = defaultVariant.system_prompt_override
          || defaultVariant.parameters?.system_prompt_override
          || parameters.system_prompt_override

        if (defaultOverride) {
          systemPrompt = defaultOverride
        } else {
          systemPrompt = buildSystemPrompt(program.system_prompt, parameters)
        }

        await admin
          .from('interview_variants')
          .update({ interview_count: (defaultVariant.interview_count || 0) + 1 })
          .eq('id', defaultVariant.id)
      }
    }

    // Build initial message based on language preference
    const starterMessage = parameters.language_preference
      ? `[Interview started. Greet the candidate in ${parameters.language_preference} and begin the interview.]`
      : '[Interview started. Greet the candidate and ask their language preference.]'

    // Create interview record with variant info
    const { data: interview, error: insertError } = await admin
      .from('interviews')
      .insert({
        program_id,
        status: 'in_progress',
        messages: [],
        language: parameters.language_preference || 'en',
        variant_id: variantId,
        parameters_snapshot: parameters,
      })
      .select()
      .single()

    if (insertError || !interview) {
      return NextResponse.json({ error: `Failed to create interview: ${insertError?.message}` }, { status: 500 })
    }

    // Call Claude for initial greeting
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const model = program.settings?.model || 'claude-sonnet-4-5-20250929'

    const response = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: starterMessage }
      ],
    })

    const agentMessage = response.content[0].type === 'text' ? response.content[0].text : ''

    // Save the first message
    const messages = [{ role: 'assistant' as const, content: agentMessage }]
    await admin
      .from('interviews')
      .update({ messages })
      .eq('id', interview.id)

    return NextResponse.json({
      interview_id: interview.id,
      message: agentMessage,
      variant_id: variantId,
      _debug: debugInfo,
    })
  } catch (err: any) {
    console.error('Interview start error:', err)
    return NextResponse.json({ error: `Server error: ${err.message || 'Unknown'}` }, { status: 500 })
  }
}
