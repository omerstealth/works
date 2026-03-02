'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage, LanguageToggle } from '@/lib/i18n'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const supabase = createClient()
  const { t } = useLanguage()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}` },
      })
      if (error) {
        setError(error.message)
      } else if (data.session) {
        // Email confirmation disabled — user is logged in immediately
        window.location.href = redirect
      } else {
        // Email confirmation enabled — need to verify
        setMessage(t('auth.checkEmail'))
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else window.location.href = redirect
    }

    setLoading(false)
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}` },
    })
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[#58A6FF] to-[#F78166] rounded-2xl flex items-center justify-center font-mono font-bold text-2xl text-[#0D1117] mx-auto mb-4">
          S
        </div>
        <h1 className="text-xl font-bold">StealthWorks</h1>
        <p className="text-sm text-[#8B949E] mt-1">{isSignUp ? t('auth.signup') : t('auth.login')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={t('auth.email')}
          required
          className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#58A6FF] placeholder-[#8B949E] transition-colors"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={t('auth.password')}
          required
          minLength={6}
          className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#58A6FF] placeholder-[#8B949E] transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#58A6FF] text-[#0D1117] py-3 rounded-lg font-semibold text-sm transition-all hover:bg-[#79B8FF] disabled:opacity-50"
        >
          {loading ? '...' : isSignUp ? t('auth.signupBtn') : t('auth.loginBtn')}
        </button>
      </form>

      <div className="my-4 flex items-center gap-4">
        <div className="flex-1 h-px bg-[#30363D]" />
        <span className="text-xs text-[#8B949E]">or</span>
        <div className="flex-1 h-px bg-[#30363D]" />
      </div>

      <button
        onClick={handleGoogleLogin}
        className="w-full bg-[#161B22] border border-[#30363D] text-[#E6EDF3] py-3 rounded-lg font-medium text-sm hover:border-[#58A6FF] transition-colors"
      >
        {t('auth.googleBtn')}
      </button>

      <p className="text-center text-xs text-[#8B949E] mt-6">
        {isSignUp ? t('auth.switchToLogin') : t('auth.switchToSignup')}
        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null) }}
          className="text-[#58A6FF] ml-1 hover:underline"
        >
          {isSignUp ? t('auth.login') : t('auth.signup')}
        </button>
      </p>

      {error && <div className="mt-4 text-sm text-red-400 text-center">{error}</div>}
      {message && <div className="mt-4 text-sm text-[#3FB950] text-center">{message}</div>}
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] flex items-center justify-center p-6">
      <div className="absolute top-6 right-6">
        <LanguageToggle />
      </div>
      <Suspense fallback={
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#58A6FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#8B949E] text-sm font-mono">Loading...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
