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

// POST: Add a member (jury or mentor) — if same person exists, add role to their roles array
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

    // Check if this person already exists in this program (by email or display_name)
    let existingMember = null
    if (email) {
      const { data } = await admin
        .from('program_members')
        .select('*')
        .eq('program_id', program_id)
        .eq('email', email)
        .single()
      existingMember = data
    }

    if (existingMember) {
      // Person already exists — add the new role to their roles array
      const currentRoles: string[] = existingMember.roles || [existingMember.role || 'viewer']
      if (currentRoles.includes(role)) {
        return NextResponse.json({ error: 'Bu kişi zaten bu rolde / This person already has this role' }, { status: 400 })
      }
      const newRoles = [...currentRoles, role]

      const { data: updated, error } = await admin
        .from('program_members')
        .update({ roles: newRoles })
        .eq('id', existingMember.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, member: updated, merged: true })
    }

    // New member — create with roles array
    const insertData: any = {
      program_id,
      roles: [role],
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

// DELETE: Remove a member (or remove a specific role)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('member_id')
    const removeRole = searchParams.get('role') // optional: remove just one role

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
      .select('*')
      .eq('id', memberId)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Can't delete owners
    const roles: string[] = member.roles || [member.role || 'viewer']
    if (roles.includes('owner')) {
      return NextResponse.json({ error: 'Cannot remove program owner' }, { status: 403 })
    }

    // Verify caller is program owner
    const { data: prog } = await admin
      .from('programs')
      .select('created_by')
      .eq('id', member.program_id)
      .single()

    if (!prog || prog.created_by !== user.id) {
      return NextResponse.json({ error: 'Only program owner can remove members' }, { status: 403 })
    }

    if (removeRole && roles.length > 1) {
      // Remove just one role, keep the member
      const newRoles = roles.filter((r: string) => r !== removeRole)
      await admin
        .from('program_members')
        .update({ roles: newRoles })
        .eq('id', memberId)
    } else {
      // Remove the entire member
      await admin
        .from('program_members')
        .delete()
        .eq('id', memberId)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
