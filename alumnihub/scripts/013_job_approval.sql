-- ══════════════════════════════
-- 013: JOB APPROVAL WORKFLOW
-- ══════════════════════════════
-- Adds an approval status column to job_listings so admins can review
-- and accept/decline job postings submitted by alumni.
--
-- status values:
--   'pending'   — waiting for admin review (default for new listings)
--   'approved'  — admin accepted; visible to all users
--   'declined'  — admin declined; hidden from non-admin users
--
-- Existing rows are marked 'approved' so legacy data stays visible.

ALTER TABLE job_listings
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'declined'));

ALTER TABLE job_listings
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE job_listings
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE job_listings
  ADD COLUMN IF NOT EXISTS decline_reason TEXT;

-- Mark all existing rows as approved so they remain visible
UPDATE job_listings SET status = 'approved' WHERE status IS NULL OR status = 'pending';

CREATE INDEX IF NOT EXISTS idx_jobs_status ON job_listings(status, created_at DESC);
