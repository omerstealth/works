'use client'

import { useState } from 'react'
import Link from 'next/link'

interface PipelineStage {
  emoji: string
  title: string
  desc: string
  color: string
  detail: {
    subtitle: string
    howItWorks: string
    features: string[]
    agents?: { emoji: string; name: string; role: string }[]
    output: string
  }
}

export default function HomePage() {
  const [selectedStage, setSelectedStage] = useState<number | null>(null)

  const pipeline: PipelineStage[] = [
    {
      emoji: '🤖', title: 'AI Interviews', color: '#58A6FF',
      desc: 'Adaptive conversations with 6 unique AI candidate personas. Multi-language, real-time evaluation.',
      detail: {
        subtitle: 'Conversational AI that adapts to each candidate',
        howItWorks: 'Each candidate has a unique AI persona with different backgrounds, expertise levels, and communication styles. The AI interviewer conducts adaptive 10-minute conversations, asking follow-up questions based on responses. Interviews run in parallel — 6 candidates can be evaluated simultaneously.',
        features: ['Multi-language support (TR/EN)', 'Adaptive questioning based on responses', 'Real-time transcript generation', 'Auto-evaluation with structured scores', 'Step-based API for reliable execution'],
        agents: [
          { emoji: '🚀', name: 'Ayşe Demir', role: 'Strong technical founder (DeepMind background)' },
          { emoji: '💡', name: 'Kerem Yılmaz', role: 'Creative product thinker (design → tech)' },
          { emoji: '📊', name: 'Mehmet Kaya', role: 'Data-driven business founder' },
          { emoji: '🌍', name: 'Elif Arslan', role: 'Impact-driven social entrepreneur' },
          { emoji: '🎯', name: 'Can Öztürk', role: 'Sales-driven hustler' },
          { emoji: '🔬', name: 'Zeynep Aydın', role: 'Deep-tech researcher' },
        ],
        output: 'Structured evaluation with scores across 6 dimensions, recommendation (STRONG_YES → NO), highlights, and red flags',
      },
    },
    {
      emoji: '⚖️', title: 'Expert Jury', color: '#D2A8FF',
      desc: '3 AI jury members independently evaluate each interview from technical, business, and vision perspectives.',
      detail: {
        subtitle: 'Independent expert evaluation from three perspectives',
        howItWorks: 'Each completed interview is reviewed by 3 AI jury members, each with a distinct evaluation lens. They read the full transcript and produce independent scores — no jury member sees another\'s evaluation at this stage. This prevents groupthink and ensures diverse perspectives.',
        features: ['Independent evaluation (no cross-contamination)', 'Weighted scoring per jury expertise', 'Structured output with rationale for each score', 'Red flags and highlights identification', 'One-line summary per jury member'],
        agents: [
          { emoji: '🔬', name: 'Dr. Zeynep Akar', role: 'Technical Evaluator — AI depth, architecture, defensibility' },
          { emoji: '📊', name: 'Ahmet Çelik', role: 'Business Evaluator — market awareness, PMF, traction' },
          { emoji: '🌟', name: 'Selin Yıldırım', role: 'Vision Evaluator — founder energy, ambition, program fit' },
        ],
        output: '3 independent evaluations per candidate, each with scores, recommendation, key concerns, and highlights',
      },
    },
    {
      emoji: '🗣', title: 'Deliberation', color: '#F78166',
      desc: 'Jury members review each other\'s evaluations, debate, and reach consensus — just like a real selection committee.',
      detail: {
        subtitle: 'AI-powered consensus building',
        howItWorks: 'After independent evaluations, each jury member sees the other two members\' assessments. They can change their mind, adjust scores, and provide reasoning for their final position. This mimics real-world selection committee dynamics — sometimes a technical concern raises everyone\'s awareness, sometimes a business insight changes the picture.',
        features: ['Cross-review of all jury evaluations', 'Score adjustment with reasoning', 'Track "changed mind" decisions', 'Original vs. final score comparison', 'Consensus analysis across jury'],
        output: 'Deliberation notes per jury member showing original → final scores, whether they changed their mind, and detailed reasoning',
      },
    },
    {
      emoji: '✅', title: 'Smart Decisions', color: '#3FB950',
      desc: 'Data-driven ACCEPT / WAITLIST / REJECT decisions based on deliberated scores and configurable thresholds.',
      detail: {
        subtitle: 'Threshold-based decisions with full transparency',
        howItWorks: 'The decision engine aggregates deliberated final scores (falling back to jury averages if deliberation hasn\'t run). Candidates are sorted by score and classified using configurable thresholds: ≥7 = ACCEPT, 5-6.9 = WAITLIST, <5 = REJECT. Every decision is traceable back to individual jury scores and deliberation notes.',
        features: ['Configurable score thresholds', 'Uses deliberated scores (post-consensus)', 'Fallback to jury average if needed', 'Full audit trail from interview → decision', 'Batch processing for entire cohort'],
        output: 'ACCEPT / WAITLIST / REJECT decision per candidate with final score, applied to all evaluated interviews in the program',
      },
    },
    {
      emoji: '🚀', title: 'Mentor Matching', color: '#58A6FF',
      desc: '5 specialized mentors auto-matched to founders based on their weakest areas. Personalized 8-week roadmaps.',
      detail: {
        subtitle: 'Intelligent mentor-founder matching',
        howItWorks: 'Each accepted founder is matched with the mentor who best addresses their weakest area (identified from jury evaluations). The mentor then creates a personalized 8-week roadmap with specific milestones, focus areas, and first-week tasks. A Program Manager oversees the matching and provides additional notes.',
        features: ['Weakness-based matching algorithm', 'Personalized 8-week roadmap per founder', 'First-week task assignments', 'Program Manager oversight', 'Focus area identification'],
        agents: [
          { emoji: '🚀', name: 'Aylin Güneş', role: 'AI-native startup co-founder — Technical mentor' },
          { emoji: '🤖', name: 'Berk Aydın', role: 'AI agent infra co-founder (YC) — Product mentor' },
          { emoji: '💰', name: 'Canan Korkmaz', role: 'Angel investor (30+ deals) — PMF expert' },
          { emoji: '📈', name: 'Deniz Ertürk', role: 'VC Partner — Fundraising & growth' },
          { emoji: '🎓', name: 'Prof. Elif Şahin', role: 'Boğaziçi CS + Fortune 500 — Strategy' },
        ],
        output: 'Mentor assignment, welcome message, 8-week roadmap, focus areas, and first-week tasks for each accepted founder',
      },
    },
    {
      emoji: '🎤', title: 'Demo Day', color: '#F78166',
      desc: 'Full program execution from Kickoff to Demo Day. Investor briefs, pitch readiness scores, graduation reports.',
      detail: {
        subtitle: 'From Kickoff to graduation in one click',
        howItWorks: 'The 8-week program is simulated with three key checkpoints. At Demo Day (Week 8), mentors write investor recommendation letters, assess pitch readiness (1-10), and compile key metrics. The Program Manager determines graduation status: Graduated with Honors, Graduated, or Needs Extension.',
        features: ['Mentor recommendation letters', 'Pitch readiness scoring (1-10)', 'Investor-ready briefs', 'Key metrics compilation', 'Graduation status determination', 'Post-program next steps'],
        agents: [
          { emoji: '👩‍💼', name: 'İrem Başaran', role: 'Program Director — Oversees all stages' },
        ],
        output: 'Demo Day report with mentor recommendation, pitch readiness, investor brief, key metrics, graduation status, and next steps',
      },
    },
  ]

  const stats = [
    { value: '6', label: 'AI Agents', color: '#58A6FF' },
    { value: '3', label: 'Jury Members', color: '#D2A8FF' },
    { value: '5', label: 'Mentors', color: '#F78166' },
    { value: '8', label: 'Week Program', color: '#3FB950' },
  ]

  const audiences = [
    { emoji: '🏢', title: 'Accelerators', desc: 'Automate your entire selection and program execution pipeline' },
    { emoji: '💰', title: 'VCs & Angels', desc: 'Screen deal flow with AI-powered interviews and expert evaluation' },
    { emoji: '🎓', title: 'University Incubators', desc: 'Scale your startup program without scaling your team' },
    { emoji: '🏗', title: 'Corporate Innovation', desc: 'Evaluate internal ventures and intrapreneurs systematically' },
  ]

  const selected = selectedStage !== null ? pipeline[selectedStage] : null

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#30363D]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#58A6FF] to-[#F78166] rounded-lg flex items-center justify-center font-mono font-bold text-[#0D1117]">
            S
          </div>
          <span className="font-semibold tracking-wide">StealthWorks</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm text-[#8B949E] hover:text-[#E6EDF3] transition-colors">
            Sign In
          </Link>
          <Link
            href="/create"
            className="text-sm bg-[#58A6FF] text-[#0D1117] px-4 py-2 rounded-lg font-semibold hover:bg-[#79B8FF] transition-colors"
          >
            Create Program
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative text-center py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(88,166,255,0.15)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(247,129,102,0.08)_0%,transparent_50%)]" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[rgba(88,166,255,0.1)] border border-[rgba(88,166,255,0.2)] px-4 py-1.5 rounded-full text-xs font-mono text-[#58A6FF] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3FB950] animate-pulse" />
            End-to-End AI Pipeline
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.05] mb-6">
            The AI Operating System{' '}
            <br className="hidden md:block" />
            for{' '}
            <span className="bg-gradient-to-r from-[#58A6FF] via-[#D2A8FF] to-[#F78166] bg-clip-text text-transparent">
              Startup Accelerators
            </span>
          </h1>

          <p className="text-lg text-[#8B949E] max-w-2xl mx-auto mb-10 leading-relaxed">
            From application to Demo Day — every step powered by AI agents.
            Interviews, jury evaluation, deliberation, decisions, mentoring, and program execution in one platform.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-[#58A6FF] text-[#0D1117] px-8 py-4 rounded-xl text-base font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#58A6FF]/20"
            >
              Create Program
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#0D1117" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link
              href="/auth/login?redirect=/my-programs"
              className="inline-flex items-center gap-2 bg-[#161B22] border border-[#30363D] text-[#E6EDF3] px-8 py-4 rounded-xl text-base font-semibold transition-all hover:border-[#58A6FF] hover:-translate-y-0.5"
            >
              ▶️ Launch Demo
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-y border-[#30363D] bg-[#161B22]/50">
        <div className="max-w-4xl mx-auto px-6 py-8 flex justify-around">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold font-mono" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-[#8B949E] mt-1 font-mono">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <div className="text-xs font-mono text-[#58A6FF] mb-3 tracking-wider">{'// THE PIPELINE'}</div>
          <h2 className="text-3xl md:text-4xl font-bold">
            Six AI-powered stages.{' '}
            <span className="text-[#8B949E]">Zero manual work.</span>
          </h2>
          <p className="text-sm text-[#484F58] mt-3 font-mono">Click any stage to explore</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pipeline.map((step, i) => (
            <div
              key={step.title}
              onClick={() => setSelectedStage(i)}
              className="group bg-[#161B22] border border-[#30363D] rounded-xl p-6 cursor-pointer transition-all hover:-translate-y-0.5"
              style={{ borderColor: selectedStage === i ? step.color : undefined }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold"
                  style={{ background: `${step.color}22`, color: step.color }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <span className="text-xl">{step.emoji}</span>
                <svg className="w-4 h-4 text-[#484F58] ml-auto group-hover:text-[#8B949E] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7" /></svg>
              </div>
              <h3 className="text-base font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-[#8B949E] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stage Detail Modal */}
      {selected && selectedStage !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedStage(null)}>
          <div
            className="bg-[#161B22] border rounded-2xl p-0 max-w-2xl w-full max-h-[85vh] overflow-hidden"
            style={{ borderColor: selected.color }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 pb-4" style={{ background: `linear-gradient(135deg, ${selected.color}15, transparent)` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-mono font-bold"
                    style={{ background: `${selected.color}22`, color: selected.color }}
                  >
                    {String(selectedStage + 1).padStart(2, '0')}
                  </div>
                  <span className="text-2xl">{selected.emoji}</span>
                </div>
                <button
                  onClick={() => setSelectedStage(null)}
                  className="text-[#8B949E] hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#30363D] transition-colors"
                >
                  &times;
                </button>
              </div>
              <h3 className="text-xl font-bold mb-1">{selected.title}</h3>
              <p className="text-sm" style={{ color: selected.color }}>{selected.detail.subtitle}</p>
            </div>

            {/* Modal Body */}
            <div className="px-6 pb-6 overflow-y-auto max-h-[calc(85vh-140px)] space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#30363D transparent' }}>
              {/* How It Works */}
              <div>
                <div className="text-[10px] font-mono text-[#8B949E] mb-2 tracking-wider">HOW IT WORKS</div>
                <p className="text-sm text-[#E6EDF3] leading-relaxed">{selected.detail.howItWorks}</p>
              </div>

              {/* Agents */}
              {selected.detail.agents && selected.detail.agents.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono text-[#8B949E] mb-2 tracking-wider">
                    {selectedStage === 0 ? 'AI CANDIDATE PERSONAS' : selectedStage === 1 ? 'JURY MEMBERS' : selectedStage === 4 ? 'MENTOR PANEL' : 'AGENTS'}
                  </div>
                  <div className="space-y-1.5">
                    {selected.detail.agents.map(agent => (
                      <div key={agent.name} className="flex items-center gap-3 bg-[#0D1117] rounded-lg px-3 py-2">
                        <span className="text-lg">{agent.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold">{agent.name}</span>
                          <span className="text-xs text-[#8B949E] ml-2">{agent.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              <div>
                <div className="text-[10px] font-mono text-[#8B949E] mb-2 tracking-wider">KEY FEATURES</div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.detail.features.map(f => (
                    <span
                      key={f}
                      className="text-[11px] px-2.5 py-1 rounded-full font-mono"
                      style={{ background: `${selected.color}15`, color: selected.color }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Output */}
              <div>
                <div className="text-[10px] font-mono text-[#8B949E] mb-2 tracking-wider">OUTPUT</div>
                <div className="bg-[#0D1117] rounded-lg px-4 py-3 text-sm text-[#8B949E] leading-relaxed border-l-2" style={{ borderColor: selected.color }}>
                  {selected.detail.output}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2 border-t border-[#30363D]">
                <button
                  onClick={() => setSelectedStage(selectedStage > 0 ? selectedStage - 1 : pipeline.length - 1)}
                  className="text-xs text-[#8B949E] hover:text-[#E6EDF3] transition-colors flex items-center gap-1"
                >
                  ← {pipeline[selectedStage > 0 ? selectedStage - 1 : pipeline.length - 1].title}
                </button>
                <div className="flex gap-1">
                  {pipeline.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedStage(i)}
                      className="w-2 h-2 rounded-full transition-colors"
                      style={{ background: i === selectedStage ? selected.color : '#30363D' }}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setSelectedStage(selectedStage < pipeline.length - 1 ? selectedStage + 1 : 0)}
                  className="text-xs text-[#8B949E] hover:text-[#E6EDF3] transition-colors flex items-center gap-1"
                >
                  {pipeline[selectedStage < pipeline.length - 1 ? selectedStage + 1 : 0].title} →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Who It's For */}
      <div className="bg-[#161B22] py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-mono text-[#F78166] mb-3 tracking-wider">{'// BUILT FOR'}</div>
            <h2 className="text-3xl md:text-4xl font-bold">
              Who uses StealthWorks?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {audiences.map(a => (
              <div key={a.title} className="flex items-start gap-4 bg-[#0D1117] border border-[#30363D] rounded-xl p-5 hover:border-[#F78166] transition-colors">
                <span className="text-2xl mt-0.5">{a.emoji}</span>
                <div>
                  <h3 className="font-semibold mb-1">{a.title}</h3>
                  <p className="text-sm text-[#8B949E] leading-relaxed">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-xs font-mono text-[#3FB950] mb-3 tracking-wider">{'// HOW IT WORKS'}</div>
        <h2 className="text-3xl font-bold mb-12">Three steps to launch</h2>

        <div className="space-y-8">
          {[
            { num: '01', title: 'Create Your Program', desc: 'Sign up, name your accelerator, customize the AI interviewer prompt and evaluation criteria. Takes 5 minutes.', color: '#58A6FF' },
            { num: '02', title: 'Run the Simulation', desc: 'Hit "Demo" to run the full pipeline — AI candidates, jury evaluation, deliberation, decisions, mentoring, and Demo Day — all in one click.', color: '#F78166' },
            { num: '03', title: 'Review Results', desc: 'Explore cohort analytics, mentor reports, pitch readiness scores, and investor briefs. Export data or share the dashboard with your team.', color: '#3FB950' },
          ].map((step) => (
            <div key={step.num} className="flex gap-5">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg shrink-0"
                style={{ background: step.color, color: '#0D1117' }}
              >
                {step.num}
              </div>
              <div>
                <h3 className="text-base font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-[#8B949E] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-24 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,rgba(247,129,102,0.12)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,rgba(88,166,255,0.08)_0%,transparent_50%)]" />
        <div className="relative">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
            Ready to see the{' '}
            <span className="bg-gradient-to-r from-[#58A6FF] to-[#F78166] bg-clip-text text-transparent">
              full pipeline
            </span>
            {' '}in action?
          </h2>
          <p className="text-[#8B949E] mb-8 max-w-md mx-auto">Create a program and run the one-click demo. From application to Demo Day in 5 minutes.</p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-[#58A6FF] text-[#0D1117] px-8 py-4 rounded-xl text-base font-bold transition-all hover:-translate-y-0.5"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-10 border-t border-[#30363D] text-[#8B949E] text-xs font-mono">
        StealthWorks 2026 &mdash; AI Operating System for Startup Accelerators
      </footer>
    </div>
  )
}
