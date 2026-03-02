import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabase } from '@/lib/supabase/server'
import { getMentorById, getDemoDayPrompt } from '@/lib/mentor-agents'
import { getDemoDayPMPrompt } from '@/lib/program-manager'

// Step-based: one interview per call
export async function POST(request: NextRequest) {
  try {
    const { interview_id } = await request.json()

    if (!interview_id) {
      return NextResponse.json({ error: 'interview_id required' }, { status: 400 })
    }

    const supabase = await createServerSupabase()
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const { data: interview, error: intError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interview_id)
      .single()

    if (intError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    const mentorId = (interview as any).mentor_id
    if (!mentorId) {
      return NextResponse.json({ error: 'No mentor assigned. Run kickoff first.' }, { status: 400 })
    }

    const mentor = getMentorById(mentorId)
    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 })
    }

    const kickoffNotes = (interview as any).kickoff_notes
    const midtermReview = (interview as any).midterm_review
    const juryEvals = (interview as any).jury_evaluations || []
    const messages = interview.messages as any[] || []
    const transcript = messages.map((m: any) => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n')

    // Mentor Demo Day report
    const mentorResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      system: getDemoDayPrompt(mentor),
      messages: [{
        role: 'user',
        content: `Candidate: ${interview.candidate_name || 'Unknown'}

INTERVIEW TRANSCRIPT (summary):
${transcript.slice(0, 2000)}

JURY EVALUATION:
${juryEvals.map((je: any) => `${je.jury_emoji} ${je.jury_name}: ${je.overall_score}/10 - ${je.one_line_summary}`).join('\n')}
Decision Score: ${(interview as any).decision_score || 'N/A'}

KICKOFF NOTES:
Welcome: ${kickoffNotes?.welcome_message || 'N/A'}
Focus Areas: ${kickoffNotes?.focus_areas?.join(', ') || 'N/A'}
Roadmap: ${kickoffNotes?.roadmap?.join(' | ') || 'N/A'}

MIDTERM REVIEW:
Status: ${midtermReview?.progress_status || 'N/A'}
Feedback: ${midtermReview?.mentor_feedback?.slice(0, 500) || 'N/A'}
Strengths: ${midtermReview?.strengths?.join(', ') || 'N/A'}
Areas to Improve: ${midtermReview?.areas_to_improve?.join(', ') || 'N/A'}

We are now at Week 8, Demo Day. Please provide your final report.`
      }],
    })

    const mentorText = mentorResponse.content[0].type === 'text' ? mentorResponse.content[0].text : ''
    let mentorReport: any = null
    try {
      const jsonMatch = mentorText.match(/\{[\s\S]*"mentor_recommendation"[\s\S]*\}/)
      if (jsonMatch) mentorReport = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json({ error: `Failed to parse ${mentor.name}'s Demo Day report` }, { status: 500 })
    }

    if (!mentorReport) {
      return NextResponse.json({ error: `${mentor.name} did not produce a valid Demo Day report` }, { status: 500 })
    }

    // Program Manager final assessment
    const pmResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 800,
      system: getDemoDayPMPrompt(),
      messages: [{
        role: 'user',
        content: `Candidate: ${interview.candidate_name || 'Unknown'}
Mentor: ${mentor.emoji} ${mentor.name}
Mentor Pitch Readiness: ${mentorReport.pitch_readiness}/10
Mentor Recommendation (summary): ${mentorReport.mentor_recommendation?.slice(0, 300)}
Investor Brief: ${mentorReport.investor_brief}
Midterm Status: ${midtermReview?.progress_status || 'N/A'}
Decision Score: ${(interview as any).decision_score || 'N/A'}
Key Metrics: ${mentorReport.key_metrics?.join(', ')}`
      }],
    })

    const pmText = pmResponse.content[0].type === 'text' ? pmResponse.content[0].text : ''
    let pmNotes: any = {}
    try {
      const jsonMatch = pmText.match(/\{[\s\S]*"pm_final_notes"[\s\S]*\}/)
      if (jsonMatch) pmNotes = JSON.parse(jsonMatch[0])
    } catch {
      pmNotes = { pm_final_notes: 'Program completed.', program_outcome: 'GRADUATED', ready_for: [] }
    }

    // Compose Demo Day report
    const demoDayReport = {
      mentor_id: mentor.id,
      mentor_name: mentor.name,
      mentor_emoji: mentor.emoji,
      mentor_recommendation: mentorReport.mentor_recommendation || '',
      pitch_readiness: mentorReport.pitch_readiness || 0,
      investor_brief: mentorReport.investor_brief || '',
      key_metrics: mentorReport.key_metrics || [],
      next_steps: mentorReport.next_steps || [],
      pm_final_notes: pmNotes.pm_final_notes || '',
      program_outcome: pmNotes.program_outcome || 'GRADUATED',
      ready_for: pmNotes.ready_for || [],
    }

    await supabase
      .from('interviews')
      .update({
        demoday_report: demoDayReport,
        program_stage: 'demoday',
      })
      .eq('id', interview_id)

    return NextResponse.json({
      success: true,
      interview_id,
      candidate_name: interview.candidate_name,
      demoday_report: demoDayReport,
    })
  } catch (err: any) {
    console.error('Demo Day error:', err)
    return NextResponse.json({ error: `Server error: ${err.message}` }, { status: 500 })
  }
}
