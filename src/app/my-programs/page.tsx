'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useLanguage, LanguageToggle } from '@/lib/i18n'

interface ProgramRow {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

export default function MyProgramsPage() {
  const router = useRouter()
  const [programs, setPrograms] = useState<ProgramRow[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()
  const { t } = useLanguage()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirect=/my-programs')
        return
      }

      // Get all programs the user can access
      // Try multiple approaches since RLS may vary
      const { data: allProgs, error: progsError } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Programs query result:', JSON.stringify({ allProgs, progsError, userId: user.id }))

      const progs = (allProgs || []) as ProgramRow[]
      setPrograms(progs)
      setLoading(false)
    }
    init()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#58A6FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#8B949E] text-sm font-mono">{t('myPrograms.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] p-6">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-[#30363D]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#58A6FF] to-[#F78166] rounded-lg flex items-center justify-center font-mono font-bold text-[#0D1117]">
              S
            </div>
            <div>
              <h1 className="text-lg font-semibold">{t('myPrograms.title')}</h1>
              <span className="text-xs text-[#8B949E] font-mono">Devam etmek için bir program seçin</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Link
              href="/create"
              className="text-sm bg-[#58A6FF] text-[#0D1117] px-4 py-2 rounded-lg font-semibold hover:bg-[#79B8FF] transition-colors"
            >
              + Yeni Program
            </Link>
          </div>
        </header>

        {programs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-xl font-bold mb-2">{t('myPrograms.empty')}</h2>
            <p className="text-sm text-[#8B949E] mb-6">Başlamak için ilk hızlandırıcı programınızı oluşturun.</p>
            <Link
              href="/create"
              className="inline-flex bg-[#58A6FF] text-[#0D1117] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#79B8FF] transition-colors"
            >
              {t('myPrograms.createFirst')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {programs.map(prog => (
              <div
                key={prog.id}
                className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 hover:border-[#58A6FF] transition-colors cursor-pointer"
                onClick={() => router.push(`/${prog.slug}/dashboard`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#58A6FF] to-[#F78166] rounded-[10px] flex items-center justify-center font-mono font-bold text-lg text-[#0D1117]">
                    {prog.name[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{prog.name}</h3>
                    {prog.description && (
                      <p className="text-xs text-[#8B949E] mt-0.5 line-clamp-1">{prog.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <button
                      onClick={e => { e.stopPropagation(); router.push(`/${prog.slug}/demo`) }}
                      className="bg-gradient-to-r from-[#58A6FF] to-[#F78166] text-[#0D1117] px-3 py-1.5 rounded-md text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      ▶️ {t('common.demo')}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); router.push(`/${prog.slug}/dashboard`) }}
                      className="bg-[#0D1117] border border-[#30363D] text-[#8B949E] px-3 py-1.5 rounded-md text-xs hover:border-[#58A6FF] hover:text-[#58A6FF] transition-colors"
                    >
                      📋 {t('common.dashboard')}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); router.push(`/${prog.slug}/results`) }}
                      className="bg-[#0D1117] border border-[#30363D] text-[#8B949E] px-3 py-1.5 rounded-md text-xs hover:border-[#3FB950] hover:text-[#3FB950] transition-colors"
                    >
                      📊 {t('common.results')}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); router.push(`/${prog.slug}/program`) }}
                      className="bg-[#0D1117] border border-[#30363D] text-[#8B949E] px-3 py-1.5 rounded-md text-xs hover:border-[#F78166] hover:text-[#F78166] transition-colors"
                    >
                      🎓 {t('common.program')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
