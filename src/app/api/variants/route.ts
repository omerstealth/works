import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { DEFAULT_PARAMETERS, DEFAULT_TARGETING, DEFAULT_SELF_IMPROVEMENT } from '@/lib/interview-parameters'

// GET: List variants for a program
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('program_id')

    if (!programId) {
      return NextResponse.json({ error: 'program_id required' }, { status: 400 })
    }

    const admin = createAdminSupabase()
    const { data: variants, error } = await admin
      .from('interview_variants')
      .select('*')
      .eq('program_id', programId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get program slug for link generation
    const { data: program } = await admin
      .from('programs')
      .select('slug')
      .eq('id', programId)
      .single()

    const variantsWithLinks = (variants || []).map(v => ({
      ...v,
      interview_link: `/${program?.slug}/interview${v.is_default ? '' : `?v=${v.slug}`}`,
    }))

    return NextResponse.json({ variants: variantsWithLinks })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST: Create a new variant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { program_id, name, slug, description, targeting, parameters, self_improvement_config, is_default, system_prompt_override } = body


    if (!program_id || !name || !slug) {
      return NextResponse.json({ error: 'program_id, name, and slug are required' }, { status: 400 })
    }

    const admin = createAdminSupabase()

    // Verify program exists
    const { data: program } = await admin
      .from('programs')
      .select('id')
      .eq('id', program_id)
      .single()

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Merge with defaults — include system_prompt_override in params JSONB
    const finalParams = { ...DEFAULT_PARAMETERS, ...(parameters || {}) }
    if (system_prompt_override) {
      finalParams.system_prompt_override = system_prompt_override
    }
    const finalTargeting = { ...DEFAULT_TARGETING, ...(targeting || {}) }
    const finalSI = { ...DEFAULT_SELF_IMPROVEMENT, ...(self_improvement_config || {}) }

    // Sanitize slug
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')

    const { data: variant, error } = await admin
      .from('interview_variants')
      .insert({
        program_id,
        slug: cleanSlug,
        name,
        description: description || null,
        targeting: finalTargeting,
        parameters: finalParams,
        self_improvement_config: finalSI,
        is_default: is_default || false,
      })
      .select()
      .single()

    if (error) {
      if (error.message.includes('unique')) {
        return NextResponse.json({ error: 'Bu slug zaten kullanılıyor / This slug is already taken' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, variant })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
