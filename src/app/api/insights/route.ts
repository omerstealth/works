import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { analyzeVariantEffectiveness } from '@/lib/interview-analysis'

// GET: Get effectiveness insights for a program or variant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('program_id')
    const variantId = searchParams.get('variant_id')

    if (!programId) {
      return NextResponse.json({ error: 'program_id required' }, { status: 400 })
    }

    const admin = createAdminSupabase()

    // Fetch ALL interviews for this program (not just completed)
    let allQuery = admin
      .from('interviews')
      .select('id, status, overall_score, variant_id, candidate_name, language, created_at, completed_at, messages')
      .eq('program_id', programId)
      .order('created_at', { ascending: false })

    if (variantId) {
      allQuery = allQuery.eq('variant_id', variantId)
    }

    const { data: allInterviews, error: allError } = await allQuery

    if (allError) {
      return NextResponse.json({ error: allError.message }, { status: 500 })
    }

    // Build recent interviews list for display
    const recentInterviews = (allInterviews || []).map(i => ({
      id: i.id,
      status: i.status,
      candidate_name: i.candidate_name || null,
      overall_score: i.overall_score,
      language: i.language,
      message_count: Array.isArray(i.messages) ? i.messages.length : 0,
      created_at: i.created_at,
      completed_at: i.completed_at,
    }))

    // Build query for completed interviews with signals (for effectiveness analysis)
    let query = admin
      .from('interviews')
      .select('question_signals, overall_score, variant_id, completed_at')
      .eq('program_id', programId)
      .eq('status', 'completed')
      .not('question_signals', 'is', null)

    if (variantId) {
      query = query.eq('variant_id', variantId)
    }

    const { data: interviews, error } = await query.order('completed_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Run effectiveness analysis if we have completed interviews with signals
    let effectiveness: any[] = []
    let suggestions: any[] = []

    if (interviews && interviews.length > 0) {
      effectiveness = analyzeVariantEffectiveness(
        interviews.map(i => ({
          question_signals: i.question_signals || [],
          overall_score: i.overall_score || 0,
        }))
      )
      suggestions = generateSuggestions(effectiveness, interviews.length)
    }

    // Basic stats
    const scores = (interviews || []).map(i => i.overall_score || 0).filter(s => s > 0)
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100
      : null

    return NextResponse.json({
      total_interviews: allInterviews?.length || 0,
      completed_interviews: interviews?.length || 0,
      avg_score: avgScore,
      effectiveness,
      suggestions,
      recent_interviews: recentInterviews,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function generateSuggestions(
  effectiveness: Array<{ topic: string; discrimination: number; times_asked: number; avg_answer_depth: number }>,
  totalInterviews: number
): Array<{ type: string; topic: string; current: number; suggested: number; reason: string }> {
  if (totalInterviews < 10) return [] // not enough data

  const suggestions: Array<{ type: string; topic: string; current: number; suggested: number; reason: string }> = []

  for (const item of effectiveness) {
    if (item.times_asked < 5) continue // not enough data for this topic

    // High discrimination → suggest increasing weight
    if (item.discrimination > 0.5) {
      suggestions.push({
        type: 'increase_weight',
        topic: item.topic,
        current: 1.0,
        suggested: Math.min(1.0 + item.discrimination, 3.0),
        reason: `Bu alan yüksek ayırt edicilik gösteriyor (${item.discrimination}). Ağırlığı artırmak daha iyi aday ayrımı sağlayabilir.`,
      })
    }

    // Low discrimination + low depth → suggest reducing or changing approach
    if (item.discrimination < 0.1 && item.avg_answer_depth < 0.3) {
      suggestions.push({
        type: 'reduce_weight',
        topic: item.topic,
        current: 1.0,
        suggested: 0.5,
        reason: `Bu alan düşük sinyal veriyor (${item.discrimination}) ve adaylar yüzeysel cevap veriyor. Derinliği azaltmayı veya soru yaklaşımını değiştirmeyi düşünün.`,
      })
    }

    // High depth but low discrimination → questions are good but don't differentiate
    if (item.avg_answer_depth > 0.6 && item.discrimination < 0.2) {
      suggestions.push({
        type: 'change_approach',
        topic: item.topic,
        current: 1.0,
        suggested: 1.0,
        reason: `Adaylar bu alanda detaylı cevap veriyor ama skorlarla korelasyon düşük. Daha ayırt edici sorular sormayı deneyin.`,
      })
    }
  }

  return suggestions
}
