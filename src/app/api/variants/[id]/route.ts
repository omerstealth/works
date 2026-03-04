import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/admin'

// Helper: get user from cookie session OR Authorization header
async function getAuthUser(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) return user
  } catch {}

  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const admin = createAdminSupabase()
    const { data: { user } } = await admin.auth.getUser(token)
    if (user) return user
  }

  return null
}

// GET: Get single variant details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = createAdminSupabase()

    const { data: variant, error } = await admin
      .from('interview_variants')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    return NextResponse.json({ variant })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PUT: Update variant parameters
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminSupabase()

    // Get variant to verify ownership
    const { data: variant } = await admin
      .from('interview_variants')
      .select('program_id')
      .eq('id', id)
      .single()

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    const { data: program } = await admin
      .from('programs')
      .select('created_by')
      .eq('id', variant.program_id)
      .single()

    if (!program || program.created_by !== user.id) {
      return NextResponse.json({ error: 'Only program owner can update variants' }, { status: 403 })
    }

    // Build update object (only update provided fields)
    const updateData: any = { updated_at: new Date().toISOString() }

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.targeting !== undefined) updateData.targeting = body.targeting
    if (body.self_improvement_config !== undefined) updateData.self_improvement_config = body.self_improvement_config
    if (body.is_default !== undefined) updateData.is_default = body.is_default

    // Parameters update: merge with existing + bump version
    if (body.parameters !== undefined) {
      const { data: current } = await admin
        .from('interview_variants')
        .select('parameters')
        .eq('id', id)
        .single()

      const currentParams = current?.parameters || {}
      updateData.parameters = {
        ...currentParams,
        ...body.parameters,
        version: (currentParams.version || 1) + 1,
      }
    }

    const { data: updated, error } = await admin
      .from('interview_variants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, variant: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE: Remove a variant
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminSupabase()

    const { data: variant } = await admin
      .from('interview_variants')
      .select('program_id, is_default')
      .eq('id', id)
      .single()

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    if (variant.is_default) {
      return NextResponse.json({ error: 'Cannot delete default variant' }, { status: 400 })
    }

    const { data: program } = await admin
      .from('programs')
      .select('created_by')
      .eq('id', variant.program_id)
      .single()

    if (!program || program.created_by !== user.id) {
      return NextResponse.json({ error: 'Only program owner can delete variants' }, { status: 403 })
    }

    await admin
      .from('interview_variants')
      .delete()
      .eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
