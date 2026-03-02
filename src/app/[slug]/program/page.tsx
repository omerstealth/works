'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Program, Interview } from '@/lib/supabase/types'
import { MENTOR_PROFILES } from '@/lib/mentor-agents'
import { PROGRAM_TIMELINE, PROGRAM_MANAGER } from '@/lib/program-manager'
import { useLanguage } from '@/lib/i18n'
import Navbar from '@/components/Navbar'

type StageKey = 'kickoff' | 'midterm' | 'demoday'

export default function ProgramPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { t } = useLanguage()

  const [program, setProgram] = useState<Program | null>(null)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<StageKey | null>(null)
  const [progress, setProgress] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<Interview | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/auth/login?redirect=/${slug}/program`); return }

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

      // Only accepted candidates
      const accepted = ((ints || []) as Interview[]).filter(iv => (iv as any).decision === 'ACCEPT')
      setInterviews(accepted)
      setLoading(false)
    }
    init()
  }, [slug])

  async function refreshInterviews() {
    if (!program) return
    const { data: ints } = await supabase
      .from('interviews')
      .select('*')
      .eq('program_id', program.id)
    const accepted = ((ints || []) as Interview[]).filter(iv => (iv as any).decision === 'ACCEPT')
    setInterviews(accepted)
  }

  async function runStage(stage: StageKey) {
    if (running || !program) return
    setRunning(stage)

    const endpoint = `/api/program/${stage}`
    let completed = 0

    for (const iv of interviews) {
      setProgress(`${stage.toUpperCase()}: ${iv.candidate_name || 'Unknown'} (${completed + 1}/${interviews.length})`)
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interview_id: iv.id }),
        })
        if (!res.ok) {
          const err = await res.json()
          console.error(`${stage} error for ${iv.candidate_name}:`, err)
        }
      } catch (err) {
        console.error(`${stage} error:`, err)
      }
      completed++
    }

    await refreshInterviews()
    setRunning(null)
    setProgress('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] flex items-center justify-center">
        <div className="text-[#8B949E] font-mono text-sm">{t('program.loading')}</div>
      </div>
    )
  }

  const stageColors: Record<string, string> = {
    kickoff: '#3FB950',
    event: '#8B949E',
    midterm: '#58A6FF',
    demoday: '#F78166',
  }

  const getStageStatus = (stage: StageKey): 'done' | 'active' | 'pending' => {
    if (interviews.length === 0) return 'pending'
    const allHave = interviews.every(iv => {
      if (stage === 'kickoff') return !!(iv as any).kickoff_notes
      if (stage === 'midterm') return !!(iv as any).midterm_review
      if (stage === 'demoday') return !!(iv as any).demoday_report
      return false
    })
    if (allHave) return 'done'
    const someHave = interviews.some(iv => {
      if (stage === 'kickoff') return !!(iv as any).kickoff_notes
      if (stage === 'midterm') return !!(iv as any).midterm_review
      if (stage === 'demoday') return !!(iv as any).demoday_report
      return false
    })
    if (someHave) return 'active'
    return 'pending'
  }

  const kickoffStatus = getStageStatus('kickoff')
  const midtermStatus = getStageStatus('midterm')
  const demoDayStatus = getStageStatus('demoday')

  const statusIcon = (s: 'done' | 'active' | 'pending') =>
    s === 'done' ? '✅' : s === 'active' ? '🔄' : '⏳'

  const progressColor = (s: string) => {
    if (s === 'ON_TRACK') return '#3FB950'
    if (s === 'AT_RISK') return '#F78166'
    return '#F85149'
  }

  const outcomeColor = (o: string) => {
    if (o === 'GRADUATED_WITH_HONORS') return '#3FB950'
    if (o === 'GRADUATED') return '#58A6FF'
    return '#F78166'
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] p-6 max-w-5xl mx-auto">
      <Navbar slug={slug} />

      {/* Program Manager */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{PROGRAM_MANAGER.emoji}</span>
          <div>
            <div className="font-semibold text-sm">{PROGRAM_MANAGER.name}</div>
            <div className="text-[10px] text-[#8B949E] font-mono">{PROGRAM_MANAGER.title}</div>
          </div>
          <div className="ml-auto text-xs text-[#8B949E]">{interviews.length} {t('program.acceptedFounders')}</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-8">
        <h2 className="text-sm font-mono text-[#8B949E] mb-4">{t('program.timeline')}</h2>
        <div className="relative">
          {/* Progress bar background */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#30363D]" />

          <div className="space-y-3">
            {PROGRAM_TIMELINE.map((event, i) => {
              const isStage = event.type !== 'event'
              const color = stageColors[event.type]

              return (
                <div key={i} className="flex items-center gap-4 relative">
                  <div
                    className="w-12 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold z-10"
                    style={{ background: isStage ? color : '#161B22', color: isStage ? '#0D1117' : '#8B949E', border: isStage ? 'none' : '1px solid #30363D' }}
                  >
                    W{event.week}
                  </div>
                  <div className={`flex-1 py-2 ${isStage ? 'font-semibold' : 'text-[#8B949E] text-sm'}`}>
                    {t(`program.week${event.week}`)}
                  </div>
                  {isStage && (
                    <span className="text-xs font-mono">
                      {statusIcon(event.type === 'kickoff' ? kickoffStatus : event.type === 'midterm' ? midtermStatus : demoDayStatus)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <button
          onClick={() => runStage('kickoff')}
          disabled={!!running || interviews.length === 0}
          className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 text-center hover:border-[#3FB950] transition-colors disabled:opacity-40"
        >
          <div className="text-2xl mb-2">🚀</div>
          <div className="text-sm font-semibold text-[#3FB950]">{t('program.runKickoff')}</div>
          <div className="text-[10px] text-[#8B949E] font-mono mt-1">{t('program.kickoffDesc')}</div>
        </button>
        <button
          onClick={() => runStage('midterm')}
          disabled={!!running || kickoffStatus !== 'done'}
          className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 text-center hover:border-[#58A6FF] transition-colors disabled:opacity-40"
        >
          <div className="text-2xl mb-2">📋</div>
          <div className="text-sm font-semibold text-[#58A6FF]">{t('program.runMidterm')}</div>
          <div className="text-[10px] text-[#8B949E] font-mono mt-1">{t('program.midtermDesc')}</div>
        </button>
        <button
          onClick={() => runStage('demoday')}
          disabled={!!running || midtermStatus !== 'done'}
          className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 text-center hover:border-[#F78166] transition-colors disabled:opacity-40"
        >
          <div className="text-2xl mb-2">🎤</div>
          <div className="text-sm font-semibold text-[#F78166]">{t('program.runDemoday')}</div>
          <div className="text-[10px] text-[#8B949E] font-mono mt-1">{t('program.demodayDesc')}</div>
        </button>
      </div>

      {/* Running Progress */}
      {running && (
        <div className="bg-[#161B22] border border-[#58A6FF] rounded-xl p-4 mb-6 text-center">
          <div className="text-sm font-mono text-[#58A6FF] animate-pulse">{progress}</div>
        </div>
      )}

      {/* Mentors Overview */}
      <div className="mb-8">
        <h2 className="text-sm font-mono text-[#8B949E] mb-3">{t('program.mentorPanel')}</h2>
        <div className="grid grid-cols-5 gap-2">
          {MENTOR_PROFILES.map(m => {
            const menteeCount = interviews.filter(iv => (iv as any).mentor_id === m.id).length
            return (
              <div key={m.id} className="bg-[#161B22] border border-[#30363D] rounded-lg p-3 text-center">
                <div className="text-xl mb-1">{m.emoji}</div>
                <div className="text-xs font-semibold truncate">{m.name}</div>
                <div className="text-[9px] text-[#8B949E] font-mono mt-0.5">{m.focus.toUpperCase()}</div>
                {menteeCount > 0 && (
                  <div className="text-[10px] text-[#58A6FF] font-mono mt-1">{menteeCount} {t('program.mentee')}{menteeCount > 1 ? 's' : ''}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Candidates */}
      {interviews.length === 0 ? (
        <div className="text-center py-20 text-[#8B949E]">
          <div className="text-5xl mb-4">🎓</div>
          <h2 className="text-xl text-[#E6EDF3] mb-2">{t('program.noAccepted')}</h2>
          <p className="text-sm">{t('program.runFirst')}</p>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-mono text-[#8B949E] mb-3">{t('program.cohort')} ({interviews.length} {t('program.founders')})</h2>
          <div className="space-y-2">
            {interviews.map(iv => {
              const kickoff = (iv as any).kickoff_notes
              const midterm = (iv as any).midterm_review
              const demoday = (iv as any).demoday_report
              const mentorEmoji = kickoff?.mentor_emoji || '—'
              const mentorName = kickoff?.mentor_name || t('program.unassigned')

              return (
                <div
                  key={iv.id}
                  onClick={() => setSelectedCandidate(iv)}
                  className="flex items-center gap-4 p-4 bg-[#161B22] border border-[#30363D] rounded-xl cursor-pointer hover:border-[#58A6FF] transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{iv.candidate_name || 'Unknown'}</span>
                      <span className="text-xs text-[#8B949E]">{mentorEmoji} {mentorName}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {kickoff && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(63,185,80,0.1)] text-[#3FB950] font-mono">Kickoff ✓</span>}
                      {midterm && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                          style={{ background: 'rgba(88,166,255,0.1)', color: progressColor(midterm.progress_status) }}
                        >
                          Midterm: {midterm.progress_status}
                        </span>
                      )}
                      {demoday && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                          style={{ background: 'rgba(247,129,102,0.1)', color: outcomeColor(demoday.program_outcome) }}
                        >
                          {demoday.program_outcome} • Pitch: {demoday.pitch_readiness}/10
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold font-mono" style={{ color: '#58A6FF' }}>
                      {(iv as any).decision_score || '—'}
                    </div>
                    <div className="text-[10px] text-[#8B949E] font-mono">{t('common.score')}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedCandidate && (() => {
        const kickoff = (selectedCandidate as any).kickoff_notes
        const midterm = (selectedCandidate as any).midterm_review
        const demoday = (selectedCandidate as any).demoday_report

        return (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCandidate(null)}>
            <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold">{selectedCandidate.candidate_name}</h3>
                  {kickoff && (
                    <div className="text-xs text-[#8B949E] mt-1">
                      Mentor: {kickoff.mentor_emoji} {kickoff.mentor_name}
                    </div>
                  )}
                </div>
                <button onClick={() => setSelectedCandidate(null)} className="text-[#8B949E] hover:text-white text-xl">&times;</button>
              </div>

              {/* Kickoff */}
              {kickoff && (
                <div className="mb-6">
                  <h4 className="text-xs font-mono text-[#3FB950] mb-3">🚀 {t('program.kickoffTitle')} — Hafta 1</h4>
                  <div className="bg-[#0D1117] rounded-lg p-4 space-y-3">
                    <p className="text-sm text-[#E6EDF3] italic">&ldquo;{kickoff.welcome_message}&rdquo;</p>

                    <div>
                      <div className="text-[10px] text-[#8B949E] font-mono mb-1">{t('program.focusAreas')}</div>
                      <div className="flex flex-wrap gap-1">
                        {kickoff.focus_areas?.map((f: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(63,185,80,0.1)] text-[#3FB950]">{f}</span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-[#8B949E] font-mono mb-1">{t('program.roadmap')}</div>
                      <div className="space-y-1">
                        {kickoff.roadmap?.map((r: string, i: number) => (
                          <div key={i} className="text-[11px] text-[#8B949E] flex gap-2">
                            <span className="text-[#58A6FF] font-mono min-w-[16px]">{i + 1}.</span>
                            {r}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-[#8B949E] font-mono mb-1">{t('program.firstWeekTasks')}</div>
                      {kickoff.first_week_tasks?.map((t: string, i: number) => (
                        <div key={i} className="text-[11px] text-[#E6EDF3]">• {t}</div>
                      ))}
                    </div>

                    <div className="border-t border-[#30363D] pt-2 mt-2">
                      <div className="text-[10px] text-[#8B949E] font-mono">👩‍💼 {t('program.pmNote')}</div>
                      <p className="text-[11px] text-[#8B949E] mt-1">{kickoff.pm_welcome}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Midterm */}
              {midterm && (
                <div className="mb-6">
                  <h4 className="text-xs font-mono text-[#58A6FF] mb-3">📋 {t('program.midtermTitle')} — Hafta 4</h4>
                  <div className="bg-[#0D1117] rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-md font-mono font-bold"
                        style={{ background: `${progressColor(midterm.progress_status)}20`, color: progressColor(midterm.progress_status) }}
                      >
                        {midterm.progress_status}
                      </span>
                      {midterm.intervention_needed && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(248,81,73,0.1)] text-[#F85149] font-mono">
                          {t('program.interventionNeeded')}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#E6EDF3] leading-relaxed">{midterm.mentor_feedback}</p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] text-[#3FB950] font-mono mb-1">{t('program.strengths')}</div>
                        {midterm.strengths?.map((s: string, i: number) => (
                          <div key={i} className="text-[10px] text-[#8B949E]">+ {s}</div>
                        ))}
                      </div>
                      <div>
                        <div className="text-[10px] text-[#F78166] font-mono mb-1">{t('program.improve')}</div>
                        {midterm.areas_to_improve?.map((a: string, i: number) => (
                          <div key={i} className="text-[10px] text-[#8B949E]">→ {a}</div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-[#30363D] pt-2 mt-2">
                      <div className="text-[10px] text-[#8B949E] font-mono">👩‍💼 {t('program.pmAssessment')}</div>
                      <p className="text-[11px] text-[#8B949E] mt-1">{midterm.pm_notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Demo Day */}
              {demoday && (
                <div className="mb-6">
                  <h4 className="text-xs font-mono text-[#F78166] mb-3">🎤 {t('program.demodayTitle')} — Hafta 8</h4>
                  <div className="bg-[#0D1117] rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-md font-mono font-bold"
                        style={{ background: `${outcomeColor(demoday.program_outcome)}20`, color: outcomeColor(demoday.program_outcome) }}
                      >
                        {demoday.program_outcome}
                      </span>
                      <span className="text-sm font-bold font-mono" style={{ color: demoday.pitch_readiness >= 7 ? '#3FB950' : '#F78166' }}>
                        Pitch: {demoday.pitch_readiness}/10
                      </span>
                    </div>

                    <div>
                      <div className="text-[10px] text-[#8B949E] font-mono mb-1">{t('program.investorBrief')}</div>
                      <p className="text-[11px] text-[#E6EDF3] leading-relaxed">{demoday.investor_brief}</p>
                    </div>

                    <div>
                      <div className="text-[10px] text-[#8B949E] font-mono mb-1">{t('program.mentorRec')}</div>
                      <p className="text-[11px] text-[#8B949E] leading-relaxed">{demoday.mentor_recommendation}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] text-[#58A6FF] font-mono mb-1">{t('program.keyMetrics')}</div>
                        {demoday.key_metrics?.map((m: string, i: number) => (
                          <div key={i} className="text-[10px] text-[#8B949E]">📊 {m}</div>
                        ))}
                      </div>
                      <div>
                        <div className="text-[10px] text-[#3FB950] font-mono mb-1">{t('program.nextSteps')}</div>
                        {demoday.next_steps?.map((s: string, i: number) => (
                          <div key={i} className="text-[10px] text-[#8B949E]">→ {s}</div>
                        ))}
                      </div>
                    </div>

                    {demoday.ready_for?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {demoday.ready_for.map((r: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(88,166,255,0.1)] text-[#58A6FF]">{r}</span>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-[#30363D] pt-2 mt-2">
                      <div className="text-[10px] text-[#8B949E] font-mono">👩‍💼 {t('program.finalPmNotes')}</div>
                      <p className="text-[11px] text-[#8B949E] mt-1">{demoday.pm_final_notes}</p>
                    </div>
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
