'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n'
import Navbar from '@/components/Navbar'

const DEFAULT_SYSTEM_PROMPT = `You are an AI Interview Agent for an accelerator program. Your role is to conduct structured yet adaptive interviews with startup founders.

## CORE BEHAVIOR
You are warm, professional, and genuinely curious. Ask ONE question at a time. Keep it conversational, not interrogative.

## LANGUAGE
First message: ask preferred language. Then mirror throughout.

## INTERVIEW FLOW (5 phases, 8-12 questions total)

### Phase 1: Warm-up (1-2 questions)
Name, background, what they did before this startup.

### Phase 2: The Idea (2-3 questions)
What are they building? What problem? Why now?

### Phase 3: AI-Native Depth (2-3 questions)
How does AI fit? Feature or core?
- If AI is core → ask about technical architecture
- If AI is a feature → ask about moat without AI
- If unclear → ask what they'd build with unlimited API credits

### Phase 4: Market & Traction (1-2 questions)
First 10 users? Talked to them? Early learnings?

### Phase 5: Vision & Closing (1-2 questions)
3-year vision. What they need from the program. Thank them warmly.

## EVALUATION
After completing all phases, output evaluation as JSON:
{
  "candidate_name": "...",
  "language": "tr|en",
  "scores": {
    "problem_clarity": {"score": 1-10, "rationale": "..."},
    "ai_nativeness": {"score": 1-10, "rationale": "..."},
    "technical_depth": {"score": 1-10, "rationale": "..."},
    "market_awareness": {"score": 1-10, "rationale": "..."},
    "founder_energy": {"score": 1-10, "rationale": "..."},
    "program_fit": {"score": 1-10, "rationale": "..."}
  },
  "overall_score": "weighted average (ai_nativeness 2x weight)",
  "recommendation": "STRONG_YES | YES | MAYBE | NO",
  "one_line_summary": "...",
  "red_flags": [],
  "highlights": [],
  "suggested_mentors": []
}

## RULES
1. ONE question at a time
2. Never skip phases
3. Adapt based on answers
4. 8-12 questions total
5. Never reveal scoring during interview`

export default function CreateProgramPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
  const [showPrompt, setShowPrompt] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/auth/login?redirect=/create')
    })
  }, [])

  useEffect(() => {
    setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }, [name])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const { data: program, error: progErr } = await supabase
      .from('programs')
      .insert({
        name,
        slug,
        description,
        system_prompt: systemPrompt,
        created_by: user.id,
        brand_colors: { accent: '#58A6FF', bg: '#0D1117', orange: '#F78166', green: '#3FB950' },
        eval_criteria: [
          { key: 'problem_clarity', label: 'Problem Clarity', weight: 1 },
          { key: 'ai_nativeness', label: 'AI Nativeness', weight: 2 },
          { key: 'technical_depth', label: 'Technical Depth', weight: 1 },
          { key: 'market_awareness', label: 'Market Awareness', weight: 1 },
          { key: 'founder_energy', label: 'Founder Energy', weight: 1 },
          { key: 'program_fit', label: 'Program Fit', weight: 1 },
        ],
        settings: { max_questions: 12, languages: ['en', 'tr'], model: 'claude-sonnet-4-5-20250929' },
      })
      .select()
      .single()

    if (progErr) {
      setError(progErr.message)
      setLoading(false)
      return
    }

    await supabase
      .from('program_members')
      .insert({ program_id: program.id, user_id: user.id, role: 'owner' })

    router.push(`/${slug}/dashboard`)
  }

  const canProceed = step === 1 ? name.trim().length >= 2 : true

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3]">
      <Navbar />
      <div className="px-4 sm:px-6 py-8">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold mb-2">{t('create.title')}</h1>
            <p className="text-[#8B949E] text-sm">{t('create.subtitle')}</p>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step >= s ? 'bg-[#58A6FF] text-[#0D1117]' : 'bg-[#161B22] text-[#8B949E] border border-[#30363D]'
                }`}>
                  {step > s ? '✓' : s}
                </div>
                {s < 2 && <div className={`w-12 h-0.5 ${step > 1 ? 'bg-[#58A6FF]' : 'bg-[#30363D]'}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic info */}
            {step === 1 && (
              <div className="space-y-5 animate-fadeIn">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-[#E6EDF3] mb-1.5">
                    {t('create.nameLabel')} <span className="text-[#F85149]">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={t('create.namePlaceholder')}
                    required
                    autoFocus
                    maxLength={80}
                    className="w-full bg-[#161B22] border border-[#30363D] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#58A6FF] focus:ring-1 focus:ring-[#58A6FF]/50 placeholder-[#484F58] transition-colors"
                  />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[11px] text-[#484F58]">{t('create.nameHint')}</span>
                    <span className={`text-[11px] ${name.length > 60 ? 'text-[#F78166]' : 'text-[#484F58]'}`}>{name.length}/80</span>
                  </div>
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-[#E6EDF3] mb-1.5">
                    URL
                  </label>
                  <div className="flex items-center bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden focus-within:border-[#58A6FF] focus-within:ring-1 focus-within:ring-[#58A6FF]/50 transition-colors">
                    <span className="px-3 text-xs text-[#484F58] font-mono bg-[#0D1117] py-3 border-r border-[#30363D]">
                      {typeof window !== 'undefined' ? window.location.host : 'stealthworks.app'}/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      required
                      className="flex-1 bg-transparent px-3 py-3 text-sm font-mono outline-none"
                    />
                  </div>
                  <span className="text-[11px] text-[#484F58] mt-1.5 block">{t('create.slugHint')}</span>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-[#E6EDF3] mb-1.5">
                    {t('create.descLabel')}
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={t('create.descPlaceholder')}
                    rows={2}
                    maxLength={300}
                    className="w-full bg-[#161B22] border border-[#30363D] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#58A6FF] focus:ring-1 focus:ring-[#58A6FF]/50 placeholder-[#484F58] resize-none transition-colors"
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-[11px] text-[#484F58]">{description.length}/300</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!canProceed}
                  className="w-full bg-[#58A6FF] text-[#0D1117] py-3 rounded-lg font-semibold text-sm transition-all hover:bg-[#79B8FF] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t('create.next')} →
                </button>
              </div>
            )}

            {/* Step 2: AI Configuration */}
            {step === 2 && (
              <div className="space-y-5 animate-fadeIn">
                {/* Summary of step 1 */}
                <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{name}</div>
                    <div className="text-xs text-[#8B949E] font-mono">/{slug}</div>
                  </div>
                  <button type="button" onClick={() => setStep(1)} className="text-xs text-[#58A6FF] hover:underline">
                    {t('create.edit')}
                  </button>
                </div>

                {/* System Prompt — collapsible */}
                <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowPrompt(!showPrompt)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#1C2128] transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium">{t('create.promptLabel')}</div>
                      <div className="text-[11px] text-[#8B949E] mt-0.5">{t('create.promptHint')}</div>
                    </div>
                    <span className="text-[#8B949E] text-lg">{showPrompt ? '▾' : '▸'}</span>
                  </button>
                  {showPrompt && (
                    <div className="px-4 pb-4 border-t border-[#30363D]">
                      <textarea
                        value={systemPrompt}
                        onChange={e => setSystemPrompt(e.target.value)}
                        rows={16}
                        className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-3 text-xs font-mono outline-none focus:border-[#58A6FF] resize-y leading-relaxed mt-3"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <button
                          type="button"
                          onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
                          className="text-[11px] text-[#8B949E] hover:text-[#58A6FF] transition-colors"
                        >
                          ↻ {t('create.resetPrompt')}
                        </button>
                        <span className="text-[11px] text-[#484F58]">{systemPrompt.length} chars</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* What happens next */}
                <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-4">
                  <div className="text-xs font-mono text-[#8B949E] mb-3">{t('create.whatNext')}</div>
                  <div className="space-y-2">
                    {[
                      { emoji: '🤖', text: t('create.step1') },
                      { emoji: '🔗', text: t('create.step2') },
                      { emoji: '⚖️', text: t('create.step3') },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs text-[#8B949E]">
                        <span>{item.emoji}</span>
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="bg-[#F8514922] border border-[#F85149] rounded-lg px-4 py-3 text-sm text-[#F85149] flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 rounded-lg text-sm font-medium bg-[#161B22] border border-[#30363D] text-[#E6EDF3] hover:border-[#58A6FF] transition-colors"
                  >
                    ← {t('create.back')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#58A6FF] text-[#0D1117] py-3 rounded-lg font-bold text-sm transition-all hover:bg-[#79B8FF] disabled:opacity-50"
                  >
                    {loading ? t('create.creating') : t('create.submitBtn')}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
