import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { program_id } = await request.json()

    if (!program_id) {
      return NextResponse.json({ error: 'program_id required' }, { status: 400 })
    }

    const supabase = await createServerSupabase()

    // Verify the user owns this program
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check ownership via program_members OR programs.created_by
    const { data: membership } = await supabase
      .from('program_members')
      .select('role')
      .eq('program_id', program_id)
      .eq('user_id', user.id)
      .single()

    const isOwnerViaMembership = membership?.role === 'owner'

    // Fallback: check created_by on the program itself
    let isOwnerViaCreatedBy = false
    if (!isOwnerViaMembership) {
      const { data: prog } = await supabase
        .from('programs')
        .select('created_by')
        .eq('id', program_id)
        .single()
      isOwnerViaCreatedBy = prog?.created_by === user.id
    }

    if (!isOwnerViaMembership && !isOwnerViaCreatedBy) {
      return NextResponse.json({ error: 'Only program owner can delete' }, { status: 403 })
    }

    // Delete interviews first (foreign key)
    const { error: intError } = await supabase
      .from('interviews')
      .delete()
      .eq('program_id', program_id)

    if (intError) {
      return NextResponse.json({ error: `Failed to delete interviews: ${intError.message}` }, { status: 500 })
    }

    // Delete program members
    const { error: memError } = await supabase
      .from('program_members')
      .delete()
      .eq('program_id', program_id)

    if (memError) {
      return NextResponse.json({ error: `Failed to delete members: ${memError.message}` }, { status: 500 })
    }

    // Delete the program
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
