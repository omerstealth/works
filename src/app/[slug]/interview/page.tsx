'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Program, Evaluation } from '@/lib/supabase/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function InterviewPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [program, setProgram] = useState<Program | null>(null)
  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isStarted, setIsStarted] = useState(false)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [phase, setPhase] = useState('Ready')
  const [error, setError] = useState<string | null>(null)

  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load program
  useEffect(() => {
    async function loadProgram() {
      const supabase = createClient()
      const { data } = await supabase
        .from('programs')
        .select('*')
        .eq('slug', slug)
        .single()

      if (data) {
        setProgram(data as Program)
      } else {
        setError('Program Bulunamadı')
      }
    }
    loadProgram()
  }, [slug])

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, isProcessing])

  // Phase tracking
  const messageCount = messages.filter(m => m.role === 'user').length
  useEffect(() => {
    const phases = ['Aşama 1: Karşılama', 'Aşama 1: Karşılama', 'Aşama 2: Fikir', 'Aşama 3: AI Derinliği', 'Aşama 3: AI Derinliği', 'Aşama 4: Pazar', 'Aşama 5: Vizyon', 'Aşama 5: Kapanış']
    setPhase(phases[Math.min(messageCount, phases.length - 1)])
  }, [messageCount])

  async function startInterview() {
    if (!program) return
    setIsStarted(true)
    setIsProcessing(true)
    setPhase('Aşama 1: Karşılama')

    try {
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: program.id }),
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        return
      }

      setInterviewId(data.interview_id)
      setMessages([{ role: 'assistant', content: data.message }])
    } catch (err) {
      setError('Mülakat başlatılamadı. Lütfen tekrar deneyin.')
    } finally {
      setIsProcessing(false)
    }
  }

  async function sendMessage() {
    if (!input.trim() || isProcessing || !interviewId) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsProcessing(true)

    try {
      const res = await fetch('/api/interview/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interview_id: interviewId, message: userMsg }),
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        return
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])

      if (data.evaluation) {
        setEvaluation(data.evaluation)
        setPhase('Mülakat Tamamlandı')
      }
    } catch (err) {
      setError('Mesaj gönderilemedi. Lütfen tekrar deneyin.')
    } finally {
      setIsProcessing(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function formatText(text: string) {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
  }

  const colors = program?.brand_colors || { accent: '#58A6FF', bg: '#0D1117', orange: '#F78166', green: '#3FB950' }

  if (error && !program) {
    return (
      <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Program Bulunamadı</h1>
          <p className="text-[#8B949E]">&quot;{slug}&quot; programı bulunamadı.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: colors.bg, color: '#E6EDF3' }}>
      {/* Header */}
      <header className="bg-[#161B22] border-b border-[#30363D] px-6 py-4 flex items-center gap-4 shrink-0">
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center font-mono font-bold text-lg"
          style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.orange})`, color: colors.bg }}
        >
          {program?.name?.[0] || 'S'}
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-wide">{program?.name || 'Yükleniyor...'}</h1>
          <span className="text-[11px] text-[#8B949E] font-mono">{program?.description || 'Mülakat Ajanı'}</span>
        </div>
        <div className="ml-auto flex items-center gap-2 bg-[rgba(63,185,80,0.15)] text-[#3FB950] px-3 py-1 rounded-full text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3FB950] animate-pulse" />
          {phase}
        </div>
      </header>

      {/* Welcome Screen */}
      {!isStarted && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-10">
          <div
            className="w-20 h-20 rounded-[20px] flex items-center justify-center font-mono font-bold text-3xl shadow-lg"
            style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.orange})`, color: colors.bg, boxShadow: `0 0 60px ${colors.accent}25` }}
          >
            {program?.name?.[0] || 'S'}
          </div>
          <h2 className="text-2xl font-semibold text-center">{program?.name} Mülakatı</h2>
          <p className="text-[#8B949E] text-center max-w-md leading-relaxed">
            AI destekli mülakata hoş geldiniz. Mülakat yaklaşık 10 dakika sürer.
          </p>
          <button
            onClick={startInterview}
            className="px-8 py-3 rounded-[10px] text-[15px] font-semibold transition-all hover:scale-[1.03]"
            style={{ background: colors.accent, color: colors.bg }}
          >
            Mülakatı Başlat
          </button>
        </div>
      )}

      {/* Chat Area */}
      {isStarted && (
        <div ref={chatRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scroll-smooth">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[680px] flex gap-3 animate-fadeIn ${
                msg.role === 'assistant'
                  ? 'self-start'
                  : 'self-end flex-row-reverse'
              }`}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5"
                style={{
                  background: msg.role === 'user'
                    ? colors.orange
                    : `linear-gradient(135deg, ${colors.accent}, #7C3AED)`,
                  color: msg.role === 'user' ? colors.bg : 'white',
                }}
              >
                {msg.role === 'user' ? 'U' : program?.name?.[0] || 'S'}
              </div>
              <div
                className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#1A3A5C] border border-[rgba(88,166,255,0.2)] rounded-tr-sm'
                    : 'bg-[#1C2333] border border-[#30363D] rounded-tl-sm'
                }`}
                dangerouslySetInnerHTML={{ __html: formatText(msg.content) }}
              />
            </div>
          ))}

          {/* Typing indicator */}
          {isProcessing && (
            <div className="max-w-[680px] flex gap-3 self-start animate-fadeIn">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                style={{ background: `linear-gradient(135deg, ${colors.accent}, #7C3AED)`, color: 'white' }}
              >
                {program?.name?.[0] || 'S'}
              </div>
              <div className="bg-[#1C2333] border border-[#30363D] rounded-xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B949E] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B949E] animate-bounce" style={{ animationDelay: '200ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B949E] animate-bounce" style={{ animationDelay: '400ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Evaluation Card */}
          {evaluation && <EvaluationCard evaluation={evaluation} colors={colors} />}
        </div>
      )}

      {/* Input Area */}
      {isStarted && !evaluation && (
        <div className="bg-[#161B22] border-t border-[#30363D] p-4 shrink-0">
          <div className="max-w-[720px] mx-auto flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cevabınızı yazın..."
              rows={1}
              className="flex-1 bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-3 text-sm text-[#E6EDF3] resize-none outline-none max-h-[120px] focus:border-[#58A6FF] placeholder-[#8B949E] transition-colors"
              style={{ minHeight: '44px' }}
              disabled={isProcessing}
            />
            <button
              onClick={sendMessage}
              disabled={isProcessing || !input.trim()}
              className="w-11 h-11 rounded-[10px] flex items-center justify-center transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              style={{ background: colors.accent }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill={colors.bg}>
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-900/90 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm max-w-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-white">&times;</button>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease; }
      `}</style>
    </div>
  )
}

function EvaluationCard({ evaluation, colors }: { evaluation: Evaluation; colors: any }) {
  const recColor: Record<string, string> = {
    STRONG_YES: '#3FB950',
    YES: '#58A6FF',
    MAYBE: '#F78166',
    NO: '#F85149',
  }

  const scoreColor = (s: number) => (s >= 8 ? '#3FB950' : s >= 6 ? '#58A6FF' : '#F78166')

  return (
    <div className="bg-[#161B22] border border-[#58A6FF] rounded-xl p-5 max-w-[680px] self-start animate-fadeIn">
      <h3 className="text-sm font-mono text-[#58A6FF] mb-3">{'// DEĞERLENDİRME RAPORU'}</h3>

      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-lg font-semibold">{evaluation.candidate_name}</div>
          <div className="text-[11px] text-[#8B949E] font-mono">
            {evaluation.interview_duration_estimate || ''} &bull; {evaluation.language?.toUpperCase()}
          </div>
        </div>
        <div
          className="px-4 py-2 rounded-lg font-mono font-bold text-sm"
          style={{
            background: `${recColor[evaluation.recommendation] || '#58A6FF'}22`,
            color: recColor[evaluation.recommendation] || '#58A6FF',
          }}
        >
          {evaluation.recommendation}
        </div>
      </div>

      <div className="italic text-[#C9D1D9] mb-4 p-2.5 bg-[#0D1117] rounded-md text-xs">
        &ldquo;{evaluation.one_line_summary}&rdquo;
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {Object.entries(evaluation.scores).map(([key, val]) => (
          <div key={key} className="bg-[#0D1117] p-2.5 rounded-md">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-[#8B949E] font-mono uppercase">
                {key.replace(/_/g, ' ')}
              </span>
              <span className="text-xs font-bold" style={{ color: scoreColor(val.score) }}>
                {val.score}/10
              </span>
            </div>
            <div className="bg-[#30363D] rounded-sm h-1.5 overflow-hidden">
              <div
                className="h-full rounded-sm transition-all"
                style={{ width: `${val.score * 10}%`, background: scoreColor(val.score) }}
              />
            </div>
            <div className="text-[9px] text-[#8B949E] mt-1">{val.rationale}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mb-3">
        <div className="flex-1">
          <div className="text-[10px] text-[#3FB950] font-mono mb-1">&#10003; ÖNE ÇIKANLAR</div>
          {evaluation.highlights?.map((h, i) => (
            <div key={i} className="text-[11px] text-[#C9D1D9] mb-0.5">&bull; {h}</div>
          ))}
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-[#F78166] font-mono mb-1">&#9888; UYARI İŞARETLERİ</div>
          {evaluation.red_flags?.map((r, i) => (
            <div key={i} className="text-[11px] text-[#C9D1D9] mb-0.5">&bull; {r}</div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#30363D] flex justify-between items-center">
        <div
          className="text-2xl font-bold"
          style={{ color: recColor[evaluation.recommendation] || '#58A6FF' }}
        >
          {evaluation.overall_score}
        </div>
        <div className="text-[10px] text-[#8B949E] font-mono">GENEL PUAN (ai_nativeness 2x ağırlıklı)</div>
      </div>
    </div>
  )
}
