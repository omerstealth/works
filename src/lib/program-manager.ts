import type { MentorProfile } from './mentor-agents'
import { MENTOR_PROFILES } from './mentor-agents'

export interface ProgramManagerProfile {
  id: string
  name: string
  emoji: string
  title: string
  description: string
}

export interface ProgramEvent {
  week: number
  title: string
  type: 'kickoff' | 'event' | 'midterm' | 'demoday'
}

export const PROGRAM_MANAGER: ProgramManagerProfile = {
  id: 'program-manager',
  name: 'İrem Başaran',
  emoji: '👩‍💼',
  title: 'Program Director',
  description: '6 yıl accelerator deneyimi (Techstars Istanbul, 500 Global). Program yönetimi, mentor eşleştirme ve aday gelişim takibi konularında uzman.',
}

export const PROGRAM_TIMELINE: ProgramEvent[] = [
  { week: 1, title: 'Kickoff & Mentor Matching', type: 'kickoff' },
  { week: 2, title: 'Product Discovery Workshop', type: 'event' },
  { week: 3, title: 'AI Architecture Deep Dive', type: 'event' },
  { week: 4, title: 'Midterm Review & Progress Check', type: 'midterm' },
  { week: 5, title: 'Pitch Practice #1', type: 'event' },
  { week: 6, title: 'Growth Hacking Workshop', type: 'event' },
  { week: 7, title: 'Investor Prep Session', type: 'event' },
  { week: 8, title: 'Demo Day', type: 'demoday' },
]

/**
 * Match a mentor to a candidate based on jury evaluation scores.
 * Logic: look at the candidate's weakest scoring areas and assign
 * the mentor whose focus best addresses that weakness.
 */
export function matchMentor(juryEvaluations: any[]): MentorProfile {
  if (!juryEvaluations || juryEvaluations.length === 0) {
    // Default to first mentor if no evaluations
    return MENTOR_PROFILES[0]
  }

  // Aggregate scores across all jury evaluations
  const scoreAgg: Record<string, number[]> = {}
  for (const eval_ of juryEvaluations) {
    if (eval_.scores) {
      for (const [key, val] of Object.entries(eval_.scores)) {
        if (!scoreAgg[key]) scoreAgg[key] = []
        scoreAgg[key].push((val as any).score || 0)
      }
    }
  }

  const avgScores: Record<string, number> = {}
  for (const [key, vals] of Object.entries(scoreAgg)) {
    avgScores[key] = vals.reduce((a, b) => a + b, 0) / vals.length
  }

  // Map score categories to mentor focus areas
  const focusMapping: Record<string, string> = {
    technical_depth: 'technical',
    ai_nativeness: 'technical',
    problem_clarity: 'product',
    market_awareness: 'fundraising',
    founder_energy: 'strategy',
    program_fit: 'product',
  }

  // Find weakest area
  let weakestKey = ''
  let weakestScore = 11
  for (const [key, score] of Object.entries(avgScores)) {
    if (score < weakestScore) {
      weakestScore = score
      weakestKey = key
    }
  }

  const targetFocus = focusMapping[weakestKey] || 'product'
  const matched = MENTOR_PROFILES.find(m => m.focus === targetFocus)
  return matched || MENTOR_PROFILES[0]
}

export function getKickoffPMPrompt(): string {
  return `You are İrem Başaran (👩‍💼), Program Director of an AI-focused startup accelerator. You have 6 years of experience running programs at Techstars Istanbul and 500 Global.

Your role in the KICKOFF phase:
- Write a brief program manager note for each candidate
- Confirm the mentor assignment makes sense
- Set expectations for the 8-week program

You are warm, organized, and efficient. You keep things moving.

Output as JSON only:
{
  "pm_welcome": "<1-2 sentence program note>",
  "mentor_match_reasoning": "<why this mentor is a good fit, 1 sentence>"
}

IMPORTANT: Output ONLY the JSON, no other text.`
}

export function getMidtermPMPrompt(): string {
  return `You are İrem Başaran (👩‍💼), Program Director conducting midterm reviews.

Review the mentor's feedback and the candidate's overall trajectory. Provide:
- A brief program manager perspective
- Any concerns or recommendations
- Whether any intervention is needed

Output as JSON only:
{
  "pm_notes": "<1-2 paragraph program manager assessment>",
  "intervention_needed": true/false,
  "intervention_reason": "<reason if intervention needed, empty string otherwise>"
}

IMPORTANT: Output ONLY the JSON, no other text.`
}

export function getDemoDayPMPrompt(): string {
  return `You are İrem Başaran (👩‍💼), Program Director writing final Demo Day assessments.

Review everything: interview, jury evaluation, kickoff, midterm, and mentor feedback. Provide:
- Final program assessment
- Whether the startup is ready for next steps (fundraising, enterprise pilots, etc.)
- Key takeaways from the program

Output as JSON only:
{
  "pm_final_notes": "<1-2 paragraph final assessment>",
  "program_outcome": "GRADUATED_WITH_HONORS | GRADUATED | NEEDS_EXTENSION",
  "ready_for": ["fundraising", "enterprise_pilots", "product_launch", etc...]
}

IMPORTANT: Output ONLY the JSON, no other text.`
}
