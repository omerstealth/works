import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabase } from '@/lib/supabase/server'
import { getMentorById, getMidtermPrompt } from '@/lib/mentor-agents'
import { getMidtermPMPrompt } from '@/lib/program-manager'

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
    const juryEvals = (interview as any).jury_evaluations || []
    const messages = interview.messages as any[] || []
    const transcript = messages.map((m: any) => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n')

    // Mentor midterm review
    const mentorResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      system: getMidtermPrompt(mentor),
      messages: [{
        role: 'user',
        content: `Candidate: ${interview.candidate_name || 'Unknown'}

INTERVIEW TRANSCRIPT (summary):
${transcript.slice(0, 2000)}

JURY EVALUATION SUMMARY:
${juryEvals.map((je: any) => `${je.jury_emoji} ${je.jury_name}: ${je.overall_score}/10 - ${je.one_line_summary}`).join('\n')}

KICKOFF NOTES:
Welcome: ${kickoffNotes?.welcome_message || 'N/A'}
Focus Areas: ${kickoffNotes?.focus_areas?.join(', ') || 'N/A'}
Roadmap: ${kickoffNotes?.roadmap?.slice(0, 4)?.join(' | ') || 'N/A'}
First Week Tasks: ${kickoffNotes?.first_week_tasks?.join(', ') || 'N/A'}

We are now at Week 4. Please provide your midterm review.`
      }],
    })

    const mentorText = mentorResponse.content[0].type === 'text' ? mentorResponse.content[0].text : ''
    let mentorReview: any = null
    try {
      const jsonMatch = mentorText.match(/\{[\s\S]*"mentor_feedback"[\s\S]*\}/)
      if (jsonMatch) mentorReview = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json({ error: `Failed to parse ${mentor.name}'s midterm review` }, { status: 500 })
    }

    if (!mentorReview) {
      return NextResponse.json({ error: `${mentor.name} did not produce a valid midterm review` }, { status: 500 })
    }

    // Program Manager assessment
    const pmResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 800,
      system: getMidtermPMPrompt(),
      messages: [{
        role: 'user',
        content: `Candidate: ${interview.candidate_name || 'Unknown'}
Mentor: ${mentor.emoji} ${mentor.name}
Mentor Progress Status: ${mentorReview.progress_status}
Mentor Feedback Summary: ${mentorReview.mentor_feedback?.slice(0, 500)}
Strengths: ${mentorReview.strengths?.join(', ')}
Areas to Improve: ${mentorReview.areas_to_improve?.join(', ')}
Decision Score: ${(interview as any).decision_score || 'N/A'}`
      }],
    })

    const pmText = pmResponse.content[0].type === 'text' ? pmResponse.content[0].text : ''
    let pmNotes: any = {}
    try {
      const jsonMatch = pmText.match(/\{[\s\S]*"pm_notes"[\s\S]*\}/)
      if (jsonMatch) pmNotes = JSON.parse(jsonMatch[0])
    } catch {
      pmNotes = { pm_notes: 'Midterm review completed.', intervention_needed: false, intervention_reason: '' }
    }

    // Compose midterm review
    const midtermReview = {
      mentor_id: mentor.id,
      mentor_name: mentor.name,
      mentor_emoji: mentor.emoji,
      mentor_feedback: mentorReview.mentor_feedback || '',
      progress_status: mentorReview.progress_status || 'ON_TRACK',
      strengths: mentorReview.strengths || [],
      areas_to_improve: mentorReview.areas_to_improve || [],
      revised_goals: mentorReview.revised_goals || [],
      pm_notes: pmNotes.pm_notes || '',
      intervention_needed: pmNotes.intervention_needed || false,
      intervention_reason: pmNotes.intervention_reason || '',
    }

    await supabase
      .from('interviews')
      .update({
        midterm_review: midtermReview,
        program_stage: 'midterm',
      })
      .eq('id', interview_id)

    return NextResponse.json({
      success: true,
      interview_id,
      candidate_name: interview.candidate_name,
      midterm_review: midtermReview,
    })
  } catch (err: any) {
    console.error('Midterm error:', err)
    return NextResponse.json({ error: `Server error: ${err.message}` }, { status: 500 })
  }
}
