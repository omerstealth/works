import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { interview_id, message } = await request.json()

    if (!interview_id || !message) {
      return NextResponse.json({ error: 'interview_id and message are required' }, { status: 400 })
    }

    const supabase = await createServerSupabase()

    // Get interview with program data
    const { data: interview, error: intError } = await supabase
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

    // Append user message
    const messages = [...(interview.messages || []), { role: 'user' as const, content: message }]

    // Build API messages (prepend hidden starter)
    const apiMessages = [
      { role: 'user' as const, content: '[Interview started. Greet the candidate and ask their language preference.]' },
      ...messages,
    ]

    // Call Claude
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const model = program.settings?.model || 'claude-sonnet-4-5-20250929'

    const response = await anthropic.messages.create({
      model,
      max_tokens: 2048,
      system: program.system_prompt,
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

    if (agentText.includes('"recommendation"') && agentText.includes('"scores"')) {
      try {
        const jsonMatch = agentText.match(/\{[\s\S]*"scores"[\s\S]*\}/)
        if (jsonMatch) {
          evaluation = JSON.parse(jsonMatch[0])
          recommendation = evaluation.recommendation
          overallScore = evaluation.overall_score
          candidateName = evaluation.candidate_name || candidateName
          status = 'completed'
        }
      } catch {
        // JSON parse failed, not an evaluation
      }
    }

    // Update interview
    await supabase
      .from('interviews')
      .update({
        messages: updatedMessages,
        ...(evaluation && { evaluation, recommendation, overall_score: overallScore, status, completed_at: new Date().toISOString() }),
        ...(candidateName && { candidate_name: candidateName }),
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
