-- ============================================================
-- Migration 006: Fix handle_new_user trigger
-- Run this in: Supabase Dashboard → SQL Editor
--
-- This makes the trigger resilient so a profile-insert failure
-- never blocks user creation, and adds ON CONFLICT so duplicate
-- profile rows are silently ignored.
-- ============================================================

-- Ensure 'student' is in the role constraint (safe to run even if already done)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('alumni', 'career_advisor', 'admin', 'student'));

-- Replace trigger function with a resilient version
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
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Never block user creation even if profile insert fails
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
