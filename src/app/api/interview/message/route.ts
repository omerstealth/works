import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { buildSystemPrompt, HIGH_SCHOOL_SYSTEM_PROMPT } from '@/lib/interview-parameters'
import { extractQuestionSignals } from '@/lib/interview-analysis'

export async function POST(request: NextRequest) {
  try {
    const { interview_id, message } = await request.json()

    if (!interview_id || !message) {
      return NextResponse.json({ error: 'interview_id and message are required' }, { status: 400 })
    }

    const admin = createAdminSupabase()

    // Get interview with program data
    const { data: interview, error: intError } = await admin
      .from('interviews')
      .select('*, programs(*)')
      .eq('id', interview_id)
      .single()

    if (intError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    if (interview.status !== 'in_progress') {
      return NextResponse.json({ error: 'Interview is already completed' }, { status: 400 })
    }

    const program = (interview as any).programs
    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Determine system prompt: check for override in parameters_snapshot
    const params = interview.parameters_snapshot
    let systemPrompt: string

    if (params?.system_prompt_override) {
      // Use the override stored in parameters
      systemPrompt = params.system_prompt_override
    } else if (interview.variant_id) {
      // Check variant for override
      const { data: variant } = await admin
        .from('interview_variants')
        .select('system_prompt_override, slug, parameters')
        .eq('id', interview.variant_id)
        .single()

      const variantOverride = variant?.system_prompt_override
        || variant?.parameters?.system_prompt_override

      if (variantOverride) {
        systemPrompt = variantOverride
      } else if (variant?.slug === 'high-school' || variant?.slug === 'high_school') {
        systemPrompt = HIGH_SCHOOL_SYSTEM_PROMPT
      } else if (params) {
        systemPrompt = buildSystemPrompt(program.system_prompt, params)
      } else {
        systemPrompt = program.system_prompt
      }
    } else if (params) {
      systemPrompt = buildSystemPrompt(program.system_prompt, params)
    } else {
      systemPrompt = program.system_prompt
    }

    // Build starter message based on language preference
    const starterMessage = params?.language_preference
      ? `[Interview started. Greet the candidate in ${params.language_preference} and begin the interview.]`
      : '[Interview started. Greet the candidate and ask their language preference.]'

    // Append user message
    const messages = [...(interview.messages || []), { role: 'user' as const, content: message }]

    // Build API messages (prepend hidden starter)
    const apiMessages = [
      { role: 'user' as const, content: starterMessage },
      ...messages,
    ]

    // Call Claude
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const model = program.settings?.model || 'claude-sonnet-4-5-20250929'

    const response = await anthropic.messages.create({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: apiMessages,
    })

    const agentText = response.content[0].type === 'text' ? response.content[0].text : ''

    // Append agent response
    const updatedMessages = [...messages, { role: 'assistant' as const, content: agentText }]

    // Check if evaluation JSON is in the response
    let evaluation = null
    let recommendation = null
    let overallScore = null
    let candidateName = interview.candidate_name
    let status: 'in_progress' | 'completed' = 'in_progress'
    let questionSignals = null

    if (agentText.includes('"recommendation"') && agentText.includes('"scores"')) {
      try {
        const jsonMatch = agentText.match(/\{[\s\S]*"scores"[\s\S]*\}/)
        if (jsonMatch) {
          evaluation = JSON.parse(jsonMatch[0])
          recommendation = evaluation.recommendation
          overallScore = evaluation.overall_score
          candidateName = evaluation.candidate_name || candidateName
          status = 'completed'

          // Extract question signals for self-improvement
          try {
            questionSignals = extractQuestionSignals(updatedMessages, evaluation)
          } catch {
            // Signal extraction is non-critical
          }

          // Update variant avg_score if variant_id exists
          if (interview.variant_id && overallScore) {
            try {
              const { data: variant } = await admin
                .from('interview_variants')
                .select('avg_score, interview_count')
                .eq('id', interview.variant_id)
                .single()

              if (variant) {
                const count = variant.interview_count || 1
                const currentAvg = variant.avg_score || overallScore
                const newAvg = (currentAvg * (count - 1) + overallScore) / count

                await admin
                  .from('interview_variants')
                  .update({ avg_score: Math.round(newAvg * 100) / 100 })
                  .eq('id', interview.variant_id)
              }
            } catch {
              // Non-critical
            }
          }
        }
      } catch {
        // JSON parse failed, not an evaluation
      }
    }

    // Update interview
    await admin
      .from('interviews')
      .update({
        messages: updatedMessages,
        ...(evaluation && {
          evaluation,
          recommendation,
          overall_score: overallScore,
          status,
          completed_at: new Date().toISOString(),
        }),
        ...(candidateName && { candidate_name: candidateName }),
        ...(questionSignals && { question_signals: questionSignals }),
      })
      .eq('id', interview_id)

    return NextResponse.json({
      message: agentText,
      status,
      evaluation: evaluation || undefined,
    })
  } catch (err) {
    console.error('Interview message error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
