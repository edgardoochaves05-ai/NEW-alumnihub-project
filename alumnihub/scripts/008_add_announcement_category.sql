-- ============================================================
-- Migration 008: Add category column to announcements table
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS category VARCHAR(50)
  CHECK (category IN ('Event', 'Career Fair', 'Campus News', 'Mentorship'));
