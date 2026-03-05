import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { HIGH_SCHOOL_SYSTEM_PROMPT, CODING_EDUCATION_SYSTEM_PROMPT, VARIANT_PRESETS } from '@/lib/interview-parameters'

const BUILTIN_PROMPTS: Record<string, string> = {
  'high-school': HIGH_SCHOOL_SYSTEM_PROMPT,
  'coding-education': CODING_EDUCATION_SYSTEM_PROMPT,
}

// GET: One-time fix to patch variant with system_prompt_override
// Visit: /api/fix-variant?slug=high-school OR /api/fix-variant?slug=coding-education
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug') || 'high-school'
    const normalizedSlug = slug.replace(/_/g, '-')

    const admin = createAdminSupabase()

    // Find variant by slug (try both forms)
    const { data: variants, error } = await admin
      .from('interview_variants')
      .select('*')
      .or(`slug.eq.${slug},slug.eq.${normalizedSlug}`)

    if (error || !variants?.length) {
      return NextResponse.json({ error: 'Variant not found', slug, normalizedSlug }, { status: 404 })
    }

    const results = []

    for (const variant of variants) {
      const variantSlugNorm = variant.slug?.replace(/_/g, '-')
      const builtinPrompt = BUILTIN_PROMPTS[variantSlugNorm]
      const preset = VARIANT_PRESETS[variantSlugNorm]

      if (builtinPrompt) {
        const currentParams = variant.parameters || {}
        const hasOverride = !!currentParams.system_prompt_override

        if (!hasOverride) {
          const updatedParams = {
            ...currentParams,
            ...(preset?.parameters || {}),
            system_prompt_override: builtinPrompt,
          }

          await admin
            .from('interview_variants')
            .update({ parameters: updatedParams })
            .eq('id', variant.id)

          results.push({
            id: variant.id,
            slug: variant.slug,
            status: 'PATCHED',
            message: 'system_prompt_override added to parameters',
          })
        } else {
          results.push({
            id: variant.id,
            slug: variant.slug,
            status: 'ALREADY_OK',
            message: 'system_prompt_override already exists',
            override_length: currentParams.system_prompt_override.length,
          })
        }
      } else {
        results.push({
          id: variant.id,
          slug: variant.slug,
          status: 'SKIPPED',
          message: 'No built-in prompt for this slug',
        })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
