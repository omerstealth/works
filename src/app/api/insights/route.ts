import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
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

    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminSupabase()

    // Build query for completed interviews with signals
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

    if (!interviews || interviews.length === 0) {
      return NextResponse.json({
        total_interviews: 0,
        effectiveness: [],
        suggestions: [],
        message: 'Not enough data yet. Complete more interviews to see insights.',
      })
    }

    // Run effectiveness analysis
    const effectiveness = analyzeVariantEffectiveness(
      interviews.map(i => ({
        question_signals: i.question_signals || [],
        overall_score: i.overall_score || 0,
      }))
    )

    // Generate parameter suggestions based on analysis
    const suggestions = generateSuggestions(effectiveness, interviews.length)

    // Basic stats
    const scores = interviews.map(i => i.overall_score || 0).filter(s => s > 0)
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100
      : null

    return NextResponse.json({
      total_interviews: interviews.length,
      avg_score: avgScore,
      effectiveness,
      suggestions,
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
