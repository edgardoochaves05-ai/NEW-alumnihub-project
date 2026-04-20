-- ============================================================
-- Migration 009: Add INSERT policy on profiles
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Without this, authenticated users cannot create their own
-- profile row, causing a 403 on every new registration.
-- ============================================================

-- Allow a newly-authenticated user to insert their own profile row.
-- The service-role client (backend) bypasses RLS entirely, so this
-- policy is only needed for client-side upserts (e.g. AuthContext fallback).
CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());
