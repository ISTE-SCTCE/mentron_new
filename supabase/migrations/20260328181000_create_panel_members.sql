-- Create panel_members table
CREATE TABLE IF NOT EXISTS public.panel_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    pass TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial chairman user
INSERT INTO public.panel_members (name, pass, role)
VALUES ('aadithyanrs@gmail.com', 'chair123', 'chairman')
ON CONFLICT DO NOTHING;
