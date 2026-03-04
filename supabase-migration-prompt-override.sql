-- Migration: Add system_prompt_override to interview_variants
-- Run this in Supabase SQL Editor

ALTER TABLE public.interview_variants
ADD COLUMN IF NOT EXISTS system_prompt_override text;

-- This column stores an optional custom system prompt that completely replaces
-- the program's default system_prompt for this variant.
-- Used for specialized interview flows like high-school student interviews.
