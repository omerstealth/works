import Link from 'next/link'

export default function HomePage() {
  const pipeline = [
    { emoji: '🤖', title: 'AI Interviews', desc: 'Adaptive conversations with 6 unique AI candidate personas. Multi-language, real-time evaluation.', color: '#58A6FF' },
    { emoji: '⚖️', title: 'Expert Jury', desc: '3 AI jury members independently evaluate each interview from technical, business, and vision perspectives.', color: '#D2A8FF' },
    { emoji: '🗣', title: 'Deliberation', desc: 'Jury members review each other\'s evaluations, debate, and reach consensus — just like a real selection committee.', color: '#F78166' },
    { emoji: '✅', title: 'Smart Decisions', desc: 'Data-driven ACCEPT / WAITLIST / REJECT decisions based on deliberated scores and configurable thresholds.', color: '#3FB950' },
    { emoji: '🚀', title: 'Mentor Matching', desc: '5 specialized mentors auto-matched to founders based on their weakest areas. Personalized 8-week roadmaps.', color: '#58A6FF' },
    { emoji: '🎤', title: 'Demo Day', desc: 'Full program execution from Kickoff to Demo Day. Investor briefs, pitch readiness scores, graduation reports.', color: '#F78166' },
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pipeline.map((step, i) => (
            <div
              key={step.title}
              className="group bg-[#161B22] border border-[#30363D] rounded-xl p-6 hover:border-[color:var(--hover-color)] transition-all hover:-translate-y-0.5"
              style={{ '--hover-color': step.color } as React.CSSProperties}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold"
                  style={{ background: `${step.color}22`, color: step.color }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <span className="text-xl">{step.emoji}</span>
              </div>
              <h3 className="text-base font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-[#8B949E] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

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
