import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

interface DeliberationNote {
  jury_id: string
  final_score: number
  final_recommendation: string
}

export async function POST(request: NextRequest) {
  try {
    const { program_id } = await request.json()

    if (!program_id) {
      return NextResponse.json({ error: 'program_id required' }, { status: 400 })
    }

    const supabase = await createServerSupabase()

    // Get all interviews with deliberation notes
    const { data: interviews, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('program_id', program_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const results = []

    for (const iv of interviews || []) {
      const notes: DeliberationNote[] = (iv as any).deliberation_notes || []
      const juryEvals = (iv as any).jury_evaluations || []
      const messages = iv.messages as any[] || []

      // Skip interviews without enough data
      if (messages.length < 4) continue

      let decisionScore: number
      let decision: 'ACCEPT' | 'WAITLIST' | 'REJECT'

      if (notes.length >= 2) {
        // Use deliberation final scores
        decisionScore = Math.round(
          notes.reduce((s: number, n: DeliberationNote) => s + n.final_score, 0) / notes.length * 10
        ) / 10
      } else if (juryEvals.length >= 2) {
        // Fallback to jury avg
        decisionScore = Math.round(
          juryEvals.reduce((s: number, e: any) => s + e.overall_score, 0) / juryEvals.length * 10
        ) / 10
      } else {
        // No jury data, skip
        continue
      }

      // Threshold-based decision
      if (decisionScore >= 7) {
        decision = 'ACCEPT'
      } else if (decisionScore >= 5) {
        decision = 'WAITLIST'
      } else {
        decision = 'REJECT'
      }

      await supabase
        .from('interviews')
        .update({
          decision,
          decision_score: decisionScore,
        })
        .eq('id', iv.id)

      results.push({
        interview_id: iv.id,
        candidate_name: iv.candidate_name,
        decision_score: decisionScore,
        decision,
      })
    }

    // Sort by score descending
    results.sort((a, b) => b.decision_score - a.decision_score)

    return NextResponse.json({
      total: results.length,
      accepted: results.filter(r => r.decision === 'ACCEPT').length,
      waitlisted: results.filter(r => r.decision === 'WAITLIST').length,
      rejected: results.filter(r => r.decision === 'REJECT').length,
      results,
    })
  } catch (err: any) {
    console.error('Decision error:', err)
    return NextResponse.json({ error: `Server error: ${err.message}` }, { status: 500 })
  }
}
