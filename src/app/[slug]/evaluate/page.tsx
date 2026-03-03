'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n'
import Navbar from '@/components/Navbar'
import type { Interview } from '@/lib/supabase/types'

const SCORE_DIMENSIONS = [
  { key: 'problem_clarity', label: { tr: 'Problem Netliği', en: 'Problem Clarity' } },
  { key: 'ai_nativeness', label: { tr: 'AI Yerlilik', en: 'AI Nativeness' } },
  { key: 'technical_depth', label: { tr: 'Teknik Derinlik', en: 'Technical Depth' } },
  { key: 'market_awareness', label: { tr: 'Pazar Farkındalığı', en: 'Market Awareness' } },
  { key: 'founder_energy', label: { tr: 'Kurucu Enerjisi', en: 'Founder Energy' } },
  { key: 'program_fit', label: { tr: 'Program Uyumu', en: 'Program Fit' } },
]

export default function EvaluatePage() {
  const params = useParams()
  const router = useRouter()
  const { t, lang } = useLanguage()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)
  const [programId, setProgramId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')

  // Evaluation form state
  const [scores, setScores] = useState<Record<string, { score: number; rationale: string }>>({})
  const [recommendation, setRecommendation] = useState<string>('MAYBE')
  const [summary, setSummary] = useState('')
  const [highlights, setHighlights] = useState('')
  const [redFlags, setRedFlags] = useState('')
  const [keyConcern, setKeyConcern] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    initScores()
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function initScores() {
    const initial: Record<string, { score: number; rationale: string }> = {}
    SCORE_DIMENSIONS.forEach(d => {
      initial[d.key] = { score: 5, rationale: '' }
    })
    setScores(initial)
  }

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/auth/login?redirect=/${slug}/evaluate`)
      return
    }
    setUserId(user.id)
    setUserName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Juror')

    // Get program
    const { data: prog } = await supabase
      .from('programs')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!prog) { setLoading(false); return }
    setProgramId(prog.id)

    // Get completed interviews
    const { data: ints } = await supabase
      .from('interviews')
      .select('*')
      .eq('program_id', prog.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })

    setInterviews((ints as Interview[]) || [])
    setLoading(false)
  }

  function hasMyEvaluation(interview: Interview): boolean {
    if (!userId) return false
    const evals = interview.jury_evaluations || []
    return evals.some(e => e.jury_id === `human-${userId}`)
  }

  function calculateOverallScore(s: Record<string, { score: number; rationale: string }>): number {
    // ai_nativeness is 2x weighted
    const weights: Record<string, number> = {
      problem_clarity: 1, ai_nativeness: 2, technical_depth: 1,
      market_awareness: 1, founder_energy: 1, program_fit: 1,
    }
    let totalWeight = 0
    let totalScore = 0
    Object.entries(s).forEach(([key, val]) => {
      const w = weights[key] || 1
      totalWeight += w
      totalScore += val.score * w
    })
    return Math.round(totalScore / totalWeight * 10) / 10
  }

  async function submitEvaluation() {
    if (!selectedInterview || !userId) return
    setSubmitting(true)

    const overall = calculateOverallScore(scores)

    try {
      const res = await fetch('/api/jury/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview_id: selectedInterview.id,
          jury_id: `human-${userId}`,
          jury_name: userName,
          jury_emoji: '👤',
          scores,
          overall_score: overall,
          recommendation,
          one_line_summary: summary,
          red_flags: redFlags.split('\n').filter(Boolean),
          highlights: highlights.split('\n').filter(Boolean),
          key_concern: keyConcern,
        }),
      })

      if (res.ok) {
        setSubmitted(true)
        // Refresh interviews
        await loadData()
        setTimeout(() => {
          setSelectedInterview(null)
          setSubmitted(false)
          initScores()
          setRecommendation('MAYBE')
          setSummary('')
          setHighlights('')
          setRedFlags('')
          setKeyConcern('')
        }, 2000)
      }
    } catch (err) {
      console.error(err)
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3]">
        <Navbar slug={slug} />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center text-[#8B949E]">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3]">
      <Navbar slug={slug} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mb-1">{lang === 'tr' ? 'Jüri Değerlendirmesi' : 'Jury Evaluation'}</h1>
        <p className="text-sm text-[#8B949E] mb-8">{lang === 'tr' ? 'Mülakatları okuyun ve değerlendirmenizi yapın' : 'Read interviews and submit your evaluation'}</p>

        {/* Interview list */}
        {!selectedInterview ? (
          <div className="space-y-3">
            {interviews.length === 0 && (
              <div className="text-center py-16 text-[#8B949E]">
                {lang === 'tr' ? 'Henüz değerlendirilecek mülakat yok' : 'No interviews to evaluate yet'}
              </div>
            )}
            {interviews.map(interview => {
              const evaluated = hasMyEvaluation(interview)
              return (
                <div
                  key={interview.id}
                  onClick={() => !evaluated && setSelectedInterview(interview)}
                  className={`bg-[#161B22] border rounded-xl p-5 transition-all ${
                    evaluated
                      ? 'border-[#3FB950]/30 opacity-70 cursor-default'
                      : 'border-[#30363D] hover:border-[#58A6FF] cursor-pointer hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-base">{interview.candidate_name || 'Unknown'}</h3>
                      <p className="text-xs text-[#8B949E] mt-1">
                        {interview.messages?.length || 0} {lang === 'tr' ? 'mesaj' : 'messages'}
                        {' · '}
                        {interview.language === 'tr' ? '🇹🇷' : '🇬🇧'}
                        {interview.jury_evaluations && ` · ${interview.jury_evaluations.length} ${lang === 'tr' ? 'değerlendirme' : 'evaluations'}`}
                      </p>
                    </div>
                    {evaluated ? (
                      <span className="text-xs font-mono text-[#3FB950] bg-[#3FB950]/10 px-3 py-1 rounded-full">
                        ✓ {lang === 'tr' ? 'Değerlendirildi' : 'Evaluated'}
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-[#58A6FF]">
                        → {lang === 'tr' ? 'Değerlendir' : 'Evaluate'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Evaluation view */
          <div>
            <button
              onClick={() => { setSelectedInterview(null); setSubmitted(false) }}
              className="text-sm text-[#8B949E] hover:text-[#E6EDF3] mb-4 flex items-center gap-1"
            >
              ← {lang === 'tr' ? 'Geri' : 'Back'}
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Transcript */}
              <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 max-h-[80vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#30363D transparent' }}>
                <h3 className="text-sm font-mono text-[#8B949E] mb-4">
                  // {selectedInterview.candidate_name || 'Unknown'} — TRANSCRIPT
                </h3>
                <div className="space-y-3">
                  {(selectedInterview.messages || []).map((msg, i) => (
                    <div key={i} className={`text-sm ${msg.role === 'assistant' ? 'text-[#8B949E]' : 'text-[#E6EDF3]'}`}>
                      <span className="text-[10px] font-mono text-[#484F58] block mb-0.5">
                        {msg.role === 'assistant' ? 'INTERVIEWER' : (selectedInterview.candidate_name || 'CANDIDATE')}
                      </span>
                      {msg.content}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Evaluation form */}
              <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 max-h-[80vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#30363D transparent' }}>
                {submitted ? (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-3">✅</div>
                    <h3 className="text-lg font-semibold text-[#3FB950]">
                      {lang === 'tr' ? 'Değerlendirme Kaydedildi!' : 'Evaluation Saved!'}
                    </h3>
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm font-mono text-[#8B949E] mb-4">// {lang === 'tr' ? 'DEĞERLENDİRME FORMU' : 'EVALUATION FORM'}</h3>

                    {/* Score sliders */}
                    <div className="space-y-4 mb-6">
                      {SCORE_DIMENSIONS.map(dim => (
                        <div key={dim.key}>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-medium">{dim.label[lang]}</label>
                            <span className="text-sm font-mono font-bold" style={{ color: scores[dim.key]?.score >= 7 ? '#3FB950' : scores[dim.key]?.score >= 5 ? '#D29922' : '#F85149' }}>
                              {scores[dim.key]?.score || 5}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={scores[dim.key]?.score || 5}
                            onChange={e => setScores(prev => ({
                              ...prev,
                              [dim.key]: { ...prev[dim.key], score: parseInt(e.target.value) }
                            }))}
                            className="w-full h-1.5 bg-[#30363D] rounded-full appearance-none cursor-pointer accent-[#58A6FF]"
                          />
                          <input
                            type="text"
                            placeholder={lang === 'tr' ? 'Gerekçe (opsiyonel)' : 'Rationale (optional)'}
                            value={scores[dim.key]?.rationale || ''}
                            onChange={e => setScores(prev => ({
                              ...prev,
                              [dim.key]: { ...prev[dim.key], rationale: e.target.value }
                            }))}
                            className="mt-1 w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-1.5 text-xs text-[#E6EDF3] placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF]"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Overall score preview */}
                    <div className="bg-[#0D1117] rounded-lg px-4 py-3 mb-6 text-center">
                      <div className="text-[10px] font-mono text-[#8B949E] mb-1">{lang === 'tr' ? 'GENEL PUAN' : 'OVERALL SCORE'}</div>
                      <div className="text-2xl font-bold font-mono" style={{ color: calculateOverallScore(scores) >= 7 ? '#3FB950' : calculateOverallScore(scores) >= 5 ? '#D29922' : '#F85149' }}>
                        {calculateOverallScore(scores)}
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="mb-4">
                      <label className="text-xs font-medium mb-2 block">{lang === 'tr' ? 'Öneri' : 'Recommendation'}</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['STRONG_YES', 'YES', 'MAYBE', 'NO'].map(r => (
                          <button
                            key={r}
                            onClick={() => setRecommendation(r)}
                            className={`text-xs py-2 rounded-lg border font-medium transition-all ${
                              recommendation === r
                                ? 'bg-[#58A6FF] text-[#0D1117] border-[#58A6FF]'
                                : 'border-[#30363D] text-[#8B949E] hover:border-[#58A6FF]'
                            }`}
                          >
                            {r.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="mb-4">
                      <label className="text-xs font-medium mb-1 block">{lang === 'tr' ? 'Tek Satır Özet' : 'One-line Summary'} *</label>
                      <input
                        type="text"
                        value={summary}
                        onChange={e => setSummary(e.target.value)}
                        placeholder={lang === 'tr' ? 'Bu aday hakkında tek cümlelik değerlendirmeniz...' : 'Your one-sentence assessment of this candidate...'}
                        className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-sm text-[#E6EDF3] placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF]"
                      />
                    </div>

                    {/* Highlights */}
                    <div className="mb-4">
                      <label className="text-xs font-medium mb-1 block">{lang === 'tr' ? 'Öne Çıkanlar' : 'Highlights'}</label>
                      <textarea
                        value={highlights}
                        onChange={e => setHighlights(e.target.value)}
                        placeholder={lang === 'tr' ? 'Her satıra bir madde...' : 'One item per line...'}
                        rows={2}
                        className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-sm text-[#E6EDF3] placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF] resize-none"
                      />
                    </div>

                    {/* Red flags */}
                    <div className="mb-4">
                      <label className="text-xs font-medium mb-1 block">{lang === 'tr' ? 'Uyarı İşaretleri' : 'Red Flags'}</label>
                      <textarea
                        value={redFlags}
                        onChange={e => setRedFlags(e.target.value)}
                        placeholder={lang === 'tr' ? 'Her satıra bir madde...' : 'One item per line...'}
                        rows={2}
                        className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-sm text-[#E6EDF3] placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF] resize-none"
                      />
                    </div>

                    {/* Key concern */}
                    <div className="mb-6">
                      <label className="text-xs font-medium mb-1 block">{lang === 'tr' ? 'Ana Endişe' : 'Key Concern'}</label>
                      <input
                        type="text"
                        value={keyConcern}
                        onChange={e => setKeyConcern(e.target.value)}
                        placeholder={lang === 'tr' ? 'En büyük endişeniz...' : 'Your biggest concern...'}
                        className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-sm text-[#E6EDF3] placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF]"
                      />
                    </div>

                    {/* Submit */}
                    <button
                      onClick={submitEvaluation}
                      disabled={submitting || !summary}
                      className="w-full py-3 rounded-xl font-bold text-sm bg-[#58A6FF] text-[#0D1117] hover:bg-[#79B8FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {submitting
                        ? (lang === 'tr' ? 'Kaydediliyor...' : 'Saving...')
                        : (lang === 'tr' ? 'Değerlendirmeyi Kaydet' : 'Save Evaluation')
                      }
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
