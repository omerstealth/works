import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabase } from '@/lib/supabase/server'
import { MENTOR_PROFILES, getKickoffPrompt } from '@/lib/mentor-agents'
import { matchMentor } from '@/lib/program-manager'
import { getKickoffPMPrompt } from '@/lib/program-manager'

// Step-based: one interview per call to avoid Vercel timeout
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

    // Only process accepted candidates
    if ((interview as any).decision !== 'ACCEPT') {
      return NextResponse.json({ error: 'Only accepted candidates can enter the program' }, { status: 400 })
    }

    // Match mentor based on jury evaluations
    const juryEvals = (interview as any).jury_evaluations || []
    const mentor = matchMentor(juryEvals)

    // Build context for mentor
    const messages = interview.messages as any[] || []
    const transcript = messages.map((m: any) => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n')
    const evaluation = interview.evaluation as any
    const evalSummary = evaluation
      ? `Score: ${evaluation.overall_score}/10 | Recommendation: ${evaluation.recommendation}\nSummary: ${evaluation.one_line_summary}\nHighlights: ${evaluation.highlights?.join(', ')}\nRed Flags: ${evaluation.red_flags?.join(', ')}`
      : 'No evaluation available'

    // Mentor kickoff
    const mentorResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      system: getKickoffPrompt(mentor),
      messages: [{
        role: 'user',
        content: `Candidate: ${interview.candidate_name || 'Unknown'}

INTERVIEW TRANSCRIPT (summary):
${transcript.slice(0, 3000)}

EVALUATION:
${evalSummary}

JURY SCORES:
${juryEvals.map((je: any) => `${je.jury_emoji} ${je.jury_name}: ${je.overall_score}/10 - ${je.one_line_summary}`).join('\n')}

Please provide your kickoff notes for this candidate.`
      }],
    })

    const mentorText = mentorResponse.content[0].type === 'text' ? mentorResponse.content[0].text : ''
    let mentorNotes: any = null
    try {
      const jsonMatch = mentorText.match(/\{[\s\S]*"welcome_message"[\s\S]*\}/)
      if (jsonMatch) mentorNotes = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json({ error: `Failed to parse ${mentor.name}'s kickoff notes` }, { status: 500 })
    }

    if (!mentorNotes) {
      return NextResponse.json({ error: `${mentor.name} did not produce valid kickoff notes` }, { status: 500 })
    }

    // Program Manager note
    const pmResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      system: getKickoffPMPrompt(),
      messages: [{
        role: 'user',
        content: `Candidate: ${interview.candidate_name || 'Unknown'}
Assigned Mentor: ${mentor.emoji} ${mentor.name} (${mentor.title})
Candidate weakest area: ${Object.entries(juryEvals.length > 0 ? juryEvals[0].scores || {} : {}).sort((a: any, b: any) => a[1].score - b[1].score)[0]?.[0] || 'general'}
Decision Score: ${(interview as any).decision_score || 'N/A'}`
      }],
    })

    const pmText = pmResponse.content[0].type === 'text' ? pmResponse.content[0].text : ''
    let pmNotes: any = {}
    try {
      const jsonMatch = pmText.match(/\{[\s\S]*"pm_welcome"[\s\S]*\}/)
      if (jsonMatch) pmNotes = JSON.parse(jsonMatch[0])
    } catch {
      pmNotes = { pm_welcome: 'Welcome to the program!', mentor_match_reasoning: 'Best fit based on evaluation.' }
    }

    // Compose kickoff notes
    const kickoffNotes = {
      welcome_message: mentorNotes.welcome_message || '',
      mentor_id: mentor.id,
      mentor_name: mentor.name,
      mentor_emoji: mentor.emoji,
      roadmap: mentorNotes.roadmap || [],
      focus_areas: mentorNotes.focus_areas || [],
      first_week_tasks: mentorNotes.first_week_tasks || [],
      pm_welcome: pmNotes.pm_welcome || '',
      mentor_match_reasoning: pmNotes.mentor_match_reasoning || '',
    }

    // Save to database
    await supabase
      .from('interviews')
      .update({
        mentor_id: mentor.id,
        mentor_name: mentor.name,
        kickoff_notes: kickoffNotes,
        program_stage: 'kickoff',
      })
      .eq('id', interview_id)

    return NextResponse.json({
      success: true,
      interview_id,
      candidate_name: interview.candidate_name,
      mentor: { id: mentor.id, name: mentor.name, emoji: mentor.emoji },
      kickoff_notes: kickoffNotes,
    })
  } catch (err: any) {
    console.error('Kickoff error:', err)
    return NextResponse.json({ error: `Server error: ${err.message}` }, { status: 500 })
  }
}
