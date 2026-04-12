-- ═══════════════════════════════════════════════════════════════
-- AlumniHub Row-Level Security Policies
-- Run AFTER 001_create_tables.sql
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_impact ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_parsed_data ENABLE ROW LEVEL SECURITY;

-- ── Helper: Get current user's role ──
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ══════════════════════════════
-- PROFILES
-- ══════════════════════════════
-- Users can always see their own profile
-- Faculty/Admin can see all profiles
-- Alumni can see non-private profiles only (private profiles hidden from alumni)
CREATE POLICY "profiles_select" ON profiles
    FOR SELECT USING (
        id = auth.uid()                              -- Own profile always visible
        OR get_user_role() IN ('faculty', 'admin')   -- Faculty/Admin see everyone
        OR (is_private = false AND is_active = true)  -- Public profiles visible to all
    );

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- Faculty/Admin can update any profile
CREATE POLICY "profiles_update_admin" ON profiles
    FOR UPDATE USING (get_user_role() IN ('faculty', 'admin'));

-- ══════════════════════════════
-- CAREER MILESTONES
-- ══════════════════════════════
-- Everyone can view milestones
CREATE POLICY "milestones_select" ON career_milestones
    FOR SELECT USING (true);

-- Users can manage their own milestones
CREATE POLICY "milestones_insert_own" ON career_milestones
    FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "milestones_update_own" ON career_milestones
    FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "milestones_delete_own" ON career_milestones
    FOR DELETE USING (profile_id = auth.uid());

-- ══════════════════════════════
-- JOB LISTINGS
-- ══════════════════════════════
-- Everyone can view active jobs
CREATE POLICY "jobs_select" ON job_listings
    FOR SELECT USING (is_active = true OR posted_by = auth.uid());

-- Authenticated users can post jobs
CREATE POLICY "jobs_insert" ON job_listings
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Poster or admin can update/delete
CREATE POLICY "jobs_update" ON job_listings
    FOR UPDATE USING (posted_by = auth.uid() OR get_user_role() IN ('faculty', 'admin'));

CREATE POLICY "jobs_delete" ON job_listings
    FOR DELETE USING (posted_by = auth.uid() OR get_user_role() IN ('faculty', 'admin'));

-- ══════════════════════════════
-- JOB MATCH SCORES (AI)
-- ══════════════════════════════
-- Users can only see their own match scores
CREATE POLICY "match_select_own" ON job_match_scores
    FOR SELECT USING (profile_id = auth.uid());

-- ══════════════════════════════
-- CAREER PREDICTIONS (AI)
-- ══════════════════════════════
-- Users see their own predictions; faculty/admin can see all
CREATE POLICY "predictions_select" ON career_predictions
    FOR SELECT USING (
        profile_id = auth.uid()
        OR get_user_role() IN ('faculty', 'admin')
    );

-- ══════════════════════════════
-- CURRICULUM IMPACT (AI)
-- ══════════════════════════════
-- Faculty and admin only
CREATE POLICY "curriculum_select" ON curriculum_impact
    FOR SELECT USING (get_user_role() IN ('faculty', 'admin'));

-- ══════════════════════════════
-- MESSAGES
-- ══════════════════════════════
-- Users can see conversations they're part of
CREATE POLICY "conversations_select" ON conversations
    FOR SELECT USING (
        id IN (SELECT conversation_id FROM conversation_participants WHERE profile_id = auth.uid())
    );

CREATE POLICY "participants_select" ON conversation_participants
    FOR SELECT USING (
        conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE profile_id = auth.uid())
    );

CREATE POLICY "messages_select" ON messages
    FOR SELECT USING (
        conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE profile_id = auth.uid())
    );

CREATE POLICY "messages_insert" ON messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

-- ══════════════════════════════
-- FEEDBACK
-- ══════════════════════════════
-- Users can submit and view their own feedback
CREATE POLICY "feedback_insert" ON feedback
    FOR INSERT WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "feedback_select_own" ON feedback
    FOR SELECT USING (submitted_by = auth.uid() OR get_user_role() = 'admin');

-- Admin can update feedback (respond, change status)
CREATE POLICY "feedback_update_admin" ON feedback
    FOR UPDATE USING (get_user_role() = 'admin');

-- ══════════════════════════════
-- ANNOUNCEMENTS
-- ══════════════════════════════
-- Everyone can see published announcements
CREATE POLICY "announcements_select" ON announcements
    FOR SELECT USING (is_published = true OR get_user_role() IN ('faculty', 'admin'));

-- Faculty/Admin can create and manage
CREATE POLICY "announcements_insert" ON announcements
    FOR INSERT WITH CHECK (get_user_role() IN ('faculty', 'admin'));

CREATE POLICY "announcements_update" ON announcements
    FOR UPDATE USING (get_user_role() IN ('faculty', 'admin'));

CREATE POLICY "announcements_delete" ON announcements
    FOR DELETE USING (get_user_role() = 'admin');

-- ══════════════════════════════
-- MESSAGE REQUESTS
-- ══════════════════════════════
-- Users can see requests they sent or received
CREATE POLICY "msg_requests_select" ON message_requests
    FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Anyone can send a message request
CREATE POLICY "msg_requests_insert" ON message_requests
    FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Only the recipient can accept/decline
CREATE POLICY "msg_requests_update" ON message_requests
    FOR UPDATE USING (recipient_id = auth.uid());

-- Sender can delete their own pending request
CREATE POLICY "msg_requests_delete" ON message_requests
    FOR DELETE USING (sender_id = auth.uid() AND status = 'pending');

-- ══════════════════════════════
-- CV PARSED DATA
-- ══════════════════════════════
-- Users can only access their own CV data
CREATE POLICY "cv_parsed_select" ON cv_parsed_data
    FOR SELECT USING (profile_id = auth.uid() OR get_user_role() IN ('faculty', 'admin'));

CREATE POLICY "cv_parsed_insert" ON cv_parsed_data
    FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "cv_parsed_update" ON cv_parsed_data
    FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "cv_parsed_delete" ON cv_parsed_data
    FOR DELETE USING (profile_id = auth.uid());
