import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/admin'

// GET: List members for a program
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('program_id')

    if (!programId) {
      return NextResponse.json({ error: 'program_id required' }, { status: 400 })
    }

    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminSupabase()
    const { data: members, error } = await admin
      .from('program_members')
      .select('*')
      .eq('program_id', programId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ members: members || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST: Add a member (jury or mentor)
export async function POST(request: NextRequest) {
  try {
    const { program_id, role, display_name, email } = await request.json()

    if (!program_id || !role || !display_name) {
      return NextResponse.json({ error: 'program_id, role, and display_name are required' }, { status: 400 })
    }

    if (!['jury', 'mentor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify caller is program owner
    const admin = createAdminSupabase()
    const { data: program } = await admin
      .from('programs')
      .select('created_by')
      .eq('id', program_id)
      .single()

    if (!program || program.created_by !== user.id) {
      return NextResponse.json({ error: 'Only program owner can add members' }, { status: 403 })
    }

    // For invited members, user_id is null until they sign up and claim their seat
    const insertData: any = {
      program_id,
      role,
      display_name,
      email: email || null,
    }

    // If the invited person already has an account, link them
    if (email) {
      const { data: existingUsers } = await admin.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find((u: any) => u.email === email)
      if (existingUser) {
        insertData.user_id = existingUser.id
      }
    }

    const { data: member, error } = await admin
      .from('program_members')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, member })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE: Remove a member
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('member_id')

    if (!memberId) {
      return NextResponse.json({ error: 'member_id required' }, { status: 400 })
    }

    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminSupabase()

    // Get member to find program_id
    const { data: member } = await admin
      .from('program_members')
      .select('program_id, role')
      .eq('id', memberId)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Can't delete owners
    if (member.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove program owner' }, { status: 403 })
    }

    // Verify caller is program owner
    const { data: program } = await admin
      .from('programs')
      .select('created_by')
      .eq('id', member.program_id)
      .single()

    if (!program || program.created_by !== user.id) {
      return NextResponse.json({ error: 'Only program owner can remove members' }, { status: 403 })
    }

    await admin
      .from('program_members')
      .delete()
      .eq('id', memberId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
