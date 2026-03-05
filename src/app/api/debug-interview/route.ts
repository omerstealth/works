import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { HIGH_SCHOOL_SYSTEM_PROMPT, CODING_EDUCATION_SYSTEM_PROMPT } from '@/lib/interview-parameters'

// GET: Debug endpoint to check interview config
// /api/debug-interview?program_slug=ard&variant_slug=high_school
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const programSlug = searchParams.get('program_slug') || 'ard'
  const variantSlug = searchParams.get('variant_slug')

  const admin = createAdminSupabase()

  // Get program
  const { data: program } = await admin
    .from('programs')
    .select('id, name, slug, system_prompt')
    .eq('slug', programSlug)
    .single()

  if (!program) {
    return NextResponse.json({ error: 'Program not found', programSlug })
  }

  const result: any = {
    program: {
      id: program.id,
      name: program.name,
      slug: program.slug,
      system_prompt_length: program.system_prompt?.length,
      system_prompt_first_200: program.system_prompt?.substring(0, 200),
      has_startup_in_prompt: program.system_prompt?.toLowerCase().includes('startup'),
    },
    variant_slug_received: variantSlug,
    builtin_prompts: {
      'high-school': { length: HIGH_SCHOOL_SYSTEM_PROMPT.length, has_startup: HIGH_SCHOOL_SYSTEM_PROMPT.toLowerCase().includes('startup') },
      'coding-education': { length: CODING_EDUCATION_SYSTEM_PROMPT.length, has_startup: CODING_EDUCATION_SYSTEM_PROMPT.toLowerCase().includes('startup') },
    },
  }

  if (variantSlug) {
    const normalizedSlug = variantSlug.replace(/_/g, '-')
    result.normalized_slug = normalizedSlug

    // Try to find variant
    const { data: variant } = await admin
      .from('interview_variants')
      .select('*')
      .eq('program_id', program.id)
      .or(`slug.eq.${variantSlug},slug.eq.${normalizedSlug}`)
      .limit(1)
      .single()

    if (variant) {
      result.variant = {
        id: variant.id,
        slug: variant.slug,
        name: variant.name,
        has_system_prompt_override_column: !!variant.system_prompt_override,
        has_params_override: !!variant.parameters?.system_prompt_override,
        params_override_length: variant.parameters?.system_prompt_override?.length || 0,
        params_override_first_100: variant.parameters?.system_prompt_override?.substring(0, 100) || null,
        params_language: variant.parameters?.language_preference,
        params_tone: variant.parameters?.tone,
        params_strictness: variant.parameters?.strictness,
        params_keys: Object.keys(variant.parameters || {}),
      }
    } else {
      result.variant = null
      result.variant_not_found = true
    }

    // Check recent interviews for this variant
    const { data: recentInterviews } = await admin
      .from('interviews')
      .select('id, created_at, parameters_snapshot, variant_id')
      .eq('program_id', program.id)
      .order('created_at', { ascending: false })
      .limit(3)

    result.recent_interviews = (recentInterviews || []).map(i => ({
      id: i.id,
      created_at: i.created_at,
      variant_id: i.variant_id,
      has_snapshot_override: !!i.parameters_snapshot?.system_prompt_override,
      snapshot_override_length: i.parameters_snapshot?.system_prompt_override?.length || 0,
      snapshot_language: i.parameters_snapshot?.language_preference,
    }))
  }

  return NextResponse.json(result, { status: 200 })
}
