import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY

  let supabaseOk = false
  let supabaseError = null

  try {
    const supabase = await createServerSupabase()
    const { error } = await supabase.from('programs').select('id').limit(1)
    if (error) {
      supabaseError = error.message
    } else {
      supabaseOk = true
    }
  } catch (err: any) {
    supabaseError = err.message
  }

  return NextResponse.json({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl || 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: hasAnonKey ? 'SET' : 'MISSING',
      ANTHROPIC_API_KEY: hasAnthropicKey ? 'SET' : 'MISSING',
    },
    supabase: {
      connected: supabaseOk,
      error: supabaseError,
    },
  })
}
