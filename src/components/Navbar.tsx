'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage, LanguageToggle } from '@/lib/i18n'

interface NavbarProps {
  slug?: string
  minimal?: boolean
}

export default function Navbar({ slug, minimal }: NavbarProps) {
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()

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

  // Close menus on outside click
  useEffect(() => {
    if (!showUserMenu && !mobileOpen) return
    const close = () => { setShowUserMenu(false); setMobileOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showUserMenu, mobileOpen])

  const programLinks = slug && !minimal ? [
    { href: `/${slug}/dashboard`, label: t('nav.dashboard') },
    { href: `/${slug}/evaluate`, label: t('nav.evaluate') },
    { href: `/${slug}/results`, label: t('nav.results') },
    { href: `/${slug}/program`, label: t('nav.program') },
    { href: `/${slug}/demo`, label: 'Demo' },
  ] : []

  const isActive = (href: string) => pathname === href

  return (
    <nav className="border-b border-[#30363D] bg-[#0D1117] relative z-40">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Left — Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-gradient-to-br from-[#58A6FF] to-[#F78166] rounded-lg flex items-center justify-center font-mono font-bold text-sm text-[#0D1117]">
            S
          </div>
          <span className="font-semibold tracking-wide text-sm hidden sm:inline">StealthWorks</span>
        </Link>

        {/* Center — Desktop nav tabs */}
        {programLinks.length > 0 && (
          <div className="hidden md:flex items-center gap-1 bg-[#161B22] rounded-lg p-1">
            {programLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-[#30363D] text-[#E6EDF3]'
                    : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#30363D]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right — Lang + User + Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle />

          {/* Desktop user menu */}
          {!minimal && user ? (
            <div className="relative hidden sm:block">
              <button
                onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu) }}
                className="flex items-center gap-2 text-sm text-[#E6EDF3] hover:text-white transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#58A6FF] to-[#D2A8FF] flex items-center justify-center text-[10px] font-bold text-[#0D1117]">
                  {(user.name || '?')[0].toUpperCase()}
                </div>
                <span className="hidden lg:inline text-xs">{user.name}</span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-10 bg-[#161B22] border border-[#30363D] rounded-lg shadow-xl py-1 min-w-[180px] z-50">
                  <div className="px-4 py-2 border-b border-[#30363D]">
                    <div className="text-sm font-medium text-[#E6EDF3]">{user.name}</div>
                    <div className="text-xs text-[#8B949E]">{user.email}</div>
                  </div>
                  <Link href="/my-programs" className="block px-4 py-2 text-sm text-[#E6EDF3] hover:bg-[#30363D] transition-colors">
                    {t('nav.myPrograms')}
                  </Link>
                  <Link href="/create" className="block px-4 py-2 text-sm text-[#E6EDF3] hover:bg-[#30363D] transition-colors">
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
            <Link href="/auth/login" className="hidden sm:inline text-xs text-[#8B949E] hover:text-[#E6EDF3] transition-colors">
              {t('nav.login')}
            </Link>
          ) : null}

          {/* Mobile hamburger */}
          {!minimal && (
            <button
              onClick={(e) => { e.stopPropagation(); setMobileOpen(!mobileOpen) }}
              className="sm:hidden w-8 h-8 flex items-center justify-center text-[#8B949E] hover:text-[#E6EDF3] transition-colors"
              aria-label={t('nav.menu')}
            >
              {mobileOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && !minimal && (
        <div className="sm:hidden border-t border-[#30363D] bg-[#161B22] px-4 py-3 space-y-1" onClick={(e) => e.stopPropagation()}>
          {/* Program nav links */}
          {programLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                isActive(link.href)
                  ? 'bg-[#30363D] text-[#E6EDF3]'
                  : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#30363D]'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {programLinks.length > 0 && <div className="border-t border-[#30363D] my-2" />}

          {/* User links */}
          {user ? (
            <>
              <div className="px-3 py-2 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#58A6FF] to-[#D2A8FF] flex items-center justify-center text-[9px] font-bold text-[#0D1117]">
                  {(user.name || '?')[0].toUpperCase()}
                </div>
                <span className="text-sm text-[#E6EDF3]">{user.name}</span>
                <span className="text-xs text-[#8B949E]">{user.email}</span>
              </div>
              <Link href="/my-programs" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-md text-sm text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#30363D]">
                {t('nav.myPrograms')}
              </Link>
              <Link href="/create" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-md text-sm text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#30363D]">
                {t('nav.create')}
              </Link>
              <button
                onClick={async () => {
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  setUser(null)
                  setMobileOpen(false)
                  router.push('/')
                }}
                className="w-full text-left px-3 py-2 rounded-md text-sm text-[#F85149] hover:bg-[#30363D]"
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-md text-sm text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#30363D]">
              {t('nav.login')}
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
