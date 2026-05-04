-- Migration: Add is_read_by_student tracking to advisor notes and recommendations
-- Run this in the Supabase SQL Editor

ALTER TABLE advisor_notes
  ADD COLUMN IF NOT EXISTS is_read_by_student BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE advisor_recommendations
  ADD COLUMN IF NOT EXISTS is_read_by_student BOOLEAN NOT NULL DEFAULT FALSE;
