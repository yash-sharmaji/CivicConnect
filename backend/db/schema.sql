-- CivicAI Database Schema
-- Designed for PostgreSQL (Supabase)

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABLES DESIGN
-- ==========================================

-- Users Profile Table (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'citizen' CHECK (role IN ('citizen', 'staff', 'admin')),
    avatar_url TEXT,
    xp INTEGER DEFAULT 0 CHECK (xp >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports Table (Main Civic Issues)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
    severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'verified', 'in_progress', 'resolved', 'rejected')),
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    address TEXT,
    reporter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_staff_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report Images Table
CREATE TABLE IF NOT EXISTS public.report_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes Table (Upvotes/Downvotes on Reports)
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (report_id, user_id)
);

-- Verifications Table
CREATE TABLE IF NOT EXISTS public.verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    verifier_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    verification_status VARCHAR(50) NOT NULL CHECK (verification_status IN ('approved', 'rejected')),
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('status_change', 'new_comment', 'xp_earned', 'verification', 'badge_unlocked')),
    is_read BOOLEAN DEFAULT FALSE,
    related_id UUID, -- References report_id, badge_id, etc. depending on notification type
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges Table
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT,
    xp_required INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Badges Mapping Table
CREATE TABLE IF NOT EXISTS public.user_badges (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

-- XP History Log Table (Audit trail of XP gained)
CREATE TABLE IF NOT EXISTS public.xp_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    action_type VARCHAR(100) NOT NULL CHECK (action_type IN ('report_submitted', 'report_verified', 'report_resolved', 'comment_bonus', 'verification_action')),
    related_id UUID, -- References report_id, verification_id, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report Status History Log
CREATE TABLE IF NOT EXISTS public.report_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. VIEWS DESIGN
-- ==========================================

-- Dynamic Leaderboard View
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
    id AS user_id,
    full_name,
    avatar_url,
    xp,
    role,
    RANK() OVER (ORDER BY xp DESC) AS rank
FROM public.users;

-- ==========================================
-- 3. INDEXES FOR PERFORMANCE
-- ==========================================

-- Lat/Long Index for fast nearby issue queries
CREATE INDEX IF NOT EXISTS idx_reports_coords ON public.reports (latitude, longitude);

-- Foreign Key & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_assigned_staff ON public.reports (assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_category_id ON public.reports (category_id);
CREATE INDEX IF NOT EXISTS idx_report_images_report_id ON public.report_images (report_id);
CREATE INDEX IF NOT EXISTS idx_comments_report_id ON public.comments (report_id);
CREATE INDEX IF NOT EXISTS idx_votes_report_id ON public.votes (report_id);
CREATE INDEX IF NOT EXISTS idx_verifications_report_id ON public.verifications (report_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_xp_history_user_id ON public.xp_history (user_id);
CREATE INDEX IF NOT EXISTS idx_status_history_report_id ON public.report_status_history (report_id);

-- ==========================================
-- 4. FUNCTIONS & PROCEDURES
-- ==========================================

-- Geospatial distance querying using Haversine Formula
CREATE OR REPLACE FUNCTION public.get_nearby_reports(
    p_latitude NUMERIC,
    p_longitude NUMERIC,
    p_radius_km NUMERIC DEFAULT 5.0
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    category_id UUID,
    category_name VARCHAR,
    severity VARCHAR,
    status VARCHAR,
    latitude NUMERIC,
    longitude NUMERIC,
    address TEXT,
    reporter_id UUID,
    reporter_name VARCHAR,
    distance_km NUMERIC,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.title,
        r.description,
        r.category_id,
        c.name AS category_name,
        r.severity,
        r.status,
        r.latitude,
        r.longitude,
        r.address,
        r.reporter_id,
        u.full_name AS reporter_name,
        -- Haversine formula distance calculation in KM
        (6371 * acos(
            cos(radians(p_latitude)) * cos(radians(r.latitude)) *
            cos(radians(r.longitude) - radians(p_longitude)) +
            sin(radians(p_latitude)) * sin(radians(r.latitude))
        ))::NUMERIC AS distance_km,
        r.created_at
    FROM public.reports r
    LEFT JOIN public.categories c ON r.category_id = c.id
    LEFT JOIN public.users u ON r.reporter_id = u.id
    WHERE
        (6371 * acos(
            cos(radians(p_latitude)) * cos(radians(r.latitude)) *
            cos(radians(r.longitude) - radians(p_longitude)) +
            sin(radians(p_latitude)) * sin(radians(r.latitude))
        )) <= p_radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ==========================================
-- 5. AUTOMATIC TRIGGERS
-- ==========================================

-- Trigger: Automatically update updated_at timestamp helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at to relevant tables
CREATE OR REPLACE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Automatically copy new Auth user signups to the public profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role, avatar_url, xp)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Citizen'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'citizen'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        0
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger to Auth Schema (executed after user insert in auth.users)
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 6. DEFAULT SEED DATA
-- ==========================================

-- Populate Categories
INSERT INTO public.categories (name, description) VALUES
('Pothole & Road Damage', 'Potholes, cracks, and structural issues on public roads and asphalt.'),
('Broken Streetlight', 'Malfunctioning or dark street lamps creating public safety hazards.'),
('Water Leakage', 'Broken pipes, main leaks, flooding, or open hydrants.'),
('Overflowing Garbage Bins', 'Piles of solid waste, uncollected garbage bins, and environmental hazards.'),
('Damaged Public Infrastructure', 'Damaged park benches, broken pedestrian bridges, or structural decay of public spaces')
ON CONFLICT (name) DO NOTHING;

-- Populate Badges
INSERT INTO public.badges (name, description, icon_url, xp_required) VALUES
('First Responder', 'Awarded for submitting your first civic issue report.', 'badge_first_responder.png', 0),
('Civic Sentinel', 'Awarded for submitting 5 reports and helping monitor the neighborhood.', 'badge_civic_sentinel.png', 100),
('Eagle Eye', 'Awarded when your reported issue is successfully verified by staff or other users.', 'badge_eagle_eye.png', 200),
('Community Pillar', 'Awarded for having 10 of your reported issues successfully resolved.', 'badge_community_pillar.png', 500),
('Master Inspector', 'Unlock this legendary status by achieving 1000 total XP points.', 'badge_master_inspector.png', 1000)
ON CONFLICT (name) DO NOTHING;
