-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a table for site settings
-- This table is designed to hold a SINGLE row of settings.
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_name TEXT NOT NULL DEFAULT 'School of Mathematics Nigeria',
    site_logo_url TEXT,
    contact_email TEXT NOT NULL DEFAULT 'contact@smn.edu.ng',
    timezone TEXT NOT NULL DEFAULT 'UTC+01:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (public settings)
CREATE POLICY "Allow public read access" ON public.site_settings
    FOR SELECT
    USING (true);

-- Allow update access only to admins
CREATE POLICY "Allow admin update access" ON public.site_settings
    FOR UPDATE
    USING (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

-- Allow insert access only to admins (and only if table is empty, enforced by logic or constraint ideally, but basic permission here)
CREATE POLICY "Allow admin insert access" ON public.site_settings
    FOR INSERT
    WITH CHECK (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

-- Function to update updated_at timestamp
CREATE TRIGGER update_site_settings_modtime
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Seed initial settings if table is empty
INSERT INTO public.site_settings (site_name, contact_email, timezone)
SELECT 'School of Mathematics Nigeria', 'contact@smn.edu.ng', 'UTC+01:00'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);
