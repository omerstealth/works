'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Program, Interview, JuryEvaluation, DeliberationNote } from '@/lib/supabase/types'
import { useLanguage } from '@/lib/i18n'
import Navbar from '@/components/Navbar'

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { t } = useLanguage()

  const [program, setProgram] = useState<Program | null>(null)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCandidate, setSelectedCandidate] = useState<Interview | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/auth/login?redirect=/${slug}/results`)
        return
      }

      const { data: prog } = await supabase
        .from('programs')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!prog) { router.push('/'); return }
      setProgram(prog as Program)

      const { data: ints } = await supabase
        .from('interviews')
        .select('*')
        .eq('program_id', prog.id)

      setInterviews((ints || []) as Interview[])
      setLoading(false)
    }
    init()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] flex items-center justify-center">
        <div className="text-[#8B949E] font-mono text-sm">{t('results.loading')}</div>
      </div>
    )
  }

  const decided = interviews.filter(iv => (iv as any).decision)
  const accepted = decided.filter(iv => (iv as any).decision === 'ACCEPT').sort((a, b) => ((b as any).decision_score || 0) - ((a as any).decision_score || 0))
  const waitlisted = decided.filter(iv => (iv as any).decision === 'WAITLIST').sort((a, b) => ((b as any).decision_score || 0) - ((a as any).decision_score || 0))
  const rejected = decided.filter(iv => (iv as any).decision === 'REJECT').sort((a, b) => ((b as any).decision_score || 0) - ((a as any).decision_score || 0))

  const totalDecided = decided.length
  const acceptRate = totalDecided > 0 ? Math.round((accepted.length / totalDecided) * 100) : 0
  const avgScore = totalDecided > 0
    ? (decided.reduce((s, iv) => s + ((iv as any).decision_score || 0), 0) / totalDecided).toFixed(1)
    : '-'

  // Check jury agreement
  const agreementCount = decided.filter(iv => {
    const notes: DeliberationNote[] = (iv as any).deliberation_notes || []
    if (notes.length < 2) return false
    const recs = notes.map(n => n.final_recommendation)
    return recs.every(r => r === recs[0])
  }).length
  const agreementRate = totalDecided > 0 ? Math.round((agreementCount / totalDecided) * 100) : 0

  const scoreColor = (s: number) => (s >= 8 ? '#3FB950' : s >= 6 ? '#58A6FF' : s >= 5 ? '#F78166' : '#F85149')
  const decisionColor: Record<string, string> = { ACCEPT: '#3FB950', WAITLIST: '#F78166', REJECT: '#F85149' }
  const decisionBg: Record<string, string> = { ACCEPT: 'rgba(63,185,80,0.1)', WAITLIST: 'rgba(247,129,102,0.1)', REJECT: 'rgba(248,81,73,0.1)' }

  function CandidateRow({ iv, rank }: { iv: Interview; rank?: number }) {
    const juryEvals: JuryEvaluation[] = (iv as any).jury_evaluations || []
    const notes: DeliberationNote[] = (iv as any).deliberation_notes || []
    const decision = (iv as any).decision as string
    const score = (iv as any).decision_score as number

    return (
      <div
        onClick={() => setSelectedCandidate(iv)}
        className="flex items-center gap-4 p-4 bg-[#161B22] border border-[#30363D] rounded-xl cursor-pointer hover:border-[#58A6FF] transition-colors"
      >
        {rank && (
          <div className="w-8 h-8 rounded-full bg-[#0D1117] flex items-center justify-center font-mono font-bold text-sm text-[#8B949E]">
            {rank}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{iv.candidate_name || 'Unknown'}</span>
            <span className="text-[10px] text-[#8B949E] font-mono">{(iv.language || 'en').toUpperCase()}</span>
          </div>
          {juryEvals.length > 0 && (
            <div className="flex gap-1.5 mt-1">
              {juryEvals.map(je => (
                <span key={je.jury_id} className="text-[10px] text-[#8B949E]">
                  {je.jury_emoji}{je.overall_score}
                </span>
              ))}
              {notes.some(n => n.changed_mind) && (
                <span className="text-[10px] text-[#F78166] font-mono ml-1">{t('results.mindChanged')}</span>
              )}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-xl font-bold font-mono" style={{ color: scoreColor(score) }}>{score}</div>
        </div>
        <span
          className="px-3 py-1 rounded-md font-mono text-xs font-bold min-w-[90px] text-center"
          style={{ background: decisionBg[decision] || '#161B22', color: decisionColor[decision] || '#8B949E' }}
        >
          {decision}
        </span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] p-6 max-w-4xl mx-auto">
      <Navbar slug={slug} />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { n: totalDecided, label: t('results.evaluated'), color: '#E6EDF3' },
          { n: `${acceptRate}%`, label: t('results.acceptRate'), color: '#3FB950' },
          { n: avgScore, label: t('results.avgScore'), color: '#58A6FF' },
          { n: `${agreementRate}%`, label: t('results.juryAgreement'), color: '#F78166' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 text-center">
            <div className="text-[26px] font-bold font-mono" style={{ color: stat.color }}>{stat.n}</div>
            <div className="text-[10px] text-[#8B949E] font-mono mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {decided.length === 0 ? (
        <div className="text-center py-20 text-[#8B949E]">
          <div className="text-5xl mb-4">⚖️</div>
          <h2 className="text-xl text-[#E6EDF3] mb-2">{t('results.noDecisions')}</h2>
          <p className="text-sm">{t('results.runPipeline')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Accepted */}
          {accepted.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-[#3FB950]" />
                <h2 className="text-sm font-semibold text-[#3FB950] font-mono">{t('results.accepted')} ({accepted.length})</h2>
              </div>
              <div className="space-y-2">
                {accepted.map((iv, i) => <CandidateRow key={iv.id} iv={iv} rank={i + 1} />)}
              </div>
            </div>
          )}

          {/* Waitlisted */}
          {waitlisted.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-[#F78166]" />
                <h2 className="text-sm font-semibold text-[#F78166] font-mono">{t('results.waitlist')} ({waitlisted.length})</h2>
              </div>
              <div className="space-y-2">
                {waitlisted.map(iv => <CandidateRow key={iv.id} iv={iv} />)}
              </div>
            </div>
          )}

          {/* Rejected */}
          {rejected.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-[#F85149]" />
                <h2 className="text-sm font-semibold text-[#F85149] font-mono">{t('results.rejected')} ({rejected.length})</h2>
              </div>
              <div className="space-y-2 opacity-70">
                {rejected.map(iv => <CandidateRow key={iv.id} iv={iv} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedCandidate && (() => {
        const juryEvals: JuryEvaluation[] = (selectedCandidate as any).jury_evaluations || []
        const notes: DeliberationNote[] = (selectedCandidate as any).deliberation_notes || []
        const recColor: Record<string, string> = { STRONG_YES: '#3FB950', YES: '#58A6FF', MAYBE: '#F78166', NO: '#F85149' }

        return (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCandidate(null)}>
            <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold">{selectedCandidate.candidate_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold"
                      style={{
                        background: decisionBg[(selectedCandidate as any).decision] || '#161B22',
                        color: decisionColor[(selectedCandidate as any).decision] || '#8B949E'
                      }}
                    >
                      {(selectedCandidate as any).decision}
                    </span>
                    <span className="text-sm font-mono font-bold" style={{ color: scoreColor((selectedCandidate as any).decision_score || 0) }}>
                      {(selectedCandidate as any).decision_score}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedCandidate(null)} className="text-[#8B949E] hover:text-white text-xl">&times;</button>
              </div>

              {/* Jury Evaluations */}
              {juryEvals.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-mono text-[#DA7756] mb-3">⚖️ {t('results.juryEvals')}</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {juryEvals.map(je => (
                      <div key={je.jury_id} className="bg-[#0D1117] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span>{je.jury_emoji}</span>
                          <span className="text-xs font-semibold">{je.jury_name}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold font-mono" style={{ color: scoreColor(je.overall_score) }}>{je.overall_score}</span>
                          <span className="text-[10px] font-mono" style={{ color: recColor[je.recommendation] }}>{je.recommendation}</span>
                        </div>
                        {je.one_line_summary && (
                          <div className="text-[10px] text-[#8B949E] italic mt-2">&ldquo;{je.one_line_summary}&rdquo;</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deliberation */}
              {notes.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-mono text-[#58A6FF] mb-3">🗣 {t('results.deliberation')}</h4>
                  <div className="space-y-2">
                    {notes.map(n => (
                      <div key={n.jury_id} className="bg-[#0D1117] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{n.jury_emoji}</span>
                          <span className="text-xs font-semibold">{n.jury_name}</span>
                          {n.changed_mind ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(247,129,102,0.1)] text-[#F78166] font-mono ml-auto">
                              {t('results.changed')}: {n.original_score} → {n.final_score}
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(63,185,80,0.1)] text-[#3FB950] font-mono ml-auto">
                              {t('results.maintained')}: {n.final_score}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8B949E] leading-relaxed">{n.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
