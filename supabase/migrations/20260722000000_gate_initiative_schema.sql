-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: Mentron Gate Initiative
-- Flat department-wise notes system (gate_departments, gate_folders, gate_notes)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create gate_departments table
CREATE TABLE IF NOT EXISTS public.gate_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    emoji TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create gate_folders table
CREATE TABLE IF NOT EXISTS public.gate_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES public.gate_departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create gate_notes table
CREATE TABLE IF NOT EXISTS public.gate_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL REFERENCES public.gate_folders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for optimal lookup performance
CREATE INDEX IF NOT EXISTS idx_gate_departments_key ON public.gate_departments(key);
CREATE INDEX IF NOT EXISTS idx_gate_folders_department_id ON public.gate_folders(department_id);
CREATE INDEX IF NOT EXISTS idx_gate_notes_folder_id ON public.gate_notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_gate_notes_profile_id ON public.gate_notes(profile_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.gate_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_notes ENABLE ROW LEVEL SECURITY;

-- ── Policies for gate_departments ─────────────────────────────────────────────
-- SELECT open to all authenticated users
CREATE POLICY "gate_departments_select" ON public.gate_departments
    FOR SELECT TO authenticated USING (true);

-- INSERT restricted to isPrivileged only (exec/core/admin)
CREATE POLICY "gate_departments_insert" ON public.gate_departments
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('exec', 'core', 'admin')
        )
    );

-- UPDATE restricted to isPrivileged only
CREATE POLICY "gate_departments_update" ON public.gate_departments
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('exec', 'core', 'admin')
        )
    );

-- DELETE restricted to isPrivileged only
CREATE POLICY "gate_departments_delete" ON public.gate_departments
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('exec', 'core', 'admin')
        )
    );

-- ── Policies for gate_folders ─────────────────────────────────────────────────
-- SELECT open to all authenticated users
CREATE POLICY "gate_folders_select" ON public.gate_folders
    FOR SELECT TO authenticated USING (true);

-- INSERT matching note_folders permission model (isPrivileged OR permissions.can_upload_notes)
CREATE POLICY "gate_folders_insert" ON public.gate_folders
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = created_by AND (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND (
                    role IN ('exec', 'core', 'admin')
                    OR (permissions->>'can_upload_notes')::boolean = true
                    OR iste_position IN ('Chairman', 'Vice Chairman')
                )
            )
        )
    );

-- DELETE allows folder creator OR exec/core/admin
CREATE POLICY "gate_folders_delete" ON public.gate_folders
    FOR DELETE TO authenticated USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('exec', 'core', 'admin')
        )
    );

-- ── Policies for gate_notes ───────────────────────────────────────────────────
-- SELECT open to all authenticated users
CREATE POLICY "gate_notes_select" ON public.gate_notes
    FOR SELECT TO authenticated USING (true);

-- INSERT matching notes permission model (isPrivileged OR permissions.can_upload_notes)
CREATE POLICY "gate_notes_insert" ON public.gate_notes
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = profile_id AND (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND (
                    role IN ('exec', 'core', 'admin')
                    OR (permissions->>'can_upload_notes')::boolean = true
                    OR iste_position IN ('Chairman', 'Vice Chairman')
                )
            )
        )
    );

-- DELETE allows note uploader OR exec/core/admin
CREATE POLICY "gate_notes_delete" ON public.gate_notes
    FOR DELETE TO authenticated USING (
        auth.uid() = profile_id OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('exec', 'core', 'admin')
        )
    );

-- 5. Seed initial departments: ECE and ME
INSERT INTO public.gate_departments (key, label, emoji, color)
VALUES
    ('ECE', 'Electronics & Communication Engineering', '📡', 'cyan'),
    ('ME', 'Mechanical Engineering', '⚙️', 'orange')
ON CONFLICT (key) DO UPDATE
SET label = EXCLUDED.label,
    emoji = EXCLUDED.emoji,
    color = EXCLUDED.color;
