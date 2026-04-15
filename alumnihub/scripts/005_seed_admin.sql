-- ============================================================
-- Migration 005: Seed default Admin account
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Credentials:
--   Email   : admin@alumnihub.com
--   Password: admin123
-- ============================================================

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN

  -- Skip if admin account already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@alumnihub.com') THEN
    RAISE NOTICE 'Admin account already exists. Skipping.';
    RETURN;
  END IF;

  -- Step 1: Create the Supabase auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'admin@alumnihub.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"admin","first_name":"Admin","last_name":"AlumniHub"}',
    NOW(),
    NOW(),
    '', '', '', ''
  );

  -- Step 2: Create the identity record (required for email/password login)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', 'admin@alumnihub.com'),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  -- Step 3: Create the profile row with role = 'admin'
  -- Uses ON CONFLICT in case the trigger already created it
  INSERT INTO profiles (id, email, role, first_name, last_name)
  VALUES (new_user_id, 'admin@alumnihub.com', 'admin', 'Admin', 'AlumniHub')
  ON CONFLICT (id) DO UPDATE SET role = 'admin';

  RAISE NOTICE 'Admin account created successfully with id: %', new_user_id;

END $$;
