-- Migration: Interview Variants + Parametric Interview System
-- Run this in Supabase SQL Editor

-- 1. Create interview_variants table
CREATE TABLE IF NOT EXISTS public.interview_variants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  targeting jsonb DEFAULT '{"founder_type":"all","stage":"all","region":null,"custom_label":null}'::jsonb,
  parameters jsonb NOT NULL,
  self_improvement_config jsonb DEFAULT '{"enabled":true,"aggressiveness":"conservative","auto_apply":false,"min_interviews":20,"optimize_for":"discrimination"}'::jsonb,
  interview_count int DEFAULT 0,
  avg_score float,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(program_id, slug)
);

-- 2. Add variant columns to interviews table
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES public.interview_variants(id) ON DELETE SET NULL;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS parameters_snapshot jsonb;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS question_signals jsonb;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_variants_program ON public.interview_variants(program_id);
CREATE INDEX IF NOT EXISTS idx_interviews_variant ON public.interviews(variant_id);

-- 4. RLS for interview_variants
ALTER TABLE public.interview_variants ENABLE ROW LEVEL SECURITY;

-- Anyone can read variants (for public interview links)
CREATE POLICY "Variants are viewable by everyone"
  ON public.interview_variants FOR SELECT USING (true);

-- Only program owners can manage variants
CREATE POLICY "Variants can be created by program owners"
  ON public.interview_variants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.program_members
      WHERE program_id = interview_variants.program_id
      AND user_id = auth.uid()
      AND (role = 'owner' OR roles @> ARRAY['owner'])
    )
  );

CREATE POLICY "Variants can be updated by program owners"
  ON public.interview_variants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.program_members
      WHERE program_id = interview_variants.program_id
      AND user_id = auth.uid()
      AND (role = 'owner' OR roles @> ARRAY['owner'])
    )
  );

CREATE POLICY "Variants can be deleted by program owners"
  ON public.interview_variants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.program_members
      WHERE program_id = interview_variants.program_id
      AND user_id = auth.uid()
      AND (role = 'owner' OR roles @> ARRAY['owner'])
    )
  );
