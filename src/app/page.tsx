'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'
import Navbar from '@/components/Navbar'

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

function parseAgents(raw: string): { emoji: string; name: string; role: string }[] {
  if (!raw) return []
  return raw.split(';;').map(a => {
    const [emoji, name, role] = a.split('|')
    return { emoji, name, role }
  })
}

export default function HomePage() {
  const [selectedStage, setSelectedStage] = useState<number | null>(null)
  const { t } = useLanguage()

  const stageEmojis = ['🤖', '⚖️', '🗣', '✅', '🚀', '🎤']
  const stageColors = ['#58A6FF', '#D2A8FF', '#F78166', '#3FB950', '#58A6FF', '#F78166']

  const pipeline: PipelineStage[] = stageEmojis.map((emoji, i) => ({
    emoji,
    title: t(`stage.${i}.title`),
    color: stageColors[i],
    desc: t(`stage.${i}.desc`),
    detail: {
      subtitle: t(`stage.${i}.subtitle`),
      howItWorks: t(`stage.${i}.howItWorks`),
      features: t(`stage.${i}.features`).split('|'),
      agents: t(`stage.${i}.agents`) !== `stage.${i}.agents` ? parseAgents(t(`stage.${i}.agents`)) : undefined,
      output: t(`stage.${i}.output`),
    },
  }))

  const audiences = [
    { emoji: '🏢', title: t('audience.0.title'), desc: t('audience.0.desc') },
    { emoji: '💰', title: t('audience.1.title'), desc: t('audience.1.desc') },
    { emoji: '🎓', title: t('audience.2.title'), desc: t('audience.2.desc') },
    { emoji: '🏗', title: t('audience.3.title'), desc: t('audience.3.desc') },
  ]

  const howSteps = [
    { num: '01', title: t('howItWorks.step1.title'), desc: t('howItWorks.step1.desc'), color: '#58A6FF' },
    { num: '02', title: t('howItWorks.step2.title'), desc: t('howItWorks.step2.desc'), color: '#F78166' },
    { num: '03', title: t('howItWorks.step3.title'), desc: t('howItWorks.step3.desc'), color: '#3FB950' },
  ]

  const selected = selectedStage !== null ? pipeline[selectedStage] : null

  const agentSectionLabel = (i: number) => {
    if (i === 0) return t('pipeline.agents0')
    if (i === 1) return t('pipeline.agents1')
    if (i === 4) return t('pipeline.agents4')
    return t('pipeline.agentsDefault')
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3]">
      <Navbar />

      {/* ═══════ HERO ═══════ */}
      <div className="relative text-center pt-20 pb-24 sm:pt-28 sm:pb-32 px-6 overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(88,166,255,0.18)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(247,129,102,0.08)_0%,transparent_50%)]" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[rgba(88,166,255,0.08)] border border-[rgba(88,166,255,0.2)] px-4 py-1.5 rounded-full text-xs font-mono text-[#58A6FF] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3FB950] animate-pulse" />
            {t('hero.badge')}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.05] mb-6">
            {t('hero.title1')}{' '}
            <br className="hidden md:block" />
            {t('hero.title2')}{' '}
            <span className="bg-gradient-to-r from-[#58A6FF] via-[#D2A8FF] to-[#F78166] bg-clip-text text-transparent">
              {t('hero.title3')}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#8B949E] max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-[#58A6FF] text-[#0D1117] px-7 py-3.5 sm:px-8 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#58A6FF]/20"
            >
              {t('hero.cta')}
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#0D1117" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link
              href="/auth/login?redirect=/my-programs"
              className="inline-flex items-center gap-2 bg-[#161B22] border border-[#30363D] text-[#E6EDF3] px-7 py-3.5 sm:px-8 sm:py-4 rounded-xl text-sm sm:text-base font-semibold transition-all hover:border-[#58A6FF] hover:-translate-y-0.5"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              {t('hero.demo')}
            </Link>
          </div>

          {/* Social proof line */}
          <p className="text-xs text-[#484F58] font-mono tracking-wide">
            {t('hero.socialProof')}
          </p>
        </div>
      </div>

      {/* ═══════ NUMBERS BAR ═══════ */}
      <div className="border-y border-[#30363D] bg-[#161B22]/50">
        <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0">
          {[
            { value: t('numbers.time'), label: t('numbers.timeLabel'), color: '#58A6FF' },
            { value: t('numbers.interviews'), label: t('numbers.interviewsLabel'), color: '#D2A8FF' },
            { value: t('numbers.jury'), label: t('numbers.juryLabel'), color: '#F78166' },
            { value: t('numbers.coverage'), label: t('numbers.coverageLabel'), color: '#3FB950' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-mono" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11px] text-[#8B949E] mt-1 font-mono leading-tight">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════ PROBLEM ═══════ */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="text-xs font-mono text-[#F85149] mb-3 tracking-wider">{t('problem.section')}</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">{t('problem.title')}</h2>
          <p className="text-sm text-[#8B949E] max-w-xl mx-auto">{t('problem.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '⏱', title: t('problem.item1.title'), desc: t('problem.item1.desc'), color: '#F85149' },
            { icon: '📋', title: t('problem.item2.title'), desc: t('problem.item2.desc'), color: '#F78166' },
            { icon: '📈', title: t('problem.item3.title'), desc: t('problem.item3.desc'), color: '#D29922' },
          ].map(item => (
            <div key={item.title} className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 text-center hover:border-[#F85149]/30 transition-colors">
              <div className="text-2xl mb-3">{item.icon}</div>
              <h3 className="text-sm font-semibold mb-1.5" style={{ color: item.color }}>{item.title}</h3>
              <p className="text-xs text-[#8B949E] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════ SOLUTION TRANSITION ═══════ */}
      <div className="text-center px-6 py-4">
        <div className="inline-flex items-center gap-3 text-[#3FB950]">
          <div className="w-8 h-[1px] bg-[#30363D]" />
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
          <div className="w-8 h-[1px] bg-[#30363D]" />
        </div>
      </div>

      {/* ═══════ PIPELINE ═══════ */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <div className="text-xs font-mono text-[#58A6FF] mb-3 tracking-wider">{t('solution.section')}</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            {t('solution.title')}{' '}
            <span className="bg-gradient-to-r from-[#58A6FF] to-[#3FB950] bg-clip-text text-transparent">{t('solution.titleHighlight')}</span>
          </h2>
          <p className="text-sm text-[#8B949E] max-w-lg mx-auto mt-3">{t('solution.subtitle')}</p>
          <p className="text-[11px] text-[#484F58] mt-4 font-mono">{t('pipeline.clickHint')}</p>
        </div>

        {/* Pipeline flow: connected cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pipeline.map((step, i) => (
            <div
              key={step.title}
              onClick={() => setSelectedStage(i)}
              className="group bg-[#161B22] border border-[#30363D] rounded-xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 relative"
              style={{ borderColor: selectedStage === i ? step.color : undefined }}
            >
              {/* Step number badge */}
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

      {/* ═══════ Stage Detail Modal ═══════ */}
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
                <div className="text-[10px] font-mono text-[#8B949E] mb-2 tracking-wider">{t('pipeline.howItWorks')}</div>
                <p className="text-sm text-[#E6EDF3] leading-relaxed">{selected.detail.howItWorks}</p>
              </div>

              {/* Agents */}
              {selected.detail.agents && selected.detail.agents.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono text-[#8B949E] mb-2 tracking-wider">
                    {agentSectionLabel(selectedStage)}
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
                <div className="text-[10px] font-mono text-[#8B949E] mb-2 tracking-wider">{t('pipeline.features')}</div>
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
                <div className="text-[10px] font-mono text-[#8B949E] mb-2 tracking-wider">{t('pipeline.output')}</div>
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

      {/* ═══════ HOW IT WORKS ═══════ */}
      <div className="bg-[#161B22]/50 py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs font-mono text-[#3FB950] mb-3 tracking-wider">{t('howItWorks.section')}</div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-12">{t('howItWorks.title')}</h2>

          <div className="space-y-6">
            {howSteps.map((step, i) => (
              <div key={step.num} className="flex gap-5 items-start">
                <div className="flex flex-col items-center">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg shrink-0"
                    style={{ background: step.color, color: '#0D1117' }}
                  >
                    {step.num}
                  </div>
                  {i < howSteps.length - 1 && (
                    <div className="w-[2px] h-6 bg-[#30363D] mt-2" />
                  )}
                </div>
                <div className="pt-1">
                  <h3 className="text-base font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-[#8B949E] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ WHO IT'S FOR ═══════ */}
      <div className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-mono text-[#F78166] mb-3 tracking-wider">{t('audience.section')}</div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              {t('audience.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {audiences.map(a => (
              <div key={a.title} className="flex items-start gap-4 bg-[#161B22] border border-[#30363D] rounded-xl p-5 hover:border-[#F78166]/40 transition-colors">
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

      {/* ═══════ CTA ═══════ */}
      <div className="text-center py-24 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,rgba(88,166,255,0.12)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,rgba(247,129,102,0.08)_0%,transparent_50%)]" />
        <div className="relative max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3">
            {t('cta.title1')}{' '}
            <span className="bg-gradient-to-r from-[#58A6FF] to-[#F78166] bg-clip-text text-transparent">
              {t('cta.title2')}
            </span>
            {' '}{t('cta.title3')}
          </h2>
          <p className="text-[#8B949E] mb-8 max-w-md mx-auto text-sm sm:text-base">{t('cta.subtitle')}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-[#58A6FF] text-[#0D1117] px-8 py-4 rounded-xl text-sm sm:text-base font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#58A6FF]/20"
            >
              {t('cta.button')}
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#0D1117" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-[#30363D] px-6 py-10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-[#58A6FF] to-[#F78166] rounded-md flex items-center justify-center font-mono font-bold text-[9px] text-[#0D1117]">
              S
            </div>
            <span className="text-xs text-[#8B949E] font-mono">{t('footer.text')}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-xs text-[#484F58] hover:text-[#8B949E] transition-colors">{t('nav.login')}</Link>
            <Link href="/create" className="text-xs text-[#484F58] hover:text-[#8B949E] transition-colors">{t('nav.create')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
