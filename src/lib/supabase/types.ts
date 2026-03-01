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

// Helper type for program with computed fields
export type Program = Database['public']['Tables']['programs']['Row']
export type Interview = Database['public']['Tables']['interviews']['Row']
export type ProgramMember = Database['public']['Tables']['program_members']['Row']
