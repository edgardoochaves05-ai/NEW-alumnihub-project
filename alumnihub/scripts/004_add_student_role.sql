-- ============================================================
-- Migration 004: Add 'student' to the profiles role constraint
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Step 1: Drop the old CHECK constraint that only allowed alumni/faculty/admin
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Add the updated CHECK constraint that now includes 'student'
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('alumni', 'career_advisor', 'admin', 'student'));

-- Step 3: Update the trigger function so it also validates 'student'
--         (replaces the existing handle_new_user function)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, role, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'alumni'),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Fix any existing student accounts whose profile was never created
--         (inserts a profile row for any auth user that has no profile yet)
INSERT INTO profiles (id, email, role, first_name, last_name)
SELECT
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'role', 'alumni'),
    COALESCE(u.raw_user_meta_data->>'first_name', ''),
    COALESCE(u.raw_user_meta_data->>'last_name', '')
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL;
