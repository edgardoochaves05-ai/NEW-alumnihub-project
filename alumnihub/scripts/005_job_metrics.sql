-- ── Job Interaction Tracking ──────────────────────────────────────────────
-- Run this in the Supabase SQL Editor after 004_career_advisor.sql

-- Tracks unique views and inquiry clicks per user per job.
-- UNIQUE constraint ensures each user is counted at most once per interaction type.
CREATE TABLE IF NOT EXISTS job_interactions (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id           UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  profile_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('view', 'inquiry')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, profile_id, interaction_type)
);

-- ── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS job_interactions_job_id_idx  ON job_interactions(job_id);
CREATE INDEX IF NOT EXISTS job_interactions_type_idx    ON job_interactions(interaction_type);

-- ── Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE job_interactions ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can record their own interaction
CREATE POLICY "job_interactions_insert_own"
  ON job_interactions FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Users see their own; admins see all
CREATE POLICY "job_interactions_select"
  ON job_interactions FOR SELECT
  USING (
    auth.uid() = profile_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
