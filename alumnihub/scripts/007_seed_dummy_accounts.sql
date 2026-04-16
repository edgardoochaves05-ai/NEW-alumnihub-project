-- ============================================================
-- Migration 007: Seed dummy Alumni and Student accounts
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Credentials created by this script:
--
--   Alumni
--     Email   : maria.santos@alumnihub.com
--     Password: Alumni@Hub2026!
--
--   Student
--     Email   : juan.delacruz@alumnihub.com
--     Password: Student@Hub2026!
-- ============================================================

-- ── Dummy Alumni: Maria Santos ────────────────────────────────
DO $$
DECLARE
  new_id UUID := gen_random_uuid();
BEGIN

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'maria.santos@alumnihub.com') THEN
    RAISE NOTICE 'Alumni account already exists. Skipping.';
  ELSE

    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_id, 'authenticated', 'authenticated',
      'maria.santos@alumnihub.com',
      crypt('Alumni@Hub2026!', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"alumni","first_name":"Maria","last_name":"Santos"}',
      NOW(), NOW(), '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), new_id,
      jsonb_build_object('sub', new_id::text, 'email', 'maria.santos@alumnihub.com'),
      'email', NOW(), NOW(), NOW()
    );

    INSERT INTO profiles (id, email, role, first_name, last_name, program, department, graduation_year, batch_year, student_number)
    VALUES (
      new_id, 'maria.santos@alumnihub.com', 'alumni',
      'Maria', 'Santos',
      'BS Information Systems',
      'College of Information Technology',
      2023, 2023, '2019-00123'
    )
    ON CONFLICT (id) DO UPDATE SET role = 'alumni';

    RAISE NOTICE 'Alumni account created: %', new_id;
  END IF;

END $$;


-- ── Dummy Student: Juan Dela Cruz ─────────────────────────────
DO $$
DECLARE
  new_id UUID := gen_random_uuid();
BEGIN

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'juan.delacruz@alumnihub.com') THEN
    RAISE NOTICE 'Student account already exists. Skipping.';
  ELSE

    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_id, 'authenticated', 'authenticated',
      'juan.delacruz@alumnihub.com',
      crypt('Student@Hub2026!', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"student","first_name":"Juan","last_name":"Dela Cruz"}',
      NOW(), NOW(), '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), new_id,
      jsonb_build_object('sub', new_id::text, 'email', 'juan.delacruz@alumnihub.com'),
      'email', NOW(), NOW(), NOW()
    );

    INSERT INTO profiles (id, email, role, first_name, last_name, program, department, batch_year, student_number)
    VALUES (
      new_id, 'juan.delacruz@alumnihub.com', 'student',
      'Juan', 'Dela Cruz',
      'BS Information Technology',
      'College of Information Technology',
      2026, '2022-00456'
    )
    ON CONFLICT (id) DO UPDATE SET role = 'student';

    RAISE NOTICE 'Student account created: %', new_id;
  END IF;

END $$;
