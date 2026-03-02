'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Program } from '@/lib/supabase/types'

interface StageConfig {
  id: string
  emoji: string
  name: string
  color: string
}

const STAGES: StageConfig[] = [
  { id: 'interviews', emoji: '🤖', name: 'AI Interviews', color: '#58A6FF' },
  { id: 'jury', emoji: '⚖️', name: 'Jury Evaluation', color: '#D2A8FF' },
  { id: 'deliberation', emoji: '🗣', name: 'Deliberation', color: '#F78166' },
  { id: 'decision', emoji: '✅', name: 'Decisions', color: '#3FB950' },
  { id: 'kickoff', emoji: '🚀', name: 'Kickoff', color: '#58A6FF' },
  { id: 'demoday', emoji: '🎤', name: 'Demo Day', color: '#F78166' },
]

type StageStatus = 'pending' | 'running' | 'done' | 'error'

export default function DemoPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [currentStage, setCurrentStage] = useState(-1)
  const [stageStatuses, setStageStatuses] = useState<StageStatus[]>(STAGES.map(() => 'pending'))
  const [logs, setLogs] = useState<string[]>([])
  const [stats, setStats] = useState({ interviews: 0, accepted: 0, mentored: 0 })
  const logRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/auth/login?redirect=/${slug}/demo`); return }

      const { data: prog } = await supabase
        .from('programs')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!prog) { router.push('/'); return }
      setProgram(prog as Program)
      setLoading(false)
    }
    init()
  }, [slug])

  function addLog(msg: string) {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
    setTimeout(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
    }, 50)
  }

  function setStageStatus(index: number, status: StageStatus) {
    setStageStatuses(prev => {
      const next = [...prev]
      next[index] = status
      return next
    })
  }

  async function runFullDemo() {
    if (running || !program) return
    setRunning(true)
    setCompleted(false)
    setLogs([])
    setStageStatuses(STAGES.map(() => 'pending'))
    setStats({ interviews: 0, accepted: 0, mentored: 0 })

    // ========== STAGE 1: AI INTERVIEWS ==========
    const stageIdx_interviews = 0
    setCurrentStage(stageIdx_interviews)
    setStageStatus(stageIdx_interviews, 'running')
    addLog('🤖 Starting AI Interviews...')

    // Get test profiles
    const profilesRes = await fetch(`/api/test-agents/run`)
    const { profiles } = await profilesRes.json()
    addLog(`Found ${profiles.length} test agent profiles`)

    const interviewIds: string[] = []

    for (const profile of profiles) {
      addLog(`Starting interview: ${profile.emoji} ${profile.name}`)

      try {
        // Start interview
        const startRes = await fetch('/api/test-agents/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ program_id: program.id, profile_id: profile.id, action: 'start' }),
        })
        const startData = await startRes.json()
        if (!startRes.ok) { addLog(`  ⚠ Failed to start: ${startData.error}`); continue }

        const ivId = startData.interview_id
        interviewIds.push(ivId)
        let turn = 0
        let status = 'in_progress'

        // Turn loop
        while (status === 'in_progress' && turn < 15) {
          const turnRes = await fetch('/api/test-agents/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ program_id: program.id, profile_id: profile.id, interview_id: ivId, action: 'turn' }),
          })
          const turnData = await turnRes.json()
          if (!turnRes.ok) { addLog(`  ⚠ Turn error: ${turnData.error}`); break }
          status = turnData.status
          turn = turnData.turn || turn + 1
          addLog(`  Turn ${turn} complete ${status === 'completed' ? '✓' : ''}`)
        }

        addLog(`  ✅ ${profile.name} interview done (${turn} turns)`)
      } catch (err: any) {
        addLog(`  ❌ Error: ${err.message}`)
      }
    }

    setStats(prev => ({ ...prev, interviews: interviewIds.length }))
    setStageStatus(stageIdx_interviews, 'done')
    addLog(`🤖 Interviews complete: ${interviewIds.length} candidates\n`)

    // ========== STAGE 2: JURY EVALUATION ==========
    const stageIdx_jury = 1
    setCurrentStage(stageIdx_jury)
    setStageStatus(stageIdx_jury, 'running')
    addLog('⚖️ Starting Jury Evaluation...')

    // Re-fetch interviews to get completed ones
    const { data: allInterviews } = await supabase
      .from('interviews')
      .select('*')
      .eq('program_id', program.id)
      .eq('status', 'completed')

    const completedInterviews = (allInterviews || []).filter((iv: any) => {
      const msgs = iv.messages as any[] || []
      return msgs.length >= 4
    })

    addLog(`${completedInterviews.length} completed interviews to evaluate`)

    const juryIds = ['technical-jury', 'business-jury', 'vision-jury']

    for (const iv of completedInterviews) {
      for (const juryId of juryIds) {
        try {
          const res = await fetch('/api/jury/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interview_id: iv.id, jury_id: juryId }),
          })
          if (res.ok) {
            addLog(`  ${juryId === 'technical-jury' ? '🔬' : juryId === 'business-jury' ? '📊' : '🌟'} Evaluated ${(iv as any).candidate_name || 'Unknown'}`)
          } else {
            const err = await res.json()
            addLog(`  ⚠ ${juryId} failed for ${(iv as any).candidate_name}: ${err.error}`)
          }
        } catch (err: any) {
          addLog(`  ❌ Error: ${err.message}`)
        }
      }
    }

    setStageStatus(stageIdx_jury, 'done')
    addLog('⚖️ Jury evaluation complete\n')

    // ========== STAGE 3: DELIBERATION ==========
    const stageIdx_delib = 2
    setCurrentStage(stageIdx_delib)
    setStageStatus(stageIdx_delib, 'running')
    addLog('🗣 Starting Deliberation...')

    // Re-fetch to get jury evaluations
    const { data: juryInterviews } = await supabase
      .from('interviews')
      .select('*')
      .eq('program_id', program.id)
      .eq('status', 'completed')

    const withJury = (juryInterviews || []).filter((iv: any) => {
      const evals = iv.jury_evaluations as any[] || []
      return evals.length >= 2
    })

    for (const iv of withJury) {
      for (const juryId of juryIds) {
        try {
          const res = await fetch('/api/jury/deliberate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interview_id: iv.id, jury_id: juryId }),
          })
          if (res.ok) {
            addLog(`  ${juryId === 'technical-jury' ? '🔬' : juryId === 'business-jury' ? '📊' : '🌟'} Deliberated on ${(iv as any).candidate_name || 'Unknown'}`)
          }
        } catch (err: any) {
          addLog(`  ⚠ ${err.message}`)
        }
      }
    }

    setStageStatus(stageIdx_delib, 'done')
    addLog('🗣 Deliberation complete\n')

    // ========== STAGE 4: DECISION ==========
    const stageIdx_decide = 3
    setCurrentStage(stageIdx_decide)
    setStageStatus(stageIdx_decide, 'running')
    addLog('✅ Running Decision Engine...')

    try {
      const res = await fetch('/api/program/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: program.id }),
      })
      const data = await res.json()
      if (res.ok) {
        const accepted = data.results?.filter((r: any) => r.decision === 'ACCEPT')?.length || 0
        const waitlisted = data.results?.filter((r: any) => r.decision === 'WAITLIST')?.length || 0
        const rejected = data.results?.filter((r: any) => r.decision === 'REJECT')?.length || 0
        addLog(`  ✅ ${accepted} ACCEPTED | ⏳ ${waitlisted} WAITLIST | ❌ ${rejected} REJECTED`)
        setStats(prev => ({ ...prev, accepted }))
      } else {
        addLog(`  ⚠ Decision error: ${data.error}`)
      }
    } catch (err: any) {
      addLog(`  ❌ Error: ${err.message}`)
    }

    setStageStatus(stageIdx_decide, 'done')
    addLog('✅ Decisions complete\n')

    // ========== STAGE 5: KICKOFF ==========
    const stageIdx_kickoff = 4
    setCurrentStage(stageIdx_kickoff)
    setStageStatus(stageIdx_kickoff, 'running')
    addLog('🚀 Running Kickoff (accepted candidates)...')

    // Re-fetch to get decisions
    const { data: decidedInterviews } = await supabase
      .from('interviews')
      .select('*')
      .eq('program_id', program.id)

    const acceptedCandidates = (decidedInterviews || []).filter((iv: any) => iv.decision === 'ACCEPT')
    addLog(`${acceptedCandidates.length} accepted founders entering the program`)

    let mentoredCount = 0
    for (const iv of acceptedCandidates) {
      try {
        const res = await fetch('/api/program/kickoff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interview_id: iv.id }),
        })
        const data = await res.json()
        if (res.ok) {
          addLog(`  🚀 ${data.candidate_name} → ${data.mentor?.emoji} ${data.mentor?.name}`)
          mentoredCount++
        } else {
          addLog(`  ⚠ Kickoff failed: ${data.error}`)
        }
      } catch (err: any) {
        addLog(`  ❌ Error: ${err.message}`)
      }
    }

    setStats(prev => ({ ...prev, mentored: mentoredCount }))
    setStageStatus(stageIdx_kickoff, 'done')
    addLog('🚀 Kickoff complete\n')

    // ========== STAGE 6: DEMO DAY ==========
    const stageIdx_demoday = 5
    setCurrentStage(stageIdx_demoday)
    setStageStatus(stageIdx_demoday, 'running')
    addLog('🎤 Running Demo Day (final reports)...')

    // Re-fetch for kickoff data
    const { data: kickoffInterviews } = await supabase
      .from('interviews')
      .select('*')
      .eq('program_id', program.id)

    const withKickoff = (kickoffInterviews || []).filter((iv: any) => iv.kickoff_notes)

    for (const iv of withKickoff) {
      try {
        const res = await fetch('/api/program/demoday', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interview_id: iv.id }),
        })
        const data = await res.json()
        if (res.ok) {
          addLog(`  🎤 ${data.candidate_name} — Pitch: ${data.demoday_report?.pitch_readiness}/10 — ${data.demoday_report?.program_outcome}`)
        } else {
          addLog(`  ⚠ Demo Day failed: ${data.error}`)
        }
      } catch (err: any) {
        addLog(`  ❌ Error: ${err.message}`)
      }
    }

    setStageStatus(stageIdx_demoday, 'done')
    addLog('🎤 Demo Day complete\n')

    // ========== DONE ==========
    setCurrentStage(6)
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    addLog('🎉 FULL SIMULATION COMPLETE')
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    setRunning(false)
    setCompleted(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] flex items-center justify-center">
        <div className="text-[#8B949E] font-mono text-sm animate-pulse">Loading demo...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3]">
      {/* Header */}
      <header className="border-b border-[#30363D] p-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <div className="w-8 h-8 bg-gradient-to-br from-[#58A6FF] to-[#F78166] rounded-lg flex items-center justify-center font-mono font-bold text-sm text-[#0D1117]">
            {program?.name?.[0] || 'S'}
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-semibold">{program?.name}</h1>
            <span className="text-[10px] text-[#8B949E] font-mono">Full Pipeline Demo</span>
          </div>
          <button
            onClick={() => router.push(`/${slug}/dashboard`)}
            className="text-xs text-[#8B949E] hover:text-[#58A6FF] transition-colors"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-10 px-4">
          {STAGES.map((stage, i) => {
            const status = stageStatuses[i]
            const isActive = currentStage === i
            const isDone = status === 'done'

            return (
              <div key={stage.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 ${
                      isDone ? 'bg-[#3FB950] scale-110' :
                      isActive ? 'ring-2 ring-offset-2 ring-offset-[#0D1117] animate-pulse' :
                      'bg-[#161B22] border border-[#30363D]'
                    }`}
                    style={{
                      background: isActive && !isDone ? `${stage.color}33` : undefined,
                    }}
                  >
                    {isDone ? '✓' : stage.emoji}
                  </div>
                  <span className={`text-[10px] font-mono mt-2 transition-colors ${
                    isDone ? 'text-[#3FB950]' : isActive ? 'text-[#E6EDF3]' : 'text-[#484F58]'
                  }`}>
                    {stage.name}
                  </span>
                </div>
                {i < STAGES.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mt-[-16px] transition-colors duration-500 ${
                    stageStatuses[i] === 'done' ? 'bg-[#3FB950]' : 'bg-[#30363D]'
                  }`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Start Button / Stats */}
        {!running && !completed && (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">▶️</div>
            <h2 className="text-2xl font-bold mb-2">
              <span className="bg-gradient-to-r from-[#58A6FF] to-[#F78166] bg-clip-text text-transparent">
                Run Full Pipeline Demo
              </span>
            </h2>
            <p className="text-[#8B949E] text-sm mb-8 max-w-md mx-auto">
              6 AI aday mülakatı → Jüri değerlendirmesi → Deliberasyon → Karar → Mentor eşleştirme → Demo Day raporları
            </p>
            <button
              onClick={runFullDemo}
              className="bg-[#58A6FF] text-[#0D1117] px-8 py-3 rounded-xl font-semibold text-sm hover:bg-[#79B8FF] transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Start Full Simulation
            </button>
            <p className="text-[10px] text-[#484F58] font-mono mt-4">Estimated time: 5-8 minutes</p>
          </div>
        )}

        {/* Completed Stats */}
        {completed && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 text-center">
              <div className="text-3xl font-bold font-mono text-[#58A6FF]">{stats.interviews}</div>
              <div className="text-xs text-[#8B949E] mt-1">Interviews Completed</div>
            </div>
            <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 text-center">
              <div className="text-3xl font-bold font-mono text-[#3FB950]">{stats.accepted}</div>
              <div className="text-xs text-[#8B949E] mt-1">Founders Accepted</div>
            </div>
            <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 text-center">
              <div className="text-3xl font-bold font-mono text-[#F78166]">{stats.mentored}</div>
              <div className="text-xs text-[#8B949E] mt-1">Mentors Assigned</div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {completed && (
          <div className="flex gap-3 justify-center mb-8">
            <button
              onClick={() => router.push(`/${slug}/dashboard`)}
              className="bg-[#161B22] border border-[#30363D] text-[#E6EDF3] px-5 py-2.5 rounded-lg text-sm hover:border-[#58A6FF] transition-colors"
            >
              📋 Dashboard
            </button>
            <button
              onClick={() => router.push(`/${slug}/results`)}
              className="bg-[#161B22] border border-[#30363D] text-[#E6EDF3] px-5 py-2.5 rounded-lg text-sm hover:border-[#3FB950] transition-colors"
            >
              📊 Results
            </button>
            <button
              onClick={() => router.push(`/${slug}/program`)}
              className="bg-[#161B22] border border-[#30363D] text-[#E6EDF3] px-5 py-2.5 rounded-lg text-sm hover:border-[#F78166] transition-colors"
            >
              🎓 Program
            </button>
            <button
              onClick={() => { setCompleted(false); setCurrentStage(-1); setStageStatuses(STAGES.map(() => 'pending')); setLogs([]) }}
              className="bg-[#161B22] border border-[#30363D] text-[#8B949E] px-5 py-2.5 rounded-lg text-sm hover:border-[#8B949E] transition-colors"
            >
              🔄 Run Again
            </button>
          </div>
        )}

        {/* Terminal Log */}
        {logs.length > 0 && (
          <div className="bg-[#0D1117] border border-[#30363D] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#161B22] border-b border-[#30363D]">
              <div className="w-3 h-3 rounded-full bg-[#F85149]" />
              <div className="w-3 h-3 rounded-full bg-[#F78166]" />
              <div className="w-3 h-3 rounded-full bg-[#3FB950]" />
              <span className="text-[10px] text-[#8B949E] font-mono ml-2">pipeline.log</span>
              {running && <span className="text-[10px] text-[#3FB950] font-mono ml-auto animate-pulse">● RUNNING</span>}
            </div>
            <div
              ref={logRef}
              className="p-4 font-mono text-xs leading-relaxed max-h-[400px] overflow-y-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#30363D transparent' }}
            >
              {logs.map((log, i) => (
                <div key={i} className={`${
                  log.includes('❌') ? 'text-[#F85149]' :
                  log.includes('✅') || log.includes('COMPLETE') ? 'text-[#3FB950]' :
                  log.includes('⚠') ? 'text-[#F78166]' :
                  log.includes('Starting') || log.includes('Running') ? 'text-[#58A6FF]' :
                  log.startsWith('━') ? 'text-[#D2A8FF]' :
                  'text-[#8B949E]'
                }`}>
                  {log}
                </div>
              ))}
              {running && (
                <div className="text-[#58A6FF] animate-pulse mt-1">▋</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
