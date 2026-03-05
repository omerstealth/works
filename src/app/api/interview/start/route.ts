import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { buildSystemPrompt, DEFAULT_PARAMETERS, HIGH_SCHOOL_SYSTEM_PROMPT, CODING_EDUCATION_SYSTEM_PROMPT, VARIANT_PRESETS } from '@/lib/interview-parameters'
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
      // Normalize slug: replace underscores with hyphens for consistent matching
      const normalizedSlug = variant_slug.replace(/_/g, '-')
      debugInfo.normalized_slug = normalizedSlug

      // Try both original and normalized slug
      let variant = null
      let variantError = null

      const { data: v1, error: e1 } = await admin
        .from('interview_variants')
        .select('*')
        .eq('program_id', program_id)
        .eq('slug', variant_slug)
        .single()

      if (v1) {
        variant = v1
      } else if (normalizedSlug !== variant_slug) {
        const { data: v2, error: e2 } = await admin
          .from('interview_variants')
          .select('*')
          .eq('program_id', program_id)
          .eq('slug', normalizedSlug)
          .single()
        variant = v2
        variantError = e2
      } else {
        variantError = e1
      }

      debugInfo.variant_found = !!variant
      debugInfo.variant_error = variantError?.message || null

      // Check for known preset slugs
      const isHighSchool = normalizedSlug === 'high-school' || variant_slug === 'high_school' || variant_slug === 'high-school'
      const isCodingEducation = normalizedSlug === 'coding-education' || variant_slug === 'coding_education' || variant_slug === 'coding-education'

      // Built-in prompt map for known presets
      const BUILTIN_PROMPTS: Record<string, string> = {
        'high-school': HIGH_SCHOOL_SYSTEM_PROMPT,
        'coding-education': CODING_EDUCATION_SYSTEM_PROMPT,
      }

      // If variant not found in DB but slug matches a known preset, use built-in
      if (!variant && (isHighSchool || isCodingEducation)) {
        const presetKey = isHighSchool ? 'high-school' : 'coding-education'
        const preset = VARIANT_PRESETS[presetKey]
        debugInfo.using_builtin_fallback_no_variant = true
        debugInfo.preset_key = presetKey
        systemPrompt = BUILTIN_PROMPTS[presetKey]
        parameters = {
          ...DEFAULT_PARAMETERS,
          ...preset?.parameters,
          system_prompt_override: BUILTIN_PROMPTS[presetKey],
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
          // Ensure override is saved in parameters for message route
          parameters.system_prompt_override = promptOverride
        } else if (BUILTIN_PROMPTS[normalizedSlug] || BUILTIN_PROMPTS[variant.slug?.replace(/_/g, '-')]) {
          // Fallback: use built-in prompt for known preset slugs
          const builtinKey = BUILTIN_PROMPTS[normalizedSlug] ? normalizedSlug : variant.slug?.replace(/_/g, '-')
          systemPrompt = BUILTIN_PROMPTS[builtinKey]
          parameters.system_prompt_override = BUILTIN_PROMPTS[builtinKey]
          debugInfo.using_builtin_fallback = true
          debugInfo.builtin_key = builtinKey
        } else {
          systemPrompt = buildSystemPrompt(program.system_prompt, parameters)
        }

        // Increment interview count + auto-fix: persist override in variant params if missing
        const variantUpdate: any = { interview_count: (variant.interview_count || 0) + 1 }
        if (debugInfo.using_builtin_fallback && !variant.parameters?.system_prompt_override && systemPrompt) {
          // Auto-patch: save the override so future lookups find it directly
          variantUpdate.parameters = { ...variant.parameters, system_prompt_override: systemPrompt }
          debugInfo.auto_patched_variant = true
        }
        await admin
          .from('interview_variants')
          .update(variantUpdate)
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
          parameters.system_prompt_override = defaultOverride
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
