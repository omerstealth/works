-- Migration: Fix user_id constraint for invited members who don't have accounts yet
-- Run this in Supabase SQL Editor AFTER supabase-migration-hybrid.sql

-- 1. Drop the unique constraint on (program_id, user_id) since invited members won't have user_id
ALTER TABLE program_members DROP CONSTRAINT IF EXISTS program_members_program_id_user_id_key;

-- 2. Drop the foreign key constraint on user_id -> auth.users(id)
ALTER TABLE program_members DROP CONSTRAINT IF EXISTS program_members_user_id_fkey;

-- 3. Make user_id nullable (invited members won't have a user_id until they sign up)
ALTER TABLE program_members ALTER COLUMN user_id DROP NOT NULL;

-- 4. Set default to null
ALTER TABLE program_members ALTER COLUMN user_id SET DEFAULT null;

-- 5. Change user_id type from uuid to text to support both UUIDs and placeholder IDs
-- Actually, let's keep it as uuid but nullable - cleaner design
-- When user signs up with matching email, we update user_id

-- 6. Add a unique constraint on (program_id, email) to prevent duplicate invites
-- Only applies when email is not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_program_members_program_email
  ON program_members (program_id, email)
  WHERE email IS NOT NULL;
