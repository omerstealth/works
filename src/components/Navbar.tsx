'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage, LanguageToggle } from '@/lib/i18n'

interface NavbarProps {
  /** Current program slug — enables program-specific nav links */
  slug?: string
  /** Show only minimal nav (logo + lang toggle) for public pages like interview */
  minimal?: boolean
}

export default function Navbar({ slug, minimal }: NavbarProps) {
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { t } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser({
          email: u.email,
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0],
        })
      }
    })
  }, [])

  // Close menu on outside click
  useEffect(() => {
    if (!showUserMenu) return
    const close = () => setShowUserMenu(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showUserMenu])

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-[#30363D] bg-[#0D1117]">
      {/* Left — Logo */}
      <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 bg-gradient-to-br from-[#58A6FF] to-[#F78166] rounded-lg flex items-center justify-center font-mono font-bold text-sm text-[#0D1117]">
          S
        </div>
        <span className="font-semibold tracking-wide text-sm">StealthWorks</span>
      </Link>

      {/* Center — Page nav links (only when slug is present) */}
      {slug && !minimal && (
        <div className="hidden sm:flex items-center gap-1 bg-[#161B22] rounded-lg p-1">
          <Link
            href={`/${slug}/dashboard`}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#30363D] transition-colors"
          >
            {t('nav.dashboard')}
          </Link>
          <Link
            href={`/${slug}/results`}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#30363D] transition-colors"
          >
            {t('nav.results')}
          </Link>
          <Link
            href={`/${slug}/program`}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#30363D] transition-colors"
          >
            {t('nav.program')}
          </Link>
          <Link
            href={`/${slug}/demo`}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#30363D] transition-colors"
          >
            Demo
          </Link>
        </div>
      )}

      {/* Right — Lang toggle + user menu */}
      <div className="flex items-center gap-3">
        <LanguageToggle />
        {!minimal && user ? (
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu) }}
              className="flex items-center gap-2 text-sm text-[#E6EDF3] hover:text-white transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#58A6FF] to-[#D2A8FF] flex items-center justify-center text-[10px] font-bold text-[#0D1117]">
                {(user.name || '?')[0].toUpperCase()}
              </div>
              <span className="hidden sm:inline text-xs">{user.name}</span>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-10 bg-[#161B22] border border-[#30363D] rounded-lg shadow-xl py-1 min-w-[180px] z-50">
                <div className="px-4 py-2 border-b border-[#30363D]">
                  <div className="text-sm font-medium text-[#E6EDF3]">{user.name}</div>
                  <div className="text-xs text-[#8B949E]">{user.email}</div>
                </div>
                <Link
                  href="/my-programs"
                  className="block px-4 py-2 text-sm text-[#E6EDF3] hover:bg-[#30363D] transition-colors"
                >
                  {t('nav.myPrograms')}
                </Link>
                <Link
                  href="/create"
                  className="block px-4 py-2 text-sm text-[#E6EDF3] hover:bg-[#30363D] transition-colors"
                >
                  {t('nav.create')}
                </Link>
                <button
                  onClick={async () => {
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    setUser(null)
                    setShowUserMenu(false)
                    router.push('/')
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-[#F85149] hover:bg-[#30363D] transition-colors"
                >
                  {t('nav.logout')}
                </button>
              </div>
            )}
          </div>
        ) : !minimal ? (
          <Link href="/auth/login" className="text-xs text-[#8B949E] hover:text-[#E6EDF3] transition-colors">
            {t('nav.login')}
          </Link>
        ) : null}
      </div>
    </nav>
  )
}
