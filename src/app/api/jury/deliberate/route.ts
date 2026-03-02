import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabase } from '@/lib/supabase/server'
import { JURY_PROFILES, getJuryById, getDeliberationPrompt } from '@/lib/jury-agents'
import type { JuryEvaluation } from '@/lib/jury-agents'

interface DeliberationNote {
  jury_id: string
  jury_name: string
  jury_emoji: string
  changed_mind: boolean
  original_score: number
  final_score: number
  original_recommendation: string
  final_recommendation: string
  reasoning: string
}

// Each call: one jury member deliberates on one interview
export async function POST(request: NextRequest) {
  try {
    const { interview_id, jury_id } = await request.json()

    if (!interview_id || !jury_id) {
      return NextResponse.json({ error: 'interview_id and jury_id required' }, { status: 400 })
    }

    const jury = getJuryById(jury_id)
    if (!jury) {
      return NextResponse.json({ error: 'Jury member not found' }, { status: 404 })
    }

    const supabase = await createServerSupabase()

    const { data: interview, error: intError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interview_id)
      .single()

    if (intError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    const juryEvals = (interview as any).jury_evaluations as JuryEvaluation[] | undefined
    if (!juryEvals || juryEvals.length < 2) {
      return NextResponse.json({ error: 'Need at least 2 jury evaluations before deliberation' }, { status: 400 })
    }

    const myEval = juryEvals.find(e => e.jury_id === jury_id)
    if (!myEval) {
      return NextResponse.json({ error: `${jury.name} has not evaluated this interview yet` }, { status: 400 })
    }

    const otherEvals = juryEvals.filter(e => e.jury_id !== jury_id)

    // Format other evaluations for context
    const othersContext = otherEvals.map(e =>
      `${e.jury_emoji} ${e.jury_name}:
  Score: ${e.overall_score}/10 | Recommendation: ${e.recommendation}
  Summary: ${e.one_line_summary}
  Highlights: ${e.highlights.join(', ')}
  Red Flags: ${e.red_flags.join(', ')}
  Key Concern: ${e.key_concern}`
    ).join('\n\n')

    const myContext = `YOUR ORIGINAL EVALUATION:
  Score: ${myEval.overall_score}/10 | Recommendation: ${myEval.recommendation}
  Summary: ${myEval.one_line_summary}
  Highlights: ${myEval.highlights.join(', ')}
  Red Flags: ${myEval.red_flags.join(', ')}
  Key Concern: ${myEval.key_concern}`

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: getDeliberationPrompt(jury),
      messages: [
        {
          role: 'user',
          content: `Candidate: ${interview.candidate_name || 'Unknown'}

${myContext}

OTHER JURY MEMBERS' EVALUATIONS:

${othersContext}

Based on reading the other jurors' perspectives, provide your deliberation response as JSON.`
        }
      ],
    })

    const responseText = response.content[0].type === 'text' ? response.content[0].text : ''

    let note: DeliberationNote | null = null
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*"reasoning"[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        note = {
          jury_id: jury.id,
          jury_name: jury.name,
          jury_emoji: jury.emoji,
          changed_mind: parsed.changed_mind || false,
          original_score: myEval.overall_score,
          final_score: parsed.final_score || myEval.overall_score,
          original_recommendation: myEval.recommendation,
          final_recommendation: parsed.final_recommendation || myEval.recommendation,
          reasoning: parsed.reasoning || '',
        }
      }
    } catch {
      return NextResponse.json({ error: `Failed to parse ${jury.name}'s deliberation` }, { status: 500 })
    }

    if (!note) {
      return NextResponse.json({ error: `${jury.name} did not produce a valid deliberation note` }, { status: 500 })
    }

    // Save deliberation note
    const existingNotes: DeliberationNote[] = (interview as any).deliberation_notes || []
    const filtered = existingNotes.filter(n => n.jury_id !== jury.id)
    const updatedNotes = [...filtered, note]

    // Calculate deliberation avg score
    const avgScore = Math.round(
      updatedNotes.reduce((s, n) => s + n.final_score, 0) / updatedNotes.length * 10
    ) / 10

    await supabase
      .from('interviews')
      .update({
        deliberation_notes: updatedNotes,
        decision_score: avgScore,
      })
      .eq('id', interview_id)

    return NextResponse.json({
      success: true,
      jury_id: jury.id,
      note,
      total_deliberations: updatedNotes.length,
      avg_deliberation_score: avgScore,
    })
  } catch (err: any) {
    console.error('Deliberation error:', err)
    return NextResponse.json({ error: `Server error: ${err.message}` }, { status: 500 })
  }
}
