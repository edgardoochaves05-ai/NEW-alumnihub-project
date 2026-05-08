-- ============================================================
-- Migration 013: Allow alumni to submit announcements pending
--                approval from admin / career_advisor.
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Drop the old, narrow policies
DROP POLICY IF EXISTS "announcements_select" ON announcements;
DROP POLICY IF EXISTS "announcements_insert" ON announcements;
DROP POLICY IF EXISTS "announcements_update" ON announcements;
DROP POLICY IF EXISTS "announcements_delete" ON announcements;

-- Read: published is visible to everyone authenticated;
-- approvers see all (including pending); authors see their own pending.
CREATE POLICY "announcements_select" ON announcements
    FOR SELECT USING (
        is_published = true
        OR get_user_role() IN ('career_advisor', 'admin')
        OR posted_by = auth.uid()
    );

-- Insert: alumni, career_advisor, admin can submit.
-- Alumni rows must start unpublished (server enforces this too).
CREATE POLICY "announcements_insert" ON announcements
    FOR INSERT WITH CHECK (
        posted_by = auth.uid()
        AND (
            get_user_role() IN ('career_advisor', 'admin')
            OR (get_user_role() = 'alumni' AND is_published = false)
        )
    );

-- Update: only approvers (used to flip is_published or edit).
CREATE POLICY "announcements_update" ON announcements
    FOR UPDATE USING (get_user_role() IN ('career_advisor', 'admin'));

-- Delete: approvers can delete anything; alumni can delete their own
-- still-pending submission.
CREATE POLICY "announcements_delete" ON announcements
    FOR DELETE USING (
        get_user_role() IN ('career_advisor', 'admin')
        OR (posted_by = auth.uid() AND is_published = false)
    );
