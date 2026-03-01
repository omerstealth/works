'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Program, Interview, Evaluation } from '@/lib/supabase/types'

export default function DashboardPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [program, setProgram] = useState<Program | null>(null)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      // Check auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/auth/login?redirect=/${slug}/dashboard`)
        return
      }
      setAuthChecked(true)

      // Load program
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

      // Load interviews
      const { data: ints } = await supabase
        .from('interviews')
        .select('*')
        .eq('program_id', prog.id)
        .order('started_at', { ascending: false })

      setInterviews((ints || []) as Interview[])
      setLoading(false)
    }
    init()
  }, [slug])

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] flex items-center justify-center">
        <div className="text-[#8B949E] font-mono text-sm">Loading dashboard...</div>
      </div>
    )
  }

  const completed = interviews.filter(i => i.status === 'completed')
  const strongYes = completed.filter(i => i.recommendation === 'STRONG_YES').length
  const yes = completed.filter(i => i.recommendation === 'YES').length
  const maybe = completed.filter(i => i.recommendation === 'MAYBE').length
  const avgScore = completed.length > 0
    ? (completed.reduce((s, i) => s + (i.overall_score || 0), 0) / completed.length).toFixed(1)
    : '-'

  const sorted = [...completed].sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))
  const scoreColor = (s: number) => (s >= 8 ? '#3FB950' : s >= 6 ? '#58A6FF' : '#F78166')
  const recColor: Record<string, string> = { STRONG_YES: '#3FB950', YES: '#58A6FF', MAYBE: '#F78166', NO: '#F85149' }

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

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] p-6">
      {/* Header */}
      <header className="flex items-center gap-4 mb-8 pb-4 border-b border-[#30363D]">
        <div className="w-10 h-10 bg-gradient-to-br from-[#58A6FF] to-[#F78166] rounded-[10px] flex items-center justify-center font-mono font-bold text-lg text-[#0D1117]">
          {program?.name?.[0] || 'S'}
        </div>
        <div>
          <h1 className="text-lg font-semibold">{program?.name}</h1>
          <span className="text-xs text-[#8B949E] font-mono">Jury Dashboard — Interview Evaluations</span>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={exportJSON}
            className="bg-[#161B22] border border-[#30363D] text-[#8B949E] px-3.5 py-1.5 rounded-md text-xs hover:border-[#58A6FF] hover:text-[#58A6FF] transition-colors"
          >
            Export JSON
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {[
          { n: interviews.length, label: 'Total', color: '#E6EDF3' },
          { n: strongYes, label: 'Strong Yes', color: '#3FB950' },
          { n: yes, label: 'Yes', color: '#58A6FF' },
          { n: maybe, label: 'Maybe', color: '#F78166' },
          { n: avgScore, label: 'Avg Score', color: '#E6EDF3' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#161B22] border border-[#30363D] rounded-[10px] p-4 text-center">
            <div className="text-[28px] font-bold font-mono" style={{ color: stat.color }}>{stat.n}</div>
            <div className="text-[11px] text-[#8B949E] mt-1 font-mono">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Cards Grid */}
      {sorted.length === 0 ? (
        <div className="text-center py-20 text-[#8B949E]">
          <div className="text-5xl mb-4">&#128203;</div>
          <h2 className="text-xl text-[#E6EDF3] mb-2">No completed interviews yet</h2>
          <p className="text-sm max-w-md mx-auto leading-relaxed">
            Share your interview link and completed interviews will appear here.
          </p>
          <div className="mt-4 bg-[#161B22] border border-[#30363D] rounded-lg px-4 py-2 inline-block font-mono text-xs text-[#58A6FF]">
            {typeof window !== 'undefined' ? window.location.origin : ''}/{slug}/interview
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((iv) => {
            const eval_ = iv.evaluation as Evaluation | null
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

                <div className="text-[32px] font-bold font-mono mb-2" style={{ color: scoreColor(iv.overall_score || 0) }}>
                  {iv.overall_score || '-'}
                </div>

                {eval_?.scores && (
                  <div className="mb-3">
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
                )}

                {eval_?.one_line_summary && (
                  <div className="text-xs text-[#8B949E] italic mt-3 pt-3 border-t border-[#30363D] leading-relaxed">
                    &ldquo;{eval_.one_line_summary}&rdquo;
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {eval_?.highlights?.map((h, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[rgba(63,185,80,0.1)] text-[#3FB950] font-mono">&#10003; {h}</span>
                  ))}
                  {eval_?.red_flags?.map((r, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[rgba(247,129,102,0.1)] text-[#F78166] font-mono">&#9888; {r}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedInterview && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedInterview(null)}
        >
          <div
            className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{selectedInterview.candidate_name} — Full Evaluation</h3>
              <button onClick={() => setSelectedInterview(null)} className="text-[#8B949E] hover:text-white text-xl">&times;</button>
            </div>
            <pre className="bg-[#0D1117] rounded-lg p-4 text-[11px] font-mono overflow-x-auto leading-relaxed text-[#E6EDF3]">
              {JSON.stringify(selectedInterview.evaluation, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
