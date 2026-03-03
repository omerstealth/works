'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n'
import Navbar from '@/components/Navbar'
import type { Program, Interview, Evaluation, JuryEvaluation, DeliberationNote } from '@/lib/supabase/types'

interface TestAgentProfile {
  id: string
  name: string
  emoji: string
  description: string
  language: string
  expectedScore: string
}

interface AIProfileItem {
  id: string
  name: string
  emoji: string
  title: string
  description: string
  roles: ('jury' | 'mentor')[]
  expertise: string[]
}

// Keep for backward compat
interface JuryMember {
  id: string
  name: string
  emoji: string
  title: string
  description: string
}

export default function DashboardPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useLanguage()
  const slug = params.slug as string

  const [program, setProgram] = useState<Program | null>(null)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Test agents state
  const [showTestPanel, setShowTestPanel] = useState(false)
  const [testProfiles, setTestProfiles] = useState<TestAgentProfile[]>([])
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([])
  const [testRunning, setTestRunning] = useState(false)
  const [testProgress, setTestProgress] = useState('')
  const [testResults, setTestResults] = useState<any>(null)

  // AI profiles & Jury state
  const [aiProfiles, setAiProfiles] = useState<AIProfileItem[]>([])
  const [juryMembers, setJuryMembers] = useState<JuryMember[]>([])
  const [juryRunning, setJuryRunning] = useState(false)
  const [juryProgress, setJuryProgress] = useState('')

  // Pipeline state
  const [deliberating, setDeliberating] = useState(false)
  const [deciding, setDeciding] = useState(false)
  const [pipelineProgress, setPipelineProgress] = useState('')

  // User / owner state
  const [ownerName, setOwnerName] = useState<string | null>(null)
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null)

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Jury/Mentor members state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteRole, setInviteRole] = useState<'jury' | 'mentor'>('jury')
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [humanMembers, setHumanMembers] = useState<any[]>([])
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/auth/login?redirect=/${slug}/dashboard`)
        return
      }
      setAuthChecked(true)
      setOwnerName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || null)
      setOwnerEmail(user.email || null)

      const { data: prog } = await supabase
        .from('programs')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!prog) {
        router.push('/')
        return
      }
      setProgram(prog as Program)

      const { data: ints } = await supabase
        .from('interviews')
        .select('*')
        .eq('program_id', prog.id)
        .order('started_at', { ascending: false })

      setInterviews((ints || []) as Interview[])
      setLoading(false)

      // Load test agent profiles
      const profilesRes = await fetch('/api/test-agents/run')
      if (profilesRes.ok) {
        const data = await profilesRes.json()
        setTestProfiles(data.profiles || [])
      }

      // Load jury members
      const juryRes = await fetch('/api/jury/evaluate')
      if (juryRes.ok) {
        const data = await juryRes.json()
        setJuryMembers(data.jury || [])
        setAiProfiles(data.ai_profiles || [])
      }

      // Load human members (jury + mentor)
      loadMembers(prog.id)
    }
    init()
  }, [slug])

  async function loadMembers(progId?: string) {
    const pid = progId || program?.id
    if (!pid) return
    try {
      const res = await fetch(`/api/program/members?program_id=${pid}`)
      if (res.ok) {
        const data = await res.json()
        // Filter out owners; normalize roles (support both old 'role' and new 'roles' field)
        setHumanMembers((data.members || []).filter((m: any) => {
          const roles = m.roles || [m.role || 'viewer']
          return !roles.includes('owner')
        }).map((m: any) => ({
          ...m,
          roles: m.roles || [m.role || 'viewer'],
        })))
      }
    } catch {}
  }

  async function inviteMember() {
    if (!program || !inviteName || inviting) return
    setInviting(true)
    setInviteError('')
    try {
      const res = await fetch('/api/program/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: program.id,
          role: inviteRole,
          display_name: inviteName,
          email: inviteEmail || null,
        }),
      })
      if (res.ok) {
        await loadMembers()
        setInviteName('')
        setInviteEmail('')
        setInviteError('')
        setShowInviteModal(false)
      } else {
        const data = await res.json().catch(() => ({}))
        setInviteError(data.error || `Hata: ${res.status}`)
      }
    } catch (err: any) {
      setInviteError(err.message || 'Bağlantı hatası')
    }
    setInviting(false)
  }

  async function removeMember(memberId: string) {
    try {
      await fetch(`/api/program/members?member_id=${memberId}`, { method: 'DELETE' })
      await loadMembers()
    } catch {}
  }

  async function runTestAgents() {
    if (!program || testRunning) return
    setTestRunning(true)
    setTestResults(null)

    const profilesToRun = selectedProfiles.length > 0
      ? testProfiles.filter(p => selectedProfiles.includes(p.id))
      : testProfiles

    const results: any[] = []

    for (let i = 0; i < profilesToRun.length; i++) {
      const profile = profilesToRun[i]
      setTestProgress(`[${i + 1}/${profilesToRun.length}] ${t('dashboard.interviewStarting')}: ${profile.emoji} ${profile.name}...`)

      try {
        const startRes = await fetch('/api/test-agents/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ program_id: program.id, profile_id: profile.id, action: 'start' }),
        })
        const startData = await startRes.json()
        if (startData.error) {
          results.push({ name: profile.name, expectedScore: profile.expectedScore, success: false, error: startData.error })
          continue
        }

        const interviewId = startData.interview_id
        let status = startData.status
        let turn = 0

        while (status === 'in_progress' && turn < 15) {
          setTestProgress(`[${i + 1}/${profilesToRun.length}] ${profile.emoji} ${profile.name} — ${t('dashboard.turn')} ${turn + 1}...`)
          const turnRes = await fetch('/api/test-agents/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ program_id: program.id, profile_id: profile.id, action: 'turn', interview_id: interviewId }),
          })
          const turnData = await turnRes.json()
          if (turnData.error) {
            results.push({ name: profile.name, expectedScore: profile.expectedScore, success: false, error: turnData.error })
            status = 'error'
            break
          }
          status = turnData.status
          turn = turnData.turn
        }

        if (status === 'completed') {
          results.push({ name: profile.name, expectedScore: profile.expectedScore, success: true })
        }
      } catch (err: any) {
        results.push({ name: profile.name, expectedScore: profile.expectedScore, success: false, error: err.message })
      }

      setTestResults({ results: [...results], total: profilesToRun.length, successful: results.filter(r => r.success).length })
    }

    const successCount = results.filter(r => r.success).length
    setTestProgress(`${t('dashboard.completed')}! ${successCount}/${profilesToRun.length} ${t('dashboard.interviewsDone')}`)
    setTestResults({ results, total: profilesToRun.length, successful: successCount })

    const { data: ints } = await supabase
      .from('interviews')
      .select('*')
      .eq('program_id', program.id)
      .order('started_at', { ascending: false })
    setInterviews((ints || []) as Interview[])
    setTestRunning(false)
  }

  async function runJuryForAll() {
    if (!program || juryRunning) return
    setJuryRunning(true)
    setJuryProgress(t('dashboard.juryStarting'))

    const interviewsWithMessages = interviews.filter(iv =>
      (iv.messages as any[])?.length >= 4
    )

    let completed = 0
    const total = interviewsWithMessages.length * juryMembers.length

    for (let i = 0; i < interviewsWithMessages.length; i++) {
      const iv = interviewsWithMessages[i]
      for (let j = 0; j < juryMembers.length; j++) {
        const jury = juryMembers[j]
        setJuryProgress(`${jury.emoji} ${jury.name} değerlendiriyor ${iv.candidate_name || 'Unknown'}... (${completed + 1}/${total})`)

        try {
          await fetch('/api/jury/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interview_id: iv.id, jury_id: jury.id }),
          })
        } catch {
          // continue on error
        }
        completed++
      }
    }

    setJuryProgress(`${t('dashboard.completed')}! ${total} ${t('dashboard.juryDone')}`)

    // Reload interviews
    const { data: ints } = await supabase
      .from('interviews')
      .select('*')
      .eq('program_id', program.id)
      .order('started_at', { ascending: false })
    setInterviews((ints || []) as Interview[])
    setJuryRunning(false)
  }

  async function runJuryForOne(interviewId: string) {
    if (!program || juryRunning) return
    setJuryRunning(true)

    for (const jury of juryMembers) {
      setJuryProgress(`${jury.emoji} ${jury.name} evaluating...`)
      try {
        await fetch('/api/jury/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interview_id: interviewId, jury_id: jury.id }),
        })
      } catch {
        // continue
      }
    }

    setJuryProgress('')
    setJuryRunning(false)

    // Reload interviews and update selected
    const { data: ints } = await supabase
      .from('interviews')
      .select('*')
      .eq('program_id', program.id)
      .order('started_at', { ascending: false })
    const updated = (ints || []) as Interview[]
    setInterviews(updated)
    if (selectedInterview) {
      setSelectedInterview(updated.find(iv => iv.id === selectedInterview.id) || null)
    }
  }

  async function runDeliberation() {
    if (!program || deliberating) return
    setDeliberating(true)

    const interviewsWithJury = interviews.filter(iv => {
      const evals = (iv as any).jury_evaluations as JuryEvaluation[] | undefined
      return evals != null && evals.length >= 2
    })

    let completed = 0
    const total = interviewsWithJury.length * juryMembers.length

    for (const iv of interviewsWithJury) {
      for (const jury of juryMembers) {
        setPipelineProgress(`🗣 ${jury.emoji} ${jury.name} deliberating on ${iv.candidate_name}... (${completed + 1}/${total})`)
        try {
          await fetch('/api/jury/deliberate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interview_id: iv.id, jury_id: jury.id }),
          })
        } catch { /* continue */ }
        completed++
      }
    }

    setPipelineProgress('🗣 Deliberation complete!')

    const { data: ints } = await supabase
      .from('interviews')
      .select('*')
      .eq('program_id', program.id)
      .order('started_at', { ascending: false })
    setInterviews((ints || []) as Interview[])
    setDeliberating(false)
  }

  async function runDecisions() {
    if (!program || deciding) return
    setDeciding(true)
    setPipelineProgress('✅ Making final decisions...')

    try {
      const res = await fetch('/api/program/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: program.id }),
      })
      const data = await res.json()
      if (data.error) {
        setPipelineProgress(`Error: ${data.error}`)
      } else {
        setPipelineProgress(`✅ Decisions: ${data.accepted} accepted, ${data.waitlisted} waitlisted, ${data.rejected} rejected`)
      }
    } catch (err: any) {
      setPipelineProgress(`Error: ${err.message}`)
    }

    const { data: ints } = await supabase
      .from('interviews')
      .select('*')
      .eq('program_id', program.id)
      .order('started_at', { ascending: false })
    setInterviews((ints || []) as Interview[])
    setDeciding(false)
  }

  function toggleProfile(id: string) {
    setSelectedProfiles(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] flex items-center justify-center">
        <div className="text-[#8B949E] font-mono text-sm">{t('dashboard.loading')}</div>
      </div>
    )
  }

  const withMessages = interviews.filter(iv => (iv.messages as any[])?.length >= 4)
  const completed = interviews.filter(i => i.status === 'completed')
  const strongYes = completed.filter(i => i.recommendation === 'STRONG_YES').length
  const yes = completed.filter(i => i.recommendation === 'YES').length
  const maybe = completed.filter(i => i.recommendation === 'MAYBE').length
  const avgScore = completed.length > 0
    ? (completed.reduce((s, i) => s + (i.overall_score || 0), 0) / completed.length).toFixed(1)
    : '-'

  // Sort by jury avg score first, then overall score
  const sorted = [...withMessages].sort((a, b) => {
    const aScore = (a as any).jury_avg_score || a.overall_score || 0
    const bScore = (b as any).jury_avg_score || b.overall_score || 0
    return bScore - aScore
  })

  const scoreColor = (s: number) => (s >= 8 ? '#3FB950' : s >= 6 ? '#58A6FF' : '#F78166')
  const recColor: Record<string, string> = { STRONG_YES: '#3FB950', YES: '#58A6FF', MAYBE: '#F78166', NO: '#F85149' }
  const expectedColor: Record<string, string> = { high: '#3FB950', medium: '#F78166', low: '#F85149' }

  function exportJSON() {
    const data = JSON.stringify(interviews, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug}_interviews.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function deleteProgram() {
    if (!program || deleting) return
    setDeleting(true)
    try {
      const res = await fetch('/api/program/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: program.id }),
      })
      const data = await res.json()
      if (data.success) {
        router.push('/my-programs')
      } else {
        alert(data.error || 'Failed to delete')
        setDeleting(false)
      }
    } catch (err: any) {
      alert(err.message)
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] p-6">
      <Navbar slug={slug} />

      {/* Header with program name and action buttons */}
      <header className="flex items-center gap-4 mb-8 pb-4 border-b border-[#30363D]">
        <div className="w-10 h-10 bg-gradient-to-br from-[#58A6FF] to-[#F78166] rounded-[10px] flex items-center justify-center font-mono font-bold text-lg text-[#0D1117]">
          {program?.name?.[0] || 'S'}
        </div>
        <div>
          <h1 className="text-lg font-semibold">{program?.name}</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8B949E] font-mono">{t('dashboard.subtitle')}</span>
            {ownerName && (
              <span className="text-xs text-[#8B949E]">
                · <span className="text-[#58A6FF]">{ownerName}</span>
              </span>
            )}
          </div>
        </div>
        <div className="ml-auto flex flex-col sm:flex-row gap-2 items-end sm:items-center">
          {/* Pipeline actions */}
          <div className="flex gap-1.5 flex-wrap justify-end">
            <button
              onClick={() => setShowTestPanel(!showTestPanel)}
              className={`border px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                showTestPanel
                  ? 'bg-[#58A6FF] border-[#58A6FF] text-[#0D1117]'
                  : 'bg-[#161B22] border-[#30363D] text-[#8B949E] hover:border-[#58A6FF] hover:text-[#58A6FF]'
              }`}
            >
              🤖 {t('dashboard.testAgents')}
            </button>
            <button
              onClick={runJuryForAll}
              disabled={juryRunning || withMessages.length === 0}
              className="bg-[#DA7756] text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-[#E08B6D] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {juryRunning ? `⚖️ ${t('dashboard.jury')}...` : `⚖️ ${t('dashboard.jury')} (${withMessages.length})`}
            </button>
            <button
              onClick={runDeliberation}
              disabled={deliberating || interviews.filter(iv => ((iv as any).jury_evaluations)?.length >= 2).length === 0}
              className="bg-[#8B5CF6] text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-[#A78BFA] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deliberating ? `🗣 ${t('dashboard.deliberating')}...` : `🗣 ${t('dashboard.deliberate')}`}
            </button>
            <button
              onClick={runDecisions}
              disabled={deciding}
              className="bg-[#3FB950] text-[#0D1117] px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-[#56D364] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deciding ? `✅ ${t('dashboard.deciding')}...` : `✅ ${t('dashboard.decide')}`}
            </button>
          </div>
          {/* Utilities */}
          <div className="flex gap-1.5">
            <button
              onClick={exportJSON}
              className="bg-[#161B22] border border-[#30363D] text-[#8B949E] px-3 py-1.5 rounded-md text-xs hover:border-[#58A6FF] hover:text-[#58A6FF] transition-colors"
            >
              {t('common.exportJson')}
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-[#161B22] border border-[#30363D] text-[#F85149] px-3 py-1.5 rounded-md text-xs hover:border-[#F85149] hover:bg-[rgba(248,81,73,0.1)] transition-colors"
            >
              🗑
            </button>
          </div>
        </div>
      </header>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="bg-[#161B22] border border-[#F85149] rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-lg font-semibold text-[#F85149] mb-2">{t('dashboard.deleteConfirmTitle')}</h3>
              <p className="text-sm text-[#8B949E] mb-1">{program?.name}</p>
              <p className="text-xs text-[#8B949E] mb-6">{t('dashboard.deleteConfirmDesc')}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-5 py-2 rounded-lg text-sm font-medium bg-[#0D1117] border border-[#30363D] text-[#E6EDF3] hover:border-[#58A6FF] transition-colors disabled:opacity-50"
                >
                  {t('dashboard.deleteCancel')}
                </button>
                <button
                  onClick={deleteProgram}
                  disabled={deleting}
                  className="px-5 py-2 rounded-lg text-sm font-bold bg-[#F85149] text-white hover:bg-[#FF6B61] transition-colors disabled:opacity-50"
                >
                  {deleting ? t('dashboard.deleting') : t('dashboard.deleteConfirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Jury Progress */}
      {juryProgress && (
        <div className={`text-sm font-mono p-3 rounded-lg mb-4 ${
          juryProgress.startsWith('Done') ? 'bg-[rgba(63,185,80,0.1)] text-[#3FB950]' : 'bg-[rgba(218,119,86,0.1)] text-[#DA7756]'
        }`}>
          {juryRunning && <span className="inline-block w-2 h-2 bg-[#DA7756] rounded-full animate-pulse mr-2" />}
          {juryProgress}
        </div>
      )}

      {/* Pipeline Progress */}
      {pipelineProgress && (
        <div className={`text-sm font-mono p-3 rounded-lg mb-4 ${
          pipelineProgress.startsWith('Error') ? 'bg-[rgba(248,81,73,0.1)] text-[#F85149]'
            : pipelineProgress.startsWith('✅') ? 'bg-[rgba(63,185,80,0.1)] text-[#3FB950]'
            : 'bg-[rgba(139,92,246,0.1)] text-[#8B5CF6]'
        }`}>
          {(deliberating || deciding) && <span className="inline-block w-2 h-2 bg-[#8B5CF6] rounded-full animate-pulse mr-2" />}
          {pipelineProgress}
        </div>
      )}

      {/* Test Agents Panel */}
      {showTestPanel && (
        <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2">
                🤖 {t('dashboard.testAgentsTitle')}
              </h2>
              <p className="text-xs text-[#8B949E] mt-1">
                {t('dashboard.testAgentsDesc')}
              </p>
            </div>
            <button
              onClick={runTestAgents}
              disabled={testRunning}
              className="bg-[#58A6FF] text-[#0D1117] px-5 py-2 rounded-lg text-sm font-bold transition-all hover:bg-[#79B8FF] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testRunning ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-[#0D1117] border-t-transparent rounded-full animate-spin" />
                  {t('dashboard.running')}
                </span>
              ) : (
                `${t('dashboard.runAgents')} ${selectedProfiles.length || t('dashboard.allAgents')}`
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
            {testProfiles.map((p) => (
              <div
                key={p.id}
                onClick={() => toggleProfile(p.id)}
                className={`p-3 rounded-lg cursor-pointer border transition-all ${
                  selectedProfiles.includes(p.id) || selectedProfiles.length === 0
                    ? 'bg-[#0D1117] border-[#58A6FF]'
                    : 'bg-[#0D1117] border-[#30363D] opacity-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{p.emoji}</span>
                  <span className="text-sm font-semibold">{p.name}</span>
                  <span
                    className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-mono font-bold"
                    style={{ background: `${expectedColor[p.expectedScore]}22`, color: expectedColor[p.expectedScore] }}
                  >
                    {p.expectedScore.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-[#8B949E] leading-relaxed">{p.description}</p>
                <div className="text-[10px] text-[#8B949E] font-mono mt-1">{p.language.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {testProgress && (
            <div className={`text-sm font-mono p-3 rounded-lg ${
              testProgress.startsWith('Error') ? 'bg-[rgba(248,81,73,0.1)] text-[#F85149]' : 'bg-[rgba(88,166,255,0.1)] text-[#58A6FF]'
            }`}>
              {testRunning && <span className="inline-block w-2 h-2 bg-[#58A6FF] rounded-full animate-pulse mr-2" />}
              {testProgress}
            </div>
          )}

          {testResults && (
            <div className="mt-3 space-y-2">
              {testResults.results?.map((r: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className={`w-2 h-2 rounded-full ${r.success ? 'bg-[#3FB950]' : 'bg-[#F85149]'}`} />
                  <span className="font-semibold">{r.name}</span>
                  <span className="text-[#8B949E] font-mono">${t('dashboard.expected')}: {r.expectedScore}</span>
                  {r.success ? (
                    <span className="text-[#3FB950]">{t('dashboard.completed')}</span>
                  ) : (
                    <span className="text-[#F85149]">{r.error}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Jury & Mentor Panel */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            ⚖️ {t('dashboard.juryPanel')}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => { setInviteRole('jury'); setShowInviteModal(true) }}
              className="text-xs font-medium text-[#58A6FF] hover:text-[#79B8FF] transition-colors"
            >
              + {t('dashboard.inviteJury')}
            </button>
            <button
              onClick={() => { setInviteRole('mentor'); setShowInviteModal(true) }}
              className="text-xs font-medium text-[#D2A8FF] hover:text-[#E0C0FF] transition-colors"
            >
              + {t('dashboard.addMentor')}
            </button>
          </div>
        </div>

        {/* AI Members */}
        <div className="flex flex-wrap gap-2 mb-3">
          {aiProfiles.map(p => (
            <div key={p.id} className="flex items-center gap-2 bg-[#0D1117] rounded-lg px-3 py-1.5 text-xs">
              <span>{p.emoji}</span>
              <span className="font-medium">{p.name}</span>
              <span className="text-[10px] text-[#8B949E] bg-[#30363D] px-1.5 py-0.5 rounded">AI</span>
              {p.roles.map(r => (
                <span key={r} className={`text-[10px] px-1.5 py-0.5 rounded ${
                  r === 'jury' ? 'text-[#58A6FF] bg-[#58A6FF]/10' : 'text-[#D2A8FF] bg-[#D2A8FF]/10'
                }`}>
                  {r === 'jury' ? 'Jüri' : 'Mentor'}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* Human Members — each person shown once with all their role badges */}
        {humanMembers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {humanMembers.map(m => (
              <div key={m.id} className="flex items-center gap-2 bg-[#0D1117] rounded-lg px-3 py-1.5 text-xs group">
                <span>{(m.roles || []).includes('mentor') ? '🧑‍🏫' : '👤'}</span>
                <span className="font-medium">{m.display_name}</span>
                <span className="text-[10px] text-[#3FB950] bg-[#3FB950]/10 px-1.5 py-0.5 rounded">{t('dashboard.humanLabel')}</span>
                {(m.roles || []).map((r: string) => (
                  <span key={r} className={`text-[10px] px-1.5 py-0.5 rounded ${
                    r === 'jury' ? 'text-[#58A6FF] bg-[#58A6FF]/10' : 'text-[#D2A8FF] bg-[#D2A8FF]/10'
                  }`}>
                    {r === 'jury' ? 'Jüri' : 'Mentor'}
                  </span>
                ))}
                <button onClick={() => removeMember(m.id)} className="text-[#F85149] opacity-0 group-hover:opacity-100 transition-opacity ml-1">×</button>
              </div>
            ))}
          </div>
        )}

        {humanMembers.length === 0 && (
          <div className="text-xs text-[#484F58] mt-1">
            {t('dashboard.noMentorsYet')}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowInviteModal(false)}>
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-4">
              {inviteRole === 'jury' ? t('dashboard.inviteJury') : t('dashboard.inviteMentor')}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#8B949E] mb-1 block">{t('dashboard.memberName')} *</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder={inviteRole === 'jury' ? 'Dr. Ayşe Yılmaz' : 'Mehmet Kaya'}
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-sm text-[#E6EDF3] placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF]"
                />
              </div>
              <div>
                <label className="text-xs text-[#8B949E] mb-1 block">{t('dashboard.memberEmail')}</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-sm text-[#E6EDF3] placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF]"
                />
              </div>
              {inviteError && (
                <div className="text-xs text-[#F85149] bg-[#F8514920] border border-[#F8514940] rounded-lg px-3 py-2">
                  {inviteError}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setShowInviteModal(false); setInviteError('') }} className="flex-1 py-2 rounded-lg text-xs font-medium border border-[#30363D] text-[#8B949E] hover:border-[#58A6FF] transition-colors">
                  {t('dashboard.deleteCancel')}
                </button>
                <button
                  onClick={inviteMember}
                  disabled={!inviteName || inviting}
                  className="flex-1 py-2 rounded-lg text-xs font-bold bg-[#58A6FF] text-[#0D1117] hover:bg-[#79B8FF] disabled:opacity-50 transition-colors"
                >
                  {inviting ? '...' : t('dashboard.inviteBtn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {[
          { n: interviews.length, label: t('dashboard.total'), color: '#E6EDF3' },
          { n: strongYes, label: t('dashboard.strongYes'), color: '#3FB950' },
          { n: yes, label: t('dashboard.yes'), color: '#58A6FF' },
          { n: maybe, label: t('dashboard.maybe'), color: '#F78166' },
          { n: avgScore, label: t('dashboard.avgScore'), color: '#E6EDF3' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#161B22] border border-[#30363D] rounded-[10px] p-4 text-center">
            <div className="text-[28px] font-bold font-mono" style={{ color: stat.color }}>{stat.n}</div>
            <div className="text-[11px] text-[#8B949E] mt-1 font-mono">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Cards Grid */}
      {sorted.length === 0 ? (
        <div className="max-w-lg mx-auto py-12">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🚀</div>
            <h2 className="text-xl font-semibold text-[#E6EDF3] mb-2">{t('dashboard.onboardTitle')}</h2>
          </div>

          {/* Step 1: Interview link (PRIMARY) */}
          <div className="bg-[#161B22] border border-[#58A6FF]/30 rounded-xl p-5 mb-4">
            <div className="flex items-start gap-4 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#58A6FF] flex items-center justify-center text-xs font-bold text-[#0D1117] flex-shrink-0">1</div>
              <p className="text-sm text-[#E6EDF3] pt-1">🔗 {t('dashboard.onboardStep1')}</p>
            </div>
            <div className="flex items-center gap-2 ml-12">
              <code className="flex-1 bg-[#0D1117] rounded-lg px-3 py-2 text-xs font-mono text-[#58A6FF] truncate">
                {typeof window !== 'undefined' ? window.location.origin : ''}/{slug}/interview
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/${slug}/interview`)
                  const btn = document.getElementById('copy-btn')
                  if (btn) { btn.textContent = t('dashboard.copied'); setTimeout(() => { btn.textContent = t('dashboard.copyLink') }, 2000) }
                }}
                id="copy-btn"
                className="px-3 py-2 rounded-lg text-xs font-medium bg-[#58A6FF] text-[#0D1117] hover:bg-[#79B8FF] transition-colors whitespace-nowrap"
              >
                {t('dashboard.copyLink')}
              </button>
            </div>
          </div>

          {/* Step 2 & 3: Secondary */}
          <div className="space-y-3 mb-4">
            {[
              { num: '2', emoji: '🤖', text: t('dashboard.onboardStep2'), action: () => setShowTestPanel(true), btn: t('dashboard.testAgents') },
              { num: '3', emoji: '⚖️', text: t('dashboard.onboardStep3'), action: null, btn: null },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-4 bg-[#161B22] border border-[#30363D] rounded-xl p-4">
                <div className="w-8 h-8 rounded-full bg-[#30363D]/50 border border-[#30363D] flex items-center justify-center text-xs font-bold text-[#8B949E] flex-shrink-0">
                  {step.num}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#E6EDF3]">{step.emoji} {step.text}</p>
                  {step.action && (
                    <button
                      onClick={step.action}
                      className="mt-2 text-xs font-medium text-[#8B949E] hover:text-[#58A6FF] transition-colors"
                    >
                      → {step.btn}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((iv) => {
            const eval_ = iv.evaluation as Evaluation | null
            const juryEvals = (iv as any).jury_evaluations as JuryEvaluation[] | undefined
            const juryAvg = (iv as any).jury_avg_score as number | undefined
            const hasJury = juryEvals && juryEvals.length > 0

            return (
              <div
                key={iv.id}
                onClick={() => setSelectedInterview(iv)}
                className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 cursor-pointer hover:border-[#58A6FF] transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-base font-semibold">{iv.candidate_name || 'Unknown'}</h3>
                    <div className="text-[10px] text-[#8B949E] font-mono">
                      {iv.started_at ? new Date(iv.started_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      &nbsp;&bull;&nbsp;{(iv.language || 'en').toUpperCase()}
                      &nbsp;&bull;&nbsp;{(iv.messages as any[])?.length || 0} msgs
                    </div>
                  </div>
                  {iv.recommendation && (
                    <span
                      className="px-2.5 py-1 rounded-md font-mono text-[11px] font-bold"
                      style={{ background: `${recColor[iv.recommendation] || '#58A6FF'}22`, color: recColor[iv.recommendation] || '#58A6FF' }}
                    >
                      {iv.recommendation}
                    </span>
                  )}
                </div>

                {/* Jury Scores */}
                {hasJury ? (
                  <div className="mb-3">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-[28px] font-bold font-mono" style={{ color: scoreColor(juryAvg || 0) }}>
                        {juryAvg}
                      </span>
                      <span className="text-[10px] text-[#8B949E] font-mono">JURY AVG</span>
                    </div>
                    <div className="flex gap-2">
                      {juryEvals!.map((je) => (
                        <div key={je.jury_id} className="flex-1 bg-[#0D1117] rounded-lg p-2 text-center">
                          <div className="text-sm mb-0.5">{je.jury_emoji}</div>
                          <div className="text-[16px] font-bold font-mono" style={{ color: scoreColor(je.overall_score) }}>
                            {je.overall_score}
                          </div>
                          <div className="text-[8px] text-[#8B949E] font-mono mt-0.5"
                            style={{ color: recColor[je.recommendation] || '#8B949E' }}>
                            {je.recommendation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : eval_?.scores ? (
                  <div className="mb-3">
                    <div className="text-[32px] font-bold font-mono mb-2" style={{ color: scoreColor(iv.overall_score || 0) }}>
                      {iv.overall_score || '-'}
                    </div>
                    {Object.entries(eval_.scores).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] text-[#8B949E] font-mono uppercase w-24">{key.replace(/_/g, ' ')}</span>
                        <div className="flex-1 h-1.5 bg-[#30363D] rounded-sm overflow-hidden">
                          <div className="h-full rounded-sm" style={{ width: `${val.score * 10}%`, background: scoreColor(val.score) }} />
                        </div>
                        <span className="text-[11px] font-semibold font-mono w-7 text-right" style={{ color: scoreColor(val.score) }}>{val.score}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-[#8B949E] mb-3 font-mono">{t('dashboard.noEval')}</div>
                )}

                {/* Summary from jury or eval */}
                {hasJury && juryEvals![0]?.one_line_summary ? (
                  <div className="text-xs text-[#8B949E] italic mt-2 pt-2 border-t border-[#30363D] leading-relaxed">
                    &ldquo;{juryEvals![0].one_line_summary}&rdquo;
                  </div>
                ) : eval_?.one_line_summary ? (
                  <div className="text-xs text-[#8B949E] italic mt-2 pt-2 border-t border-[#30363D] leading-relaxed">
                    &ldquo;{eval_.one_line_summary}&rdquo;
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {(hasJury ? juryEvals![0]?.highlights : eval_?.highlights)?.map((h, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[rgba(63,185,80,0.1)] text-[#3FB950] font-mono">&#10003; {h}</span>
                  ))}
                  {(hasJury ? juryEvals![0]?.red_flags : eval_?.red_flags)?.map((r, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[rgba(247,129,102,0.1)] text-[#F78166] font-mono">&#9888; {r}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedInterview && (() => {
        const eval_ = selectedInterview.evaluation as Evaluation | null
        const juryEvals = (selectedInterview as any).jury_evaluations as JuryEvaluation[] | undefined
        const hasJury = juryEvals && juryEvals.length > 0

        return (
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedInterview(null)}
          >
            <div
              className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{selectedInterview.candidate_name} — {t('dashboard.fullEval')}</h3>
                <div className="flex items-center gap-2">
                  {!hasJury && (
                    <button
                      onClick={(e) => { e.stopPropagation(); runJuryForOne(selectedInterview.id) }}
                      disabled={juryRunning}
                      className="bg-[#DA7756] text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-[#E08B6D] disabled:opacity-50"
                    >
                      {juryRunning ? t('dashboard.evaluating') : `⚖️ ${t('dashboard.runJury')}`}
                    </button>
                  )}
                  <button onClick={() => setSelectedInterview(null)} className="text-[#8B949E] hover:text-white text-xl">&times;</button>
                </div>
              </div>

              {/* Jury Evaluations */}
              {hasJury && (
                <div className="mb-6">
                  <h4 className="text-xs font-mono text-[#DA7756] mb-3">⚖️ {t('dashboard.juryEvals')}</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {juryEvals!.map((je) => (
                      <div key={je.jury_id} className="bg-[#0D1117] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{je.jury_emoji}</span>
                          <div>
                            <div className="text-xs font-semibold">{je.jury_name}</div>
                            <div className="text-[10px] font-mono" style={{ color: recColor[je.recommendation] || '#8B949E' }}>
                              {je.recommendation}
                            </div>
                          </div>
                          <div className="ml-auto text-xl font-bold font-mono" style={{ color: scoreColor(je.overall_score) }}>
                            {je.overall_score}
                          </div>
                        </div>

                        {/* Criterion scores */}
                        {je.scores && Object.entries(je.scores).map(([key, val]) => (
                          <div key={key} className="flex items-center gap-1.5 mb-1">
                            <span className="text-[8px] text-[#8B949E] font-mono uppercase w-20 truncate">{key.replace(/_/g, ' ')}</span>
                            <div className="flex-1 h-1 bg-[#30363D] rounded-sm overflow-hidden">
                              <div className="h-full rounded-sm" style={{ width: `${val.score * 10}%`, background: scoreColor(val.score) }} />
                            </div>
                            <span className="text-[10px] font-mono w-5 text-right" style={{ color: scoreColor(val.score) }}>{val.score}</span>
                          </div>
                        ))}

                        {je.one_line_summary && (
                          <div className="text-[10px] text-[#8B949E] italic mt-2 pt-2 border-t border-[#30363D]">
                            &ldquo;{je.one_line_summary}&rdquo;
                          </div>
                        )}

                        {je.key_concern && (
                          <div className="text-[10px] text-[#F78166] mt-1.5 font-mono">
                            &#9888; {je.key_concern}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1 mt-2">
                          {je.highlights?.map((h, i) => (
                            <span key={i} className="text-[8px] px-1.5 py-0.5 rounded bg-[rgba(63,185,80,0.1)] text-[#3FB950] font-mono">&#10003; {h}</span>
                          ))}
                          {je.red_flags?.map((r, i) => (
                            <span key={i} className="text-[8px] px-1.5 py-0.5 rounded bg-[rgba(247,129,102,0.1)] text-[#F78166] font-mono">&#9888; {r}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Transcript */}
              {selectedInterview.messages && (selectedInterview.messages as any[]).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-mono text-[#58A6FF] mb-2">// {t('dashboard.transcript')}</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto bg-[#0D1117] rounded-lg p-3">
                    {(selectedInterview.messages as any[]).map((msg: any, i: number) => (
                      <div key={i} className={`text-[11px] leading-relaxed ${msg.role === 'assistant' ? 'text-[#58A6FF]' : 'text-[#E6EDF3]'}`}>
                        <span className="font-mono font-bold text-[10px] mr-1">{msg.role === 'assistant' ? 'AI:' : `${t('dashboard.candidate')}:`}</span>
                        {msg.content.substring(0, 300)}{msg.content.length > 300 ? '...' : ''}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deliberation Notes */}
              {(() => {
                const deliberationNotes = (selectedInterview as any).deliberation_notes as DeliberationNote[] | undefined
                if (!deliberationNotes || deliberationNotes.length === 0) return null
                return (
                  <div className="mb-4">
                    <h4 className="text-xs font-mono text-[#8B5CF6] mb-2">🗣 {t('dashboard.deliberation')}</h4>
                    <div className="space-y-2">
                      {deliberationNotes.map((n: DeliberationNote) => (
                        <div key={n.jury_id} className="bg-[#0D1117] rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span>{n.jury_emoji}</span>
                            <span className="text-xs font-semibold">{n.jury_name}</span>
                            {n.changed_mind ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(247,129,102,0.1)] text-[#F78166] font-mono ml-auto">
                                {t('dashboard.changed')}: {n.original_score} → {n.final_score}
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(63,185,80,0.1)] text-[#3FB950] font-mono ml-auto">
                                {t('dashboard.maintained')}: {n.final_score}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#8B949E] leading-relaxed">{n.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Decision */}
              {(selectedInterview as any).decision && (
                <div className="mb-4 p-3 rounded-lg border" style={{
                  borderColor: (selectedInterview as any).decision === 'ACCEPT' ? '#3FB950'
                    : (selectedInterview as any).decision === 'WAITLIST' ? '#F78166' : '#F85149',
                  background: (selectedInterview as any).decision === 'ACCEPT' ? 'rgba(63,185,80,0.1)'
                    : (selectedInterview as any).decision === 'WAITLIST' ? 'rgba(247,129,102,0.1)' : 'rgba(248,81,73,0.1)',
                }}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-bold" style={{
                      color: (selectedInterview as any).decision === 'ACCEPT' ? '#3FB950'
                        : (selectedInterview as any).decision === 'WAITLIST' ? '#F78166' : '#F85149'
                    }}>
                      {t('dashboard.final')}: {(selectedInterview as any).decision}
                    </span>
                    <span className="text-sm font-mono">{t('common.score').charAt(0).toUpperCase() + t('common.score').slice(1)}: {(selectedInterview as any).decision_score}</span>
                  </div>
                </div>
              )}

              {eval_ && (
                <>
                  <h4 className="text-xs font-mono text-[#58A6FF] mb-2">// {t('dashboard.interviewerEval')}</h4>
                  <pre className="bg-[#0D1117] rounded-lg p-4 text-[11px] font-mono overflow-x-auto leading-relaxed text-[#E6EDF3]">
                    {JSON.stringify(eval_, null, 2)}
                  </pre>
                </>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
