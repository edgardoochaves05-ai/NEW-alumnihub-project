-- 1. Drop old constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS announcements_target_audience_check;

-- 2. Update existing 'faculty' data to 'career_advisor' (one-time migration)
UPDATE public.profiles SET role = 'career_advisor' WHERE role = 'faculty';
UPDATE public.announcements SET target_audience = 'career_advisor' WHERE target_audience = 'faculty';

-- 3. Add the new constraints
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('alumni', 'student', 'admin', 'career_advisor'));
ALTER TABLE public.announcements ADD CONSTRAINT announcements_target_audience_check 
  CHECK (target_audience IN ('all', 'alumni', 'career_advisor'));

-- 4. Update RLS Policies
-- Profiles
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (
    id = auth.uid() 
    OR get_user_role() IN ('career_advisor', 'admin') 
    OR (is_private = false AND is_active = true)
);

DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (
    get_user_role() IN ('career_advisor', 'admin')
);

-- Jobs
DROP POLICY IF EXISTS "jobs_update" ON job_listings;
CREATE POLICY "jobs_update" ON job_listings FOR UPDATE USING (
    posted_by = auth.uid() OR get_user_role() IN ('career_advisor', 'admin')
);

DROP POLICY IF EXISTS "jobs_delete" ON job_listings;
CREATE POLICY "jobs_delete" ON job_listings FOR DELETE USING (
    posted_by = auth.uid() OR get_user_role() IN ('career_advisor', 'admin')
);

-- Predictions
DROP POLICY IF EXISTS "predictions_select" ON career_predictions;
CREATE POLICY "predictions_select" ON career_predictions FOR SELECT USING (
    profile_id = auth.uid() OR get_user_role() IN ('career_advisor', 'admin')
);

-- Curriculum Impact
DROP POLICY IF EXISTS "curriculum_select" ON curriculum_impact;
CREATE POLICY "curriculum_select" ON curriculum_impact FOR SELECT USING (
    get_user_role() IN ('career_advisor', 'admin')
);

-- Announcements
DROP POLICY IF EXISTS "announcements_select" ON announcements;
CREATE POLICY "announcements_select" ON announcements FOR SELECT USING (
    is_published = true OR get_user_role() IN ('career_advisor', 'admin')
);

DROP POLICY IF EXISTS "announcements_insert" ON announcements;
CREATE POLICY "announcements_insert" ON announcements FOR INSERT WITH CHECK (
    get_user_role() IN ('career_advisor', 'admin')
);

DROP POLICY IF EXISTS "announcements_update" ON announcements;
CREATE POLICY "announcements_update" ON announcements FOR UPDATE USING (
    get_user_role() IN ('career_advisor', 'admin')
);

-- CV Parsed Data
DROP POLICY IF EXISTS "cv_parsed_select" ON cv_parsed_data;
CREATE POLICY "cv_parsed_select" ON cv_parsed_data FOR SELECT USING (
    profile_id = auth.uid() OR get_user_role() IN ('career_advisor', 'admin')
);
