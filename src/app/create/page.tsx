'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/auth/login?redirect=/create')
    })
  }, [])

  // Auto-generate slug from name
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

    // Create program
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

    // Add creator as owner
    await supabase
      .from('program_members')
      .insert({
        program_id: program.id,
        user_id: user.id,
        role: 'owner',
      })

    router.push(`/${slug}`)
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Create Your Program</h1>
          <p className="text-[#8B949E] text-sm">Set up your AI-powered interview agent in minutes.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-xs font-mono text-[#8B949E] mb-2">PROGRAM NAME</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. ARDVENTURE, TechStars Istanbul"
              required
              className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#58A6FF] placeholder-[#8B949E]"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-mono text-[#8B949E] mb-2">URL SLUG</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8B949E] font-mono">stealthworks.app/</span>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                required
                className="flex-1 bg-[#0D1117] border border-[#30363D] rounded-lg px-4 py-3 text-sm font-mono outline-none focus:border-[#58A6FF]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono text-[#8B949E] mb-2">DESCRIPTION</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A short description of your accelerator program..."
              rows={3}
              className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#58A6FF] placeholder-[#8B949E] resize-none"
            />
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-xs font-mono text-[#8B949E] mb-2">
              INTERVIEW SYSTEM PROMPT
              <span className="ml-2 text-[#58A6FF]">(customizable)</span>
            </label>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={12}
              className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-4 py-3 text-xs font-mono outline-none focus:border-[#58A6FF] placeholder-[#8B949E] resize-y leading-relaxed"
            />
            <p className="text-[10px] text-[#8B949E] mt-1">
              This prompt defines how the AI interviewer behaves. Customize the phases, questions, and evaluation criteria.
            </p>
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#58A6FF] text-[#0D1117] py-3.5 rounded-lg font-bold text-sm transition-all hover:bg-[#79B8FF] disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Program'}
          </button>
        </form>
      </div>
    </div>
  )
}
