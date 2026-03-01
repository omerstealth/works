import Link from 'next/link'

export default function HomePage() {
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
      <div className="relative text-center py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(88,166,255,0.12)_0%,transparent_70%)]" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[rgba(88,166,255,0.1)] border border-[rgba(88,166,255,0.2)] px-4 py-1.5 rounded-full text-xs font-mono text-[#58A6FF] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3FB950] animate-pulse" />
            AI-Powered Interviews
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter leading-tight mb-6">
            Launch your{' '}
            <span className="bg-gradient-to-r from-[#58A6FF] to-[#F78166] bg-clip-text text-transparent">
              AI interview agent
            </span>
            {' '}in minutes
          </h1>

          <p className="text-lg text-[#8B949E] max-w-xl mx-auto mb-10 leading-relaxed">
            StealthWorks lets accelerators, incubators, and hiring teams create custom AI interviewers.
            Adaptive conversations, automatic evaluation, and a jury dashboard — all out of the box.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-[#58A6FF] text-[#0D1117] px-8 py-4 rounded-xl text-base font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#58A6FF]/20"
            >
              Create Your Program
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#0D1117"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-xs font-mono text-[#58A6FF] mb-3 tracking-wider">{'// FEATURES'}</div>
        <h2 className="text-3xl font-bold mb-12">Everything you need</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '\u{1F916}',
              title: 'AI Interview Agent',
              desc: 'Custom system prompts, adaptive questioning, multi-language support. Your AI interviewer conducts 10-minute conversations that feel human.',
            },
            {
              icon: '\u{1F4CA}',
              title: 'Auto Evaluation',
              desc: 'AI generates structured scores across custom dimensions. Candidates are ranked automatically with recommendations and rationales.',
            },
            {
              icon: '\u{1F465}',
              title: 'Jury Dashboard',
              desc: 'Team members review candidates with visual score cards, filters, and export. Role-based access for owners, jury, and viewers.',
            },
            {
              icon: '\u{1F3A8}',
              title: 'Custom Branding',
              desc: 'Your program name, colors, and logo. Each program gets a unique URL. White-label ready.',
            },
            {
              icon: '\u{1F512}',
              title: 'Secure by Default',
              desc: 'Supabase Auth with email + OAuth. Row-level security ensures candidates only start interviews, jury members review them.',
            },
            {
              icon: '\u26A1',
              title: 'Deploy in Minutes',
              desc: 'Powered by Next.js + Supabase + Vercel. Create a program, share the link, start receiving interviews.',
            },
          ].map((f) => (
            <div key={f.title} className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 hover:border-[#58A6FF] transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-base font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-[#8B949E] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-[#161B22] py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs font-mono text-[#58A6FF] mb-3 tracking-wider">{'// HOW IT WORKS'}</div>
          <h2 className="text-3xl font-bold mb-12">Three steps to launch</h2>

          <div className="space-y-8">
            {[
              { num: '01', title: 'Create Your Program', desc: 'Sign up, name your program, customize the interview prompt and evaluation criteria. Takes 5 minutes.', color: '#58A6FF' },
              { num: '02', title: 'Share the Link', desc: 'Every program gets a unique URL. Share it with applicants — they start an AI interview instantly, no signup needed.', color: '#F78166' },
              { num: '03', title: 'Review on Dashboard', desc: 'AI evaluates each candidate automatically. Your jury reviews scores, reads highlights, and makes decisions — all in one place.', color: '#3FB950' },
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
      </div>

      {/* CTA */}
      <div className="text-center py-20 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(247,129,102,0.1)_0%,transparent_60%)]" />
        <div className="relative">
          <h2 className="text-3xl font-extrabold mb-3">Ready to automate your interviews?</h2>
          <p className="text-[#8B949E] mb-8">Set up in 5 minutes. Free to start.</p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 bg-[#58A6FF] text-[#0D1117] px-8 py-4 rounded-xl text-base font-bold transition-all hover:-translate-y-0.5"
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-10 border-t border-[#30363D] text-[#8B949E] text-xs font-mono">
        StealthWorks 2026 &mdash; AI-Powered Interview Platform
      </footer>
    </div>
  )
}
