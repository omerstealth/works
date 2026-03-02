import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabase } from '@/lib/supabase/server'
import { TEST_AGENT_PROFILES, getProfileById } from '@/lib/test-agents'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Run a single test agent through a full interview
async function runTestInterview(
  anthropic: Anthropic,
  supabase: any,
  programId: string,
  systemPrompt: string,
  model: string,
  profile: typeof TEST_AGENT_PROFILES[0]
): Promise<{ success: boolean; interviewId?: string; error?: string }> {
  try {
    // Create interview record
    const { data: interview, error: insertError } = await supabase
      .from('interviews')
      .insert({
        program_id: programId,
        status: 'in_progress',
        messages: [],
        language: profile.language,
        candidate_name: profile.name,
      })
      .select()
      .single()

    if (insertError || !interview) {
      return { success: false, error: `Failed to create interview: ${insertError?.message}` }
    }

    const allMessages: Message[] = []
    let interviewComplete = false
    let turnCount = 0
    const maxTurns = 15 // safety limit

    // Get initial interviewer greeting
    const firstResponse = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: '[Interview started. Greet the candidate and ask their language preference.]' }
      ],
    })

    const firstMessage = firstResponse.content[0].type === 'text' ? firstResponse.content[0].text : ''
    allMessages.push({ role: 'assistant', content: firstMessage })

    // Interview loop
    while (!interviewComplete && turnCount < maxTurns) {
      turnCount++

      // Generate candidate response using the test agent profile
      const candidateResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 512,
        system: profile.systemPrompt,
        messages: [
          {
            role: 'user',
            content: `You are in an interview. The interviewer just said:\n\n"${allMessages[allMessages.length - 1].content}"\n\nRespond naturally as your character. Keep your answer concise (2-4 sentences unless a detailed answer is needed). If they ask for your name or language preference, answer that first.`
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
        system: systemPrompt,
        messages: apiMessages,
      })

      const interviewerText = interviewerResponse.content[0].type === 'text' ? interviewerResponse.content[0].text : ''
      allMessages.push({ role: 'assistant', content: interviewerText })

      // Check if evaluation JSON is in the response
      if (interviewerText.includes('"recommendation"') && interviewerText.includes('"scores"')) {
        try {
          const jsonMatch = interviewerText.match(/\{[\s\S]*"scores"[\s\S]*\}/)
          if (jsonMatch) {
            const evaluation = JSON.parse(jsonMatch[0])

            // Update interview with final data
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
              .eq('id', interview.id)

            interviewComplete = true
          }
        } catch {
          // JSON parse failed, continue interview
        }
      }
    }

    // If we hit max turns without evaluation, save what we have
    if (!interviewComplete) {
      await supabase
        .from('interviews')
        .update({
          messages: allMessages,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', interview.id)
    }

    return { success: true, interviewId: interview.id }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { program_id, profile_ids } = await request.json()

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

    // Select profiles to run
    const profilesToRun = profile_ids
      ? profile_ids.map((id: string) => getProfileById(id)).filter(Boolean)
      : TEST_AGENT_PROFILES

    const results = []

    // Run interviews sequentially to avoid rate limits
    for (const profile of profilesToRun) {
      const result = await runTestInterview(
        anthropic,
        supabase,
        program_id,
        program.system_prompt,
        model,
        profile
      )
      results.push({
        profile: profile.id,
        name: profile.name,
        expectedScore: profile.expectedScore,
        ...result,
      })
    }

    return NextResponse.json({
      total: results.length,
      successful: results.filter(r => r.success).length,
      results,
    })
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
