-- 00001_initial_schema.sql
-- EduBuddy Parent & DuDu ESP32-S3 Device Cloud Backend Schema

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Families
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT DEFAULT 'Family',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Family Members
CREATE TABLE IF NOT EXISTS public.family_members (
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'parent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (family_id, user_id)
);

-- 3. Children
CREATE TABLE IF NOT EXISTS public.children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cbse_class INT NOT NULL CHECK (cbse_class BETWEEN 1 AND 10),
    avatar TEXT,
    archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Child Settings
CREATE TABLE IF NOT EXISTS public.child_settings (
    child_id UUID PRIMARY KEY REFERENCES public.children(id) ON DELETE CASCADE,
    subjects TEXT[] NOT NULL DEFAULT '{Mathematics,EVS}',
    stay_on_syllabus BOOLEAN NOT NULL DEFAULT true,
    camera_exam BOOLEAN NOT NULL DEFAULT true,
    break_prompts BOOLEAN NOT NULL DEFAULT true,
    keep_photos BOOLEAN NOT NULL DEFAULT false,
    daily_limit_min INT NOT NULL DEFAULT 60 CHECK (daily_limit_min BETWEEN 15 AND 180),
    window_start TIME NOT NULL DEFAULT '16:30',
    window_end TIME NOT NULL DEFAULT '19:30',
    language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi', 'ml')),
    wake_sensitivity INT NOT NULL DEFAULT 4 CHECK (wake_sensitivity BETWEEN 1 AND 10),
    parent_pin_hash TEXT,
    version INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to bump child_settings version on every update
CREATE OR REPLACE FUNCTION public.handle_child_settings_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bump_child_settings_version ON public.child_settings;
CREATE TRIGGER trg_bump_child_settings_version
    BEFORE UPDATE ON public.child_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_child_settings_update();

-- 5. Devices
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_uid TEXT UNIQUE NOT NULL,
    token_hash TEXT NOT NULL,
    family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
    child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
    name TEXT NOT NULL DEFAULT 'EduBuddy',
    firmware TEXT NOT NULL DEFAULT '1.0',
    pairing_code TEXT,
    pairing_code_expires TIMESTAMPTZ,
    last_seen TIMESTAMPTZ,
    rssi INT,
    ip TEXT,
    settings_version_acked INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    mode TEXT NOT NULL CHECK (mode IN ('learn', 'qa', 'fun', 'exam', 'scan')),
    subject TEXT,
    chapter TEXT,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    minutes INT NOT NULL DEFAULT 0,
    questions INT NOT NULL DEFAULT 0,
    answered_right INT NOT NULL DEFAULT 0,
    off_topic INT NOT NULL DEFAULT 0,
    camera_used BOOLEAN NOT NULL DEFAULT false,
    score_right INT,
    score_total INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Turns
CREATE TABLE IF NOT EXISTS public.turns (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    idx INT NOT NULL,
    speaker TEXT NOT NULL CHECK (speaker IN ('child', 'robot')),
    text TEXT NOT NULL,
    off_topic BOOLEAN NOT NULL DEFAULT false,
    correct BOOLEAN,
    at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Grades
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    q_no INT,
    question TEXT NOT NULL,
    child_answer TEXT,
    correct_answer TEXT NOT NULL,
    marks_total NUMERIC NOT NULL DEFAULT 1,
    marks_awarded NUMERIC,
    confidence REAL NOT NULL DEFAULT 1.0,
    reason TEXT,
    status TEXT NOT NULL CHECK (status IN ('auto', 'needs_review', 'reviewed')),
    photo_path TEXT,
    decided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    decided_at TIMESTAMPTZ,
    raw JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Events
CREATE TABLE IF NOT EXISTS public.events (
    id BIGSERIAL PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    at TIMESTAMPTZ NOT NULL DEFAULT now(),
    data JSONB
);

-- 10. Commands
CREATE TABLE IF NOT EXISTS public.commands (
    id BIGSERIAL PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('say', 'practice', 'rewrite', 'unpair', 'refresh')),
    arg TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'done', 'expired')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    acked_at TIMESTAMPTZ
);

-- 11. Flags
CREATE TABLE IF NOT EXISTS public.flags (
    id BIGSERIAL PRIMARY KEY,
    turn_id BIGINT NOT NULL REFERENCES public.turns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Photos
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_family_members_user ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_children_family ON public.children(family_id);
CREATE INDEX IF NOT EXISTS idx_devices_child ON public.devices(child_id);
CREATE INDEX IF NOT EXISTS idx_devices_family ON public.devices(family_id);
CREATE INDEX IF NOT EXISTS idx_devices_token ON public.devices(token_hash);
CREATE INDEX IF NOT EXISTS idx_devices_code ON public.devices(pairing_code);
CREATE INDEX IF NOT EXISTS idx_sessions_child ON public.sessions(child_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON public.sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_turns_session ON public.turns(session_id, idx);
CREATE INDEX IF NOT EXISTS idx_grades_child ON public.grades(child_id, status);
CREATE INDEX IF NOT EXISTS idx_grades_session ON public.grades(session_id);
CREATE INDEX IF NOT EXISTS idx_commands_device ON public.commands(device_id, status);
CREATE INDEX IF NOT EXISTS idx_events_device ON public.events(device_id, at DESC);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION public.auth_is_family_member(f_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.family_members
        WHERE family_id = f_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auth_is_child_family_member(c_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.children c
        JOIN public.family_members fm ON fm.family_id = c.family_id
        WHERE c.id = c_id AND fm.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for families
DROP POLICY IF EXISTS "Users can view their families" ON public.families;
CREATE POLICY "Users can view their families" ON public.families
    FOR SELECT TO authenticated
    USING (public.auth_is_family_member(id));

DROP POLICY IF EXISTS "Users can insert a family" ON public.families;
CREATE POLICY "Users can insert a family" ON public.families
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Policies for family_members
DROP POLICY IF EXISTS "Users can view family memberships" ON public.family_members;
CREATE POLICY "Users can view family memberships" ON public.family_members
    FOR SELECT TO authenticated
    USING (public.auth_is_family_member(family_id));

DROP POLICY IF EXISTS "Users can add self as family member" ON public.family_members;
CREATE POLICY "Users can add self as family member" ON public.family_members
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Policies for children
DROP POLICY IF EXISTS "Users can manage children of their family" ON public.children;
CREATE POLICY "Users can manage children of their family" ON public.children
    FOR ALL TO authenticated
    USING (public.auth_is_family_member(family_id))
    WITH CHECK (public.auth_is_family_member(family_id));

-- Policies for child_settings
DROP POLICY IF EXISTS "Users can view child settings" ON public.child_settings;
CREATE POLICY "Users can view child settings" ON public.child_settings
    FOR ALL TO authenticated
    USING (public.auth_is_child_family_member(child_id))
    WITH CHECK (public.auth_is_child_family_member(child_id));

-- Policies for devices
DROP POLICY IF EXISTS "Users can view devices of their family" ON public.devices;
CREATE POLICY "Users can view devices of their family" ON public.devices
    FOR ALL TO authenticated
    USING (family_id IS NOT NULL AND public.auth_is_family_member(family_id))
    WITH CHECK (family_id IS NOT NULL AND public.auth_is_family_member(family_id));

-- Policies for sessions
DROP POLICY IF EXISTS "Users can view sessions of their children" ON public.sessions;
CREATE POLICY "Users can view sessions of their children" ON public.sessions
    FOR ALL TO authenticated
    USING (public.auth_is_child_family_member(child_id))
    WITH CHECK (public.auth_is_child_family_member(child_id));

-- Policies for turns
DROP POLICY IF EXISTS "Users can view turns of sessions" ON public.turns;
CREATE POLICY "Users can view turns of sessions" ON public.turns
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.sessions s
            WHERE s.id = turns.session_id AND public.auth_is_child_family_member(s.child_id)
        )
    );

-- Policies for grades
DROP POLICY IF EXISTS "Users can view and update grades" ON public.grades;
CREATE POLICY "Users can view and update grades" ON public.grades
    FOR ALL TO authenticated
    USING (public.auth_is_child_family_member(child_id))
    WITH CHECK (public.auth_is_child_family_member(child_id));

-- Policies for events
DROP POLICY IF EXISTS "Users can view events" ON public.events;
CREATE POLICY "Users can view events" ON public.events
    FOR SELECT TO authenticated
    USING (child_id IS NOT NULL AND public.auth_is_child_family_member(child_id));

-- Policies for commands
DROP POLICY IF EXISTS "Users can view and insert commands" ON public.commands;
CREATE POLICY "Users can view and insert commands" ON public.commands
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.devices d
            WHERE d.id = commands.device_id AND d.family_id IS NOT NULL AND public.auth_is_family_member(d.family_id)
        )
    );

-- Policies for flags
DROP POLICY IF EXISTS "Users can view and insert flags" ON public.flags;
CREATE POLICY "Users can view and insert flags" ON public.flags
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policies for photos
DROP POLICY IF EXISTS "Users can view photos of their children" ON public.photos;
CREATE POLICY "Users can view photos of their children" ON public.photos
    FOR ALL TO authenticated
    USING (public.auth_is_child_family_member(child_id));

-- Realtime Setup
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.grades;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;
