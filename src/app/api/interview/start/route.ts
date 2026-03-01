import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { program_id } = await request.json()

    if (!program_id) {
      return NextResponse.json({ error: 'program_id is required' }, { status: 400 })
    }

    const supabase = await createServerSupabase()

    // Get program config
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('*')
      .eq('id', program_id)
      .single()

    if (programError || !program) {
      return NextResponse.json({ error: `Program not found: ${programError?.message}` }, { status: 404 })
    }

    // Create interview record
    const { data: interview, error: insertError } = await supabase
      .from('interviews')
      .insert({
        program_id,
        status: 'in_progress',
        messages: [],
        language: 'en',
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
      system: program.system_prompt,
      messages: [
        { role: 'user', content: '[Interview started. Greet the candidate and ask their language preference.]' }
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
    })
  } catch (err: any) {
    console.error('Interview start error:', err)
    return NextResponse.json({ error: `Server error: ${err.message || 'Unknown'}` }, { status: 500 })
  }
}
