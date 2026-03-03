-- Migration: Add display_name and email columns to program_members for human jury/mentor support
-- Run this in Supabase SQL Editor

-- Add display_name column
ALTER TABLE program_members ADD COLUMN IF NOT EXISTS display_name text;

-- Add email column
ALTER TABLE program_members ADD COLUMN IF NOT EXISTS email text;

-- Update the role check constraint to include 'mentor'
-- First drop existing constraint if it exists
ALTER TABLE program_members DROP CONSTRAINT IF EXISTS program_members_role_check;

-- Add updated constraint
ALTER TABLE program_members ADD CONSTRAINT program_members_role_check
  CHECK (role IN ('owner', 'jury', 'mentor', 'viewer'));
