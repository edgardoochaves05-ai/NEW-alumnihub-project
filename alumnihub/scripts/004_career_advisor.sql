-- ── Career Advisor Role Extension ──────────────────────────────────────────
-- Run this in the Supabase SQL Editor after 003_rls_policies.sql

-- Advisor-to-student assignment mapping (managed by Admin)
CREATE TABLE IF NOT EXISTS advisor_assignments (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  advisor_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by  UUID REFERENCES profiles(id),
  assigned_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(advisor_id, student_id)
);

-- Private notes written by an advisor about a specific student
CREATE TABLE IF NOT EXISTS advisor_notes (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  advisor_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Course / job / certification recommendations from advisor to student
CREATE TABLE IF NOT EXISTS advisor_recommendations (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  advisor_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type         VARCHAR(20) DEFAULT 'other' CHECK (type IN ('course','job','certification','other')),
  title        TEXT NOT NULL,
  description  TEXT,
  url          TEXT,
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE advisor_assignments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_notes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_recommendations ENABLE ROW LEVEL SECURITY;

-- Assignments: advisors see rows where they are the advisor; admins see all
CREATE POLICY "advisor_assignments_select"
  ON advisor_assignments FOR SELECT
  USING (
    auth.uid() = advisor_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "advisor_assignments_admin_write"
  ON advisor_assignments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Notes: only the writing advisor can read or manage their own notes
CREATE POLICY "advisor_notes_own"
  ON advisor_notes FOR ALL
  USING (auth.uid() = advisor_id)
  WITH CHECK (auth.uid() = advisor_id);

-- Recommendations: advisor writes; assigned student can also read (to mark is_read)
CREATE POLICY "advisor_recommendations_rw"
  ON advisor_recommendations FOR ALL
  USING (auth.uid() = advisor_id OR auth.uid() = student_id)
  WITH CHECK (auth.uid() = advisor_id);
