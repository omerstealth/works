import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY

  return NextResponse.json({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl || 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: hasAnonKey ? 'SET' : 'MISSING',
      ANTHROPIC_API_KEY: hasAnthropicKey ? 'SET' : 'MISSING',
    },
  })
}
