import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { HIGH_SCHOOL_SYSTEM_PROMPT, CODING_EDUCATION_SYSTEM_PROMPT, WORKUP_21DAY_SYSTEM_PROMPT, VARIANT_PRESETS } from '@/lib/interview-parameters'

const BUILTIN_PROMPTS: Record<string, string> = {
  'high-school': HIGH_SCHOOL_SYSTEM_PROMPT,
  'coding-education': CODING_EDUCATION_SYSTEM_PROMPT,
  'workup-21day': WORKUP_21DAY_SYSTEM_PROMPT,
}

// GET: Fix variant parameters to match preset
// Always applies full preset (override + language + tone + strictness etc.)
// /api/fix-variant?slug=high_school
// /api/fix-variant?slug=coding_education
// /api/fix-variant?slug=all  (fixes all known presets)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug') || 'all'
    const admin = createAdminSupabase()

    const results = []

    // Determine which slugs to fix
    const slugsToFix: string[] = []
    if (slug === 'all') {
      slugsToFix.push(...Object.keys(BUILTIN_PROMPTS))
    } else {
      slugsToFix.push(slug.replace(/_/g, '-'))
    }

    for (const presetSlug of slugsToFix) {
      const builtinPrompt = BUILTIN_PROMPTS[presetSlug]
      const preset = VARIANT_PRESETS[presetSlug]
      if (!builtinPrompt || !preset) continue

      // Find variants matching this slug (both hyphen and underscore forms)
      const underscoreSlug = presetSlug.replace(/-/g, '_')
      const { data: variants } = await admin
        .from('interview_variants')
        .select('*')
        .or(`slug.eq.${presetSlug},slug.eq.${underscoreSlug}`)

      if (!variants?.length) {
        results.push({ slug: presetSlug, status: 'NOT_FOUND', message: 'No variant with this slug in DB' })
        continue
      }

      for (const variant of variants) {
        const currentParams = variant.parameters || {}

        // Always apply full preset parameters + override
        const updatedParams = {
          ...currentParams,
          ...preset.parameters,
          system_prompt_override: builtinPrompt,
        }

        await admin
          .from('interview_variants')
          .update({ parameters: updatedParams })
          .eq('id', variant.id)

        // Report what changed
        const changes: string[] = []
        if (!currentParams.system_prompt_override) changes.push('added system_prompt_override')
        if (currentParams.language_preference !== preset.parameters.language_preference) changes.push(`language: ${currentParams.language_preference} → ${preset.parameters.language_preference}`)
        if (currentParams.tone !== preset.parameters.tone) changes.push(`tone: ${currentParams.tone} → ${preset.parameters.tone}`)
        if (currentParams.strictness !== preset.parameters.strictness) changes.push(`strictness: ${currentParams.strictness} → ${preset.parameters.strictness}`)
        if (currentParams.max_questions !== preset.parameters.max_questions) changes.push(`max_questions: ${currentParams.max_questions} → ${preset.parameters.max_questions}`)
        if (currentParams.min_questions !== preset.parameters.min_questions) changes.push(`min_questions: ${currentParams.min_questions} → ${preset.parameters.min_questions}`)

        results.push({
          id: variant.id,
          slug: variant.slug,
          status: 'PATCHED',
          changes,
          new_language: updatedParams.language_preference,
          new_tone: updatedParams.tone,
          new_strictness: updatedParams.strictness,
          override_length: builtinPrompt.length,
        })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
