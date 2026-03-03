-- Migration: Switch from single 'role' to 'roles' text array
-- This allows one person to be both jury AND mentor in a single row
-- Run this in Supabase SQL Editor

-- 1. Add the new roles array column
ALTER TABLE program_members ADD COLUMN IF NOT EXISTS roles text[] DEFAULT ARRAY['viewer'];

-- 2. Migrate existing data: copy role into roles array
UPDATE program_members SET roles = ARRAY[role] WHERE roles = ARRAY['viewer'] AND role IS NOT NULL AND role != 'viewer';

-- 3. Merge duplicate members (same program + same email, different roles)
-- For each duplicate pair, combine roles into one row and delete the other
DO $$
DECLARE
  dup RECORD;
BEGIN
  FOR dup IN
    SELECT program_id, email, array_agg(DISTINCT role) as all_roles, array_agg(id ORDER BY created_at) as ids
    FROM program_members
    WHERE email IS NOT NULL
    GROUP BY program_id, email
    HAVING count(*) > 1
  LOOP
    -- Update the first (oldest) row with all roles
    UPDATE program_members SET roles = dup.all_roles WHERE id = dup.ids[1];
    -- Delete the rest
    DELETE FROM program_members WHERE id = ANY(dup.ids[2:]);
  END LOOP;
END $$;

-- 4. Drop old constraints that conflict
DROP INDEX IF EXISTS idx_program_members_program_email;
DROP INDEX IF EXISTS idx_program_members_program_email_role;

-- 5. Add unique constraint on (program_id, email) — one row per person per program
CREATE UNIQUE INDEX IF NOT EXISTS idx_program_members_program_email
  ON program_members (program_id, email)
  WHERE email IS NOT NULL;

-- 6. Drop old role check constraint (no longer needed, roles array replaces it)
ALTER TABLE program_members DROP CONSTRAINT IF EXISTS program_members_role_check;
