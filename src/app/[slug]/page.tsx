import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSupabase()

  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!program) notFound()

  const colors = program.brand_colors || { accent: '#58A6FF', bg: '#0D1117', orange: '#F78166', green: '#3FB950' }

  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: '#E6EDF3' }}>
      {/* Hero */}
      <div className="relative text-center py-20 px-6 overflow-hidden">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 0%, ${colors.accent}1F 0%, transparent 70%)` }} />

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono mb-6" style={{ background: `${colors.accent}1A`, border: `1px solid ${colors.accent}33`, color: colors.accent }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: colors.green }} />
            Applications Open
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-4">
            <span style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.orange})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {program.name}
            </span>
          </h1>

          <p className="text-lg text-[#8B949E] max-w-lg mx-auto mb-10 leading-relaxed">
            {program.description || 'AI-powered accelerator program with adaptive interview technology.'}
          </p>

          <Link
            href={`/${slug}/interview`}
            className="inline-flex items-center gap-2.5 px-10 py-4 rounded-xl text-base font-bold transition-all hover:-translate-y-0.5"
            style={{ background: colors.accent, color: colors.bg }}
          >
            Start Your AI Interview
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill={colors.bg}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>

          <span className="block mt-3 text-xs text-[#8B949E] font-mono">
            ~10 min with our AI agent — no CV needed
          </span>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-xs font-mono mb-3 tracking-wider" style={{ color: colors.accent }}>{'// HOW IT WORKS'}</div>
        <h2 className="text-2xl font-bold mb-8">From Application to Investment</h2>

        <div className="relative flex flex-col gap-0">
          <div className="absolute left-[23px] top-10 bottom-10 w-0.5 bg-[#30363D]" />

          {[
            { num: '01', title: 'AI Interview', desc: 'Talk to our AI agent for ~10 minutes. No CV, no cover letter. Just you, your idea, and an adaptive conversation.', color: colors.accent },
            { num: '02', title: 'Review', desc: 'Our team reviews AI-generated evaluations and selects the best candidates for the program.', color: colors.orange },
            { num: '03', title: 'Program', desc: 'Selected founders get access to resources, mentorship, and tools to build and scale their AI-native products.', color: colors.green },
            { num: '04', title: 'Demo Day', desc: 'Present to investors and the community. Qualified startups receive investment and continued support.', color: '#A371F7' },
          ].map((step) => (
            <div key={step.num} className="flex gap-5 items-start py-5 relative">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg shrink-0 relative z-10"
                style={{ background: step.color, color: colors.bg }}
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

      {/* Final CTA */}
      <div className="text-center py-20 px-6 relative">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 100%, ${colors.orange}1A 0%, transparent 60%)` }} />
        <div className="relative">
          <h2 className="text-3xl font-extrabold mb-3">Ready to build the future?</h2>
          <p className="text-[#8B949E] mb-8">The interview takes 10 minutes. Your startup could change everything.</p>
          <Link
            href={`/${slug}/interview`}
            className="inline-flex items-center gap-2.5 px-10 py-4 rounded-xl text-base font-bold transition-all hover:-translate-y-0.5"
            style={{ background: colors.accent, color: colors.bg }}
          >
            Start Your AI Interview
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill={colors.bg}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-10 border-t border-[#30363D] text-[#8B949E] text-xs font-mono">
        {program.name} &mdash; Powered by <Link href="/" className="underline hover:text-[#E6EDF3]">StealthWorks</Link>
      </footer>
    </div>
  )
}
