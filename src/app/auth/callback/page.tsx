'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  useEffect(() => {
    const supabase = createClient()

    // Handle the OAuth callback
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push(redirect)
      }
    })
  }, [redirect, router])

  return (
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-[#58A6FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-[#8B949E] text-sm font-mono">Signing you in...</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] flex items-center justify-center">
      <Suspense fallback={
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#58A6FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#8B949E] text-sm font-mono">Loading...</p>
        </div>
      }>
        <CallbackHandler />
      </Suspense>
    </div>
  )
}
