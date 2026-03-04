// ─── Interview Parameter System ───
// Parametric, adjustable interview configuration
// Supports manual tuning + self-improvement algorithm

export interface InterviewParameters {
  version: number
  focus_areas: Record<string, number>   // eval dimension → weight (0.5–3.0)
  max_questions: number                 // 6–20
  min_questions: number                 // 4–8
  strictness: 'light' | 'medium' | 'strict'
  tone: 'formal' | 'warm' | 'casual'
  language_preference: string | null    // null = auto-detect from first message
  depth_levels: Record<string, 'surface' | 'medium' | 'deep'>
  eval_thresholds: {
    high: number   // score >= this = STRONG_YES
    pass: number   // score >= this = YES
  }
}

export interface VariantTargeting {
  founder_type: 'technical' | 'business' | 'creative' | 'all'
  stage: 'idea' | 'pre-seed' | 'seed' | 'all'
  region: string | null
  custom_label: string | null
}

export interface SelfImprovementConfig {
  enabled: boolean
  aggressiveness: 'conservative' | 'moderate' | 'aggressive'
  auto_apply: false               // always require manual approval
  min_interviews: number           // min interviews before suggesting changes
  optimize_for: 'discrimination' | 'completion_rate' | 'score_variance'
}

export interface InterviewVariant {
  id: string
  program_id: string
  slug: string
  name: string
  description: string | null
  targeting: VariantTargeting
  parameters: InterviewParameters
  self_improvement_config: SelfImprovementConfig
  interview_count: number
  avg_score: number | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface QuestionSignal {
  question_index: number
  question_text: string
  topic: string             // which eval dimension this question probes
  answer_length: number     // chars in candidate response
  answer_depth: number      // 0-1 proxy for depth (normalized length + keyword density)
  phase: string             // which interview phase
}

// ─── Defaults ───

export const DEFAULT_PARAMETERS: InterviewParameters = {
  version: 1,
  focus_areas: {
    problem_clarity: 1.0,
    ai_nativeness: 2.0,
    technical_depth: 1.0,
    market_awareness: 1.0,
    founder_energy: 1.0,
    program_fit: 1.0,
  },
  max_questions: 12,
  min_questions: 8,
  strictness: 'medium',
  tone: 'warm',
  language_preference: null,
  depth_levels: {
    problem_clarity: 'medium',
    ai_nativeness: 'deep',
    technical_depth: 'medium',
    market_awareness: 'medium',
    founder_energy: 'surface',
    program_fit: 'surface',
  },
  eval_thresholds: {
    high: 8.0,
    pass: 6.0,
  },
}

export const DEFAULT_TARGETING: VariantTargeting = {
  founder_type: 'all',
  stage: 'all',
  region: null,
  custom_label: null,
}

export const DEFAULT_SELF_IMPROVEMENT: SelfImprovementConfig = {
  enabled: true,
  aggressiveness: 'conservative',
  auto_apply: false,
  min_interviews: 20,
  optimize_for: 'discrimination',
}

// ─── System Prompt Builder ───

const STRICTNESS_MAP = {
  light: 'Accept surface-level answers. Keep the conversation flowing naturally. Be encouraging.',
  medium: 'Ask clarifying follow-ups when answers are vague. Be conversational but thorough.',
  strict: 'Push for specificity on every answer. Ask probing follow-up questions. Require concrete evidence and examples.',
}

const TONE_MAP = {
  formal: 'Use formal, professional language. Address the candidate formally.',
  warm: 'Be warm and genuinely curious. Make the candidate feel comfortable while maintaining professionalism.',
  casual: 'Be relaxed and conversational. Use casual language. Think of this as a friendly coffee chat.',
}

const DEPTH_INSTRUCTIONS = {
  surface: 'Ask 1 broad question, accept the answer, and move on.',
  medium: 'Ask 1-2 questions, with a follow-up if the answer lacks detail.',
  deep: 'Ask 2-3 probing questions. Dig into specifics, ask for examples, challenge assumptions.',
}

export function buildSystemPrompt(
  basePrompt: string,
  params: InterviewParameters
): string {
  // Build focus area instruction block
  const focusLines = Object.entries(params.focus_areas)
    .sort(([, a], [, b]) => b - a)
    .map(([area, weight]) => {
      const label = area.replace(/_/g, ' ')
      const depth = params.depth_levels[area] || 'medium'
      const priority = weight >= 2.0 ? 'HIGH PRIORITY' : weight >= 1.5 ? 'IMPORTANT' : weight <= 0.5 ? 'LOW PRIORITY' : 'STANDARD'
      return `- ${label} (${priority}, weight: ${weight}x): ${DEPTH_INSTRUCTIONS[depth]}`
    })
    .join('\n')

  const focusBlock = `
## FOCUS AREAS & DEPTH (adjust your questioning based on these weights)
${focusLines}
`

  // Build question count instruction
  const questionBlock = `
## QUESTION COUNT
Ask between ${params.min_questions} and ${params.max_questions} questions total across all phases.
Spend more questions on HIGH PRIORITY areas.
`

  // Build tone/strictness instruction
  const behaviorBlock = `
## INTERVIEW STYLE
${STRICTNESS_MAP[params.strictness]}
${TONE_MAP[params.tone]}
`

  // Build language instruction
  const langBlock = params.language_preference
    ? `\n## LANGUAGE\nConduct this interview in ${params.language_preference}. Do not ask for language preference.\n`
    : ''

  // Inject into base prompt (append after core behavior section)
  let prompt = basePrompt

  // Replace question count if present in base prompt
  prompt = prompt.replace(
    /\d+-\d+ questions total/g,
    `${params.min_questions}-${params.max_questions} questions total`
  )

  // Append parametric sections before ## EVALUATION
  const evalIndex = prompt.indexOf('## EVALUATION')
  if (evalIndex > -1) {
    prompt = prompt.slice(0, evalIndex) + focusBlock + questionBlock + behaviorBlock + langBlock + '\n' + prompt.slice(evalIndex)
  } else {
    prompt += '\n' + focusBlock + questionBlock + behaviorBlock + langBlock
  }

  return prompt
}

// ─── Variant Presets ───

export const VARIANT_PRESETS: Record<string, { targeting: VariantTargeting; parameters: Partial<InterviewParameters> }> = {
  'technical-founders': {
    targeting: { founder_type: 'technical', stage: 'all', region: null, custom_label: 'Teknik Kurucular' },
    parameters: {
      focus_areas: {
        problem_clarity: 1.0,
        ai_nativeness: 2.5,
        technical_depth: 2.0,
        market_awareness: 0.8,
        founder_energy: 0.8,
        program_fit: 0.8,
      },
      depth_levels: {
        problem_clarity: 'medium',
        ai_nativeness: 'deep',
        technical_depth: 'deep',
        market_awareness: 'surface',
        founder_energy: 'surface',
        program_fit: 'surface',
      },
      strictness: 'strict',
    },
  },
  'business-founders': {
    targeting: { founder_type: 'business', stage: 'all', region: null, custom_label: 'İş Geliştiriciler' },
    parameters: {
      focus_areas: {
        problem_clarity: 1.5,
        ai_nativeness: 1.0,
        technical_depth: 0.5,
        market_awareness: 2.5,
        founder_energy: 1.5,
        program_fit: 1.0,
      },
      depth_levels: {
        problem_clarity: 'deep',
        ai_nativeness: 'medium',
        technical_depth: 'surface',
        market_awareness: 'deep',
        founder_energy: 'medium',
        program_fit: 'medium',
      },
      strictness: 'medium',
    },
  },
  'early-stage': {
    targeting: { founder_type: 'all', stage: 'idea', region: null, custom_label: 'Erken Aşama (Fikir)' },
    parameters: {
      focus_areas: {
        problem_clarity: 2.0,
        ai_nativeness: 1.5,
        technical_depth: 0.5,
        market_awareness: 1.0,
        founder_energy: 2.0,
        program_fit: 1.5,
      },
      max_questions: 10,
      min_questions: 6,
      strictness: 'light',
      tone: 'casual',
    },
  },
}
