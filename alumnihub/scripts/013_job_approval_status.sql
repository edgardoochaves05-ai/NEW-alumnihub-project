-- ── Job Approval Workflow ─────────────────────────────────────────────────
-- Adds a moderation workflow so that jobs posted by alumni / career_advisor
-- start as 'pending' and must be approved by an admin before becoming visible
-- to the rest of the network. Admins themselves cannot post jobs.
--
-- Run this in the Supabase SQL Editor after 012_storage_cv_upload_policy.sql

-- 1. Add the status column
ALTER TABLE job_listings
  ADD COLUMN IF NOT EXISTS status VARCHAR(20)
  NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved', 'declined'));

-- 2. Audit columns: who moderated and when
ALTER TABLE job_listings
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS decline_reason TEXT;

-- 3. Backfill: any pre-existing rows are treated as approved so the directory
--    does not suddenly empty out for current users.
UPDATE job_listings SET status = 'approved' WHERE status = 'pending';

-- 4. Helpful index for the admin "pending" queue
CREATE INDEX IF NOT EXISTS idx_jobs_status ON job_listings(status, created_at DESC);
