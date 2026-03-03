import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabase } from '@/lib/supabase/server'
import { JURY_PROFILES, getJuryById } from '@/lib/jury-agents'
import type { JuryEvaluation } from '@/lib/jury-agents'

// Each call evaluates ONE interview with ONE jury member (stays within timeout)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { interview_id, jury_id } = body

    if (!interview_id || !jury_id) {
      return NextResponse.json({ error: 'interview_id and jury_id are required' }, { status: 400 })
    }

    const supabase = await createServerSupabase()

    // ─── HUMAN JURY EVALUATION ───
    if (jury_id.startsWith('human-')) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Validate required fields for human evaluation
      const { scores, overall_score, recommendation, one_line_summary, red_flags, highlights, key_concern, jury_name, jury_emoji } = body
      if (!scores || overall_score === undefined || !recommendation || !one_line_summary) {
        return NextResponse.json({ error: 'Human evaluation requires scores, overall_score, recommendation, one_line_summary' }, { status: 400 })
      }

      const evaluation: JuryEvaluation & { is_human: boolean } = {
        jury_id,
        jury_name: jury_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Human Juror',
        jury_emoji: jury_emoji || '👤',
        is_human: true,
        scores,
        overall_score,
        recommendation,
        one_line_summary,
        red_flags: red_flags || [],
        highlights: highlights || [],
        key_concern: key_concern || '',
      }

      // Get interview
      const { data: interview, error: intError } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', interview_id)
        .single()

      if (intError || !interview) {
        return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
      }

      // Save
      const existingJuryEvals = (interview as any).jury_evaluations || []
      const filtered = existingJuryEvals.filter((e: JuryEvaluation) => e.jury_id !== jury_id)
      const updatedJuryEvals = [...filtered, evaluation]

      const avgJuryScore = Math.round(
        updatedJuryEvals.reduce((s: number, e: JuryEvaluation) => s + e.overall_score, 0) / updatedJuryEvals.length * 10
      ) / 10

      await supabase
        .from('interviews')
        .update({
          jury_evaluations: updatedJuryEvals,
          jury_avg_score: avgJuryScore,
        })
        .eq('id', interview_id)

      return NextResponse.json({
        success: true,
        jury_id,
        jury_name: evaluation.jury_name,
        evaluation,
        total_jury_evals: updatedJuryEvals.length,
        avg_jury_score: avgJuryScore,
      })
    }

    // ─── AI JURY EVALUATION ───
    const jury = getJuryById(jury_id)
    if (!jury) {
      return NextResponse.json({ error: 'Jury member not found' }, { status: 404 })
    }

    // Get interview with transcript
    const { data: interview, error: intError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interview_id)
      .single()

    if (intError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    const messages = interview.messages as { role: string; content: string }[]
    if (!messages || messages.length < 2) {
      return NextResponse.json({ error: 'Interview has no transcript to evaluate' }, { status: 400 })
    }

    // Format transcript for jury review
    const transcript = messages.map((m) => {
      const speaker = m.role === 'assistant' ? 'INTERVIEWER' : (interview.candidate_name || 'CANDIDATE')
      return `[${speaker}]: ${m.content}`
    }).join('\n\n')

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Ask jury member to evaluate
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: jury.systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Please evaluate the following interview transcript for candidate "${interview.candidate_name || 'Unknown'}".\n\nLanguage used: ${interview.language}\n\n--- TRANSCRIPT ---\n${transcript}\n--- END TRANSCRIPT ---\n\nProvide your evaluation as JSON only.`
        }
      ],
    })

    const responseText = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse evaluation JSON
    let evaluation: JuryEvaluation | null = null
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*"scores"[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        evaluation = {
          jury_id: jury.id,
          jury_name: jury.name,
          jury_emoji: jury.emoji,
          scores: parsed.scores,
          overall_score: parsed.overall_score,
          recommendation: parsed.recommendation,
          one_line_summary: parsed.one_line_summary,
          red_flags: parsed.red_flags || [],
          highlights: parsed.highlights || [],
          key_concern: parsed.key_concern || '',
        }
      }
    } catch {
      return NextResponse.json({ error: `Failed to parse ${jury.name}'s evaluation` }, { status: 500 })
    }

    if (!evaluation) {
      return NextResponse.json({ error: `${jury.name} did not produce a valid evaluation` }, { status: 500 })
    }

    // Save jury evaluation to interview record
    const existingJuryEvals = (interview as any).jury_evaluations || []
    const filtered = existingJuryEvals.filter((e: JuryEvaluation) => e.jury_id !== jury.id)
    const updatedJuryEvals = [...filtered, evaluation]

    const avgJuryScore = Math.round(
      updatedJuryEvals.reduce((s: number, e: JuryEvaluation) => s + e.overall_score, 0) / updatedJuryEvals.length * 10
    ) / 10

    await supabase
      .from('interviews')
      .update({
        jury_evaluations: updatedJuryEvals,
        jury_avg_score: avgJuryScore,
      })
      .eq('id', interview_id)

    return NextResponse.json({
      success: true,
      jury_id: jury.id,
      jury_name: jury.name,
      evaluation,
      total_jury_evals: updatedJuryEvals.length,
      avg_jury_score: avgJuryScore,
    })
  } catch (err: any) {
    console.error('Jury evaluation error:', err)
    return NextResponse.json({ error: `Server error: ${err.message}` }, { status: 500 })
  }
}

// GET: List available jury members
export async function GET() {
  return NextResponse.json({
    jury: JURY_PROFILES.map(j => ({
      id: j.id,
      name: j.name,
      emoji: j.emoji,
      title: j.title,
      description: j.description,
    })),
  })
}
