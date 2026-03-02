import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { program_id } = await request.json()

    if (!program_id) {
      return NextResponse.json({ error: 'program_id required' }, { status: 400 })
    }

    // Use regular client to verify auth
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use admin client (bypasses RLS) for ownership check & deletion
    const admin = createAdminSupabase()

    // Verify ownership
    const { data: prog } = await admin
      .from('programs')
      .select('id, created_by')
      .eq('id', program_id)
      .single()

    if (!prog) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    if (prog.created_by && prog.created_by !== user.id) {
      return NextResponse.json({ error: 'Only program owner can delete' }, { status: 403 })
    }

    // Delete in order: interviews → program_members → program
    await admin.from('interviews').delete().eq('program_id', program_id)
    await admin.from('program_members').delete().eq('program_id', program_id)
    const { error: progError } = await admin.from('programs').delete().eq('id', program_id)

    if (progError) {
      return NextResponse.json({ error: progError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
