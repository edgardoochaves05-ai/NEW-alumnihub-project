-- ═══════════════════════════════════════════════════════════════
-- AlumniHub Database Schema
-- Run this in your Supabase SQL Editor (supabase.com > SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- ── Enable UUID extension ──
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ══════════════════════════════
-- 1. PROFILES
-- ══════════════════════════════
-- Extends Supabase auth.users with app-specific data
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'alumni' CHECK (role IN ('alumni', 'faculty', 'admin')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    -- Alumni-specific fields
    student_number VARCHAR(50),
    program VARCHAR(200),        -- e.g., 'BS Information Systems'
    department VARCHAR(200),     -- e.g., 'College of Information Technology'
    graduation_year INTEGER,
    batch_year INTEGER,
    -- Professional fields
    current_job_title VARCHAR(200),
    current_company VARCHAR(200),
    industry VARCHAR(200),
    skills TEXT[],               -- Array of skills for AI matching
    linkedin_url VARCHAR(500),
    cv_url TEXT,                  -- Uploaded CV/resume file URL (stored in Supabase Storage)
    -- Privacy settings
    is_private BOOLEAN DEFAULT FALSE,  -- If true, profile is hidden from directory and requires message request
    -- Metadata
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, role, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'alumni'),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ══════════════════════════════
-- 2. CAREER MILESTONES
-- ══════════════════════════════
CREATE TABLE career_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,          -- e.g., 'Software Engineer'
    company VARCHAR(200),
    industry VARCHAR(200),
    description TEXT,
    milestone_type VARCHAR(50) DEFAULT 'job' CHECK (
        milestone_type IN ('job', 'promotion', 'certification', 'award', 'education', 'other')
    ),
    start_date DATE,
    end_date DATE,                        -- NULL = current position
    is_current BOOLEAN DEFAULT FALSE,
    location VARCHAR(200),
    salary_range VARCHAR(50),             -- Optional, for analytics
    skills_used TEXT[],                   -- Skills used in this role
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_milestones_profile ON career_milestones(profile_id);
CREATE INDEX idx_milestones_industry ON career_milestones(industry);

-- ══════════════════════════════
-- 3. JOB LISTINGS
-- ══════════════════════════════
CREATE TABLE job_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    posted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    company VARCHAR(200) NOT NULL,
    description TEXT,
    requirements TEXT,
    location VARCHAR(200),
    job_type VARCHAR(50) DEFAULT 'full-time' CHECK (
        job_type IN ('full-time', 'part-time', 'contract', 'internship', 'freelance')
    ),
    industry VARCHAR(200),
    salary_min NUMERIC,
    salary_max NUMERIC,
    salary_currency VARCHAR(10) DEFAULT 'PHP',
    required_skills TEXT[],              -- For AI job matching
    experience_level VARCHAR(50) CHECK (
        experience_level IN ('entry', 'mid', 'senior', 'executive')
    ),
    application_url TEXT,
    application_email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_active ON job_listings(is_active, created_at DESC);
CREATE INDEX idx_jobs_industry ON job_listings(industry);

-- ══════════════════════════════
-- 4. JOB MATCH SCORES (AI)
-- ══════════════════════════════
-- Stores precomputed match scores between alumni and jobs
CREATE TABLE job_match_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
    match_score NUMERIC(5,2) NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
    matching_skills TEXT[],              -- Which skills matched
    score_breakdown JSONB,               -- Detailed scoring breakdown
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, job_id)
);

CREATE INDEX idx_match_profile ON job_match_scores(profile_id, match_score DESC);

-- ══════════════════════════════
-- 5. CAREER PREDICTIONS (AI)
-- ══════════════════════════════
-- Stores career path predictions for alumni
CREATE TABLE career_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    predicted_role VARCHAR(200),
    predicted_industry VARCHAR(200),
    confidence_score NUMERIC(5,2),       -- 0-100
    time_horizon VARCHAR(50),            -- e.g., '1-2 years', '3-5 years'
    based_on_sample_size INTEGER,        -- How many alumni data points used
    reasoning TEXT,                       -- Explanation of prediction
    prediction_data JSONB,               -- Full prediction details
    computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_predictions_profile ON career_predictions(profile_id, computed_at DESC);

-- ══════════════════════════════
-- 6. CURRICULUM IMPACT (AI)
-- ══════════════════════════════
-- Stores analytics about program effectiveness
CREATE TABLE curriculum_impact (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program VARCHAR(200) NOT NULL,
    department VARCHAR(200),
    graduation_year_range VARCHAR(50),    -- e.g., '2020-2024'
    total_alumni_analyzed INTEGER,
    employment_rate NUMERIC(5,2),         -- Percentage
    avg_time_to_employment_months NUMERIC(5,1),
    top_industries JSONB,                 -- Array of {industry, percentage}
    top_job_titles JSONB,                 -- Array of {title, count}
    top_companies JSONB,                  -- Array of {company, count}
    avg_career_progression_score NUMERIC(5,2),
    skills_demand_alignment JSONB,        -- How well curriculum matches market
    insights TEXT,                        -- AI-generated summary
    computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_curriculum_program ON curriculum_impact(program);

-- ══════════════════════════════
-- 7. CONVERSATIONS & MESSAGES
-- ══════════════════════════════
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_participants (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ,
    PRIMARY KEY (conversation_id, profile_id)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- ══════════════════════════════
-- 7b. MESSAGE REQUESTS
-- ══════════════════════════════
-- When a user's profile is private, others must send a request before messaging
CREATE TABLE message_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT,                          -- Optional intro message with the request
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'accepted', 'declined')
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sender_id, recipient_id)       -- One request per sender-recipient pair
);

CREATE INDEX idx_msg_requests_recipient ON message_requests(recipient_id, status);
CREATE INDEX idx_msg_requests_sender ON message_requests(sender_id);

-- ══════════════════════════════
-- 7c. CV PARSED DATA (AI)
-- ══════════════════════════════
-- Stores AI-extracted career milestones from uploaded CVs
CREATE TABLE cv_parsed_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    cv_url TEXT NOT NULL,                  -- Reference to the uploaded file
    raw_text TEXT,                         -- Extracted text from CV
    parsed_milestones JSONB,              -- AI-extracted milestones before user confirmation
    parsed_skills TEXT[],                  -- AI-extracted skills
    parsed_education JSONB,               -- AI-extracted education history
    status VARCHAR(20) DEFAULT 'processing' CHECK (
        status IN ('processing', 'parsed', 'confirmed', 'failed')
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cv_parsed_profile ON cv_parsed_data(profile_id);

-- ══════════════════════════════
-- 8. FEEDBACK
-- ══════════════════════════════
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    category VARCHAR(50) DEFAULT 'general' CHECK (
        category IN ('bug', 'feature', 'general', 'complaint', 'suggestion')
    ),
    subject VARCHAR(200),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'reviewed', 'resolved', 'dismissed')
    ),
    admin_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════
-- 9. ANNOUNCEMENTS
-- ══════════════════════════════
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    posted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_published BOOLEAN DEFAULT TRUE,
    target_audience VARCHAR(20) DEFAULT 'all' CHECK (
        target_audience IN ('all', 'alumni', 'faculty')
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════
-- 10. UPDATED_AT TRIGGER
-- ══════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON career_milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON job_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON message_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON cv_parsed_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
