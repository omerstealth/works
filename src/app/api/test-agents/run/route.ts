import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabase } from '@/lib/supabase/server'
import { TEST_AGENT_PROFILES, getProfileById } from '@/lib/test-agents'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Step-based interview: each API call does ONE turn (2 Claude calls max)
// This avoids Vercel serverless timeout (10s on Hobby)

export async function POST(request: NextRequest) {
  try {
    const { program_id, profile_id, action, interview_id } = await request.json()

    if (!program_id) {
      return NextResponse.json({ error: 'program_id is required' }, { status: 400 })
    }

    const supabase = await createServerSupabase()

    // Get program
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('*')
      .eq('id', program_id)
      .single()

    if (programError || !program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const model = program.settings?.model || 'claude-sonnet-4-5-20250929'

    // ACTION: start — create interview and get first greeting
    if (action === 'start') {
      const profile = getProfileById(profile_id)
      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      // Create interview record
      const { data: interview, error: insertError } = await supabase
        .from('interviews')
        .insert({
          program_id,
          status: 'in_progress',
          messages: [],
          language: profile.language,
          candidate_name: profile.name,
        })
        .select()
        .single()

      if (insertError || !interview) {
        return NextResponse.json({ error: `Failed to create interview: ${insertError?.message}` }, { status: 500 })
      }

      // Get initial interviewer greeting
      const firstResponse = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        system: program.system_prompt,
        messages: [
          { role: 'user', content: '[Interview started. Greet the candidate and ask their language preference.]' }
        ],
      })

      const firstMessage = firstResponse.content[0].type === 'text' ? firstResponse.content[0].text : ''
      const messages: Message[] = [{ role: 'assistant', content: firstMessage }]

      await supabase
        .from('interviews')
        .update({ messages })
        .eq('id', interview.id)

      return NextResponse.json({
        interview_id: interview.id,
        status: 'in_progress',
        turn: 0,
        messages,
      })
    }

    // ACTION: turn — do one candidate response + one interviewer response
    if (action === 'turn') {
      if (!interview_id || !profile_id) {
        return NextResponse.json({ error: 'interview_id and profile_id required for turn' }, { status: 400 })
      }

      const profile = getProfileById(profile_id)
      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      // Get current interview
      const { data: interview, error: intError } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', interview_id)
        .single()

      if (intError || !interview) {
        return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
      }

      if (interview.status === 'completed') {
        return NextResponse.json({ status: 'completed', interview_id })
      }

      const allMessages: Message[] = [...(interview.messages as Message[] || [])]

      // Generate candidate response
      const lastAssistantMsg = allMessages[allMessages.length - 1]?.content || ''
      const candidateResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 512,
        system: profile.systemPrompt,
        messages: [
          {
            role: 'user',
            content: `You are in an interview. The interviewer just said:\n\n"${lastAssistantMsg}"\n\nRespond naturally as your character. Keep your answer concise (2-4 sentences unless a detailed answer is needed). If they ask for your name or language preference, answer that first.`
          }
        ],
      })

      const candidateText = candidateResponse.content[0].type === 'text' ? candidateResponse.content[0].text : ''
      allMessages.push({ role: 'user', content: candidateText })

      // Build API messages for the interviewer
      const apiMessages: Message[] = [
        { role: 'user', content: '[Interview started. Greet the candidate and ask their language preference.]' },
        ...allMessages,
      ]

      // Get interviewer's next question or evaluation
      const interviewerResponse = await anthropic.messages.create({
        model,
        max_tokens: 2048,
        system: program.system_prompt,
        messages: apiMessages,
      })

      const interviewerText = interviewerResponse.content[0].type === 'text' ? interviewerResponse.content[0].text : ''
      allMessages.push({ role: 'assistant', content: interviewerText })

      // Check if evaluation JSON is in the response
      let isComplete = false
      if (interviewerText.includes('"recommendation"') && interviewerText.includes('"scores"')) {
        try {
          const jsonMatch = interviewerText.match(/\{[\s\S]*"scores"[\s\S]*\}/)
          if (jsonMatch) {
            const evaluation = JSON.parse(jsonMatch[0])

            await supabase
              .from('interviews')
              .update({
                messages: allMessages,
                evaluation,
                recommendation: evaluation.recommendation,
                overall_score: evaluation.overall_score,
                candidate_name: evaluation.candidate_name || profile.name,
                language: evaluation.language || profile.language,
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .eq('id', interview_id)

            isComplete = true
          }
        } catch {
          // JSON parse failed, continue interview
        }
      }

      if (!isComplete) {
        // Save progress
        await supabase
          .from('interviews')
          .update({ messages: allMessages })
          .eq('id', interview_id)
      }

      const turnCount = Math.floor(allMessages.length / 2)

      // Safety: force complete after 15 turns
      if (!isComplete && turnCount >= 15) {
        await supabase
          .from('interviews')
          .update({
            messages: allMessages,
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', interview_id)
        isComplete = true
      }

      return NextResponse.json({
        interview_id,
        status: isComplete ? 'completed' : 'in_progress',
        turn: turnCount,
      })
    }

    return NextResponse.json({ error: 'Invalid action. Use "start" or "turn".' }, { status: 400 })
  } catch (err: any) {
    console.error('Test agents error:', err)
    return NextResponse.json({ error: `Server error: ${err.message}` }, { status: 500 })
  }
}

// GET endpoint to list available profiles
export async function GET() {
  return NextResponse.json({
    profiles: TEST_AGENT_PROFILES.map(p => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      description: p.description,
      language: p.language,
      expectedScore: p.expectedScore,
    })),
  })
}
