import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { buildSystemPrompt, DEFAULT_PARAMETERS } from '@/lib/interview-parameters'
import type { InterviewParameters } from '@/lib/interview-parameters'

export async function POST(request: NextRequest) {
  try {
    const { program_id, variant_slug } = await request.json()

    if (!program_id) {
      return NextResponse.json({ error: 'program_id is required' }, { status: 400 })
    }

    const supabase = await createServerSupabase()
    const admin = createAdminSupabase()

    // Get program config
    const { data: program, error: programError } = await supabase
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

    if (variant_slug) {
      const { data: variant } = await admin
        .from('interview_variants')
        .select('*')
        .eq('program_id', program_id)
        .eq('slug', variant_slug)
        .single()

      if (variant) {
        variantId = variant.id
        parameters = { ...DEFAULT_PARAMETERS, ...variant.parameters }
        systemPrompt = buildSystemPrompt(program.system_prompt, parameters)

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
        systemPrompt = buildSystemPrompt(program.system_prompt, parameters)

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
    const { data: interview, error: insertError } = await supabase
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
    await supabase
      .from('interviews')
      .update({ messages })
      .eq('id', interview.id)

    return NextResponse.json({
      interview_id: interview.id,
      message: agentMessage,
      variant_id: variantId,
    })
  } catch (err: any) {
    console.error('Interview start error:', err)
    return NextResponse.json({ error: `Server error: ${err.message || 'Unknown'}` }, { status: 500 })
  }
}
