import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { program_id } = await request.json()

    if (!program_id) {
      return NextResponse.json({ error: 'program_id required' }, { status: 400 })
    }

    const supabase = await createServerSupabase()

    // Verify the user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check ownership via programs.created_by only (avoids program_members RLS recursion)
    const { data: prog, error: progFetchError } = await supabase
      .from('programs')
      .select('id, created_by')
      .eq('id', program_id)
      .single()

    if (progFetchError || !prog) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Allow delete if user is the creator, or if created_by is null (legacy programs)
    if (prog.created_by && prog.created_by !== user.id) {
      return NextResponse.json({ error: 'Only program owner can delete' }, { status: 403 })
    }

    // 1. Delete interviews
    const { error: intError } = await supabase
      .from('interviews')
      .delete()
      .eq('program_id', program_id)

    if (intError) {
      return NextResponse.json({ error: `Failed to delete interviews: ${intError.message}` }, { status: 500 })
    }

    // 2. Try to delete program_members (ignore RLS errors)
    await supabase
      .from('program_members')
      .delete()
      .eq('program_id', program_id)

    // 3. Delete the program
    const { error: progError } = await supabase
      .from('programs')
      .delete()
      .eq('id', program_id)

    if (progError) {
      return NextResponse.json({ error: `Failed to delete program: ${progError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
