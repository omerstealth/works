import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { HIGH_SCHOOL_SYSTEM_PROMPT } from '@/lib/interview-parameters'

// GET: One-time fix to patch high-school variant with system_prompt_override
// Visit: /api/fix-variant?slug=high-school OR /api/fix-variant?slug=high_school
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
      const isHighSchool = variant.slug === 'high-school' || variant.slug === 'high_school'

      if (isHighSchool) {
        const currentParams = variant.parameters || {}
        const hasOverride = !!currentParams.system_prompt_override

        if (!hasOverride) {
          // Patch: add system_prompt_override to parameters
          const updatedParams = {
            ...currentParams,
            system_prompt_override: HIGH_SCHOOL_SYSTEM_PROMPT,
            language_preference: currentParams.language_preference || 'Turkish',
            max_questions: currentParams.max_questions || 8,
            min_questions: currentParams.min_questions || 5,
            strictness: currentParams.strictness || 'light',
            tone: currentParams.tone || 'casual',
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
            message: 'system_prompt_override already exists in parameters',
            override_length: currentParams.system_prompt_override.length,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      prompt_length: HIGH_SCHOOL_SYSTEM_PROMPT.length,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
