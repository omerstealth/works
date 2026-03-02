export interface Database {
  public: {
    Tables: {
      programs: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          brand_colors: BrandColors
          system_prompt: string
          eval_criteria: EvalCriterion[]
          settings: ProgramSettings
          created_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['programs']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['programs']['Insert']>
      }
      interviews: {
        Row: {
          id: string
          program_id: string
          candidate_name: string | null
          language: string
          status: 'in_progress' | 'completed' | 'abandoned'
          messages: ChatMessage[]
          evaluation: Evaluation | null
          recommendation: string | null
          overall_score: number | null
          started_at: string
          completed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['interviews']['Row'], 'id' | 'started_at'> & {
          id?: string
          started_at?: string
        }
        Update: Partial<Database['public']['Tables']['interviews']['Insert']>
      }
      program_members: {
        Row: {
          id: string
          program_id: string
          user_id: string
          role: 'owner' | 'jury' | 'viewer'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['program_members']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['program_members']['Insert']>
      }
    }
  }
}

export interface BrandColors {
  accent: string
  bg: string
  orange: string
  green: string
}

export interface EvalCriterion {
  key: string
  label: string
  weight: number
}

export interface ProgramSettings {
  max_questions: number
  languages: string[]
  model: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface EvalScore {
  score: number
  rationale: string
}

export interface Evaluation {
  candidate_name: string
  language: string
  interview_duration_estimate?: string
  scores: Record<string, EvalScore>
  overall_score: number
  recommendation: 'STRONG_YES' | 'YES' | 'MAYBE' | 'NO'
  one_line_summary: string
  red_flags: string[]
  highlights: string[]
  suggested_mentors?: string[]
}

export interface JuryEvaluation {
  jury_id: string
  jury_name: string
  jury_emoji: string
  scores: Record<string, EvalScore>
  overall_score: number
  recommendation: 'STRONG_YES' | 'YES' | 'MAYBE' | 'NO'
  one_line_summary: string
  red_flags: string[]
  highlights: string[]
  key_concern: string
}

export interface DeliberationNote {
  jury_id: string
  jury_name: string
  jury_emoji: string
  changed_mind: boolean
  original_score: number
  final_score: number
  original_recommendation: string
  final_recommendation: string
  reasoning: string
}

// Helper type for program with computed fields
export type Program = Database['public']['Tables']['programs']['Row']
export interface KickoffNotes {
  welcome_message: string
  mentor_id: string
  mentor_name: string
  mentor_emoji: string
  roadmap: string[]
  focus_areas: string[]
  first_week_tasks: string[]
  pm_welcome: string
  mentor_match_reasoning: string
}

export interface MidtermReview {
  mentor_id: string
  mentor_name: string
  mentor_emoji: string
  mentor_feedback: string
  progress_status: 'ON_TRACK' | 'AT_RISK' | 'BEHIND'
  strengths: string[]
  areas_to_improve: string[]
  revised_goals: string[]
  pm_notes: string
  intervention_needed: boolean
  intervention_reason: string
}

export interface DemoDayReport {
  mentor_id: string
  mentor_name: string
  mentor_emoji: string
  mentor_recommendation: string
  pitch_readiness: number
  investor_brief: string
  key_metrics: string[]
  next_steps: string[]
  pm_final_notes: string
  program_outcome: 'GRADUATED_WITH_HONORS' | 'GRADUATED' | 'NEEDS_EXTENSION'
  ready_for: string[]
}

export type Interview = Database['public']['Tables']['interviews']['Row'] & {
  jury_evaluations?: JuryEvaluation[]
  jury_avg_score?: number
  deliberation_notes?: DeliberationNote[]
  decision?: 'ACCEPT' | 'WAITLIST' | 'REJECT' | null
  decision_score?: number | null
  mentor_id?: string | null
  mentor_name?: string | null
  kickoff_notes?: KickoffNotes | null
  midterm_review?: MidtermReview | null
  demoday_report?: DemoDayReport | null
  program_stage?: string | null
}
export type ProgramMember = Database['public']['Tables']['program_members']['Row']
