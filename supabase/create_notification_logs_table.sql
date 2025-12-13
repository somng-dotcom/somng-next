-- Create table for notification logs
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    type TEXT NOT NULL, -- e.g., 'welcome-email', 'payment-confirmation', 'new-course', etc.
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'delivered', 'failed'
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (to make this script idempotent)
DROP POLICY IF EXISTS "Allow admin read access" ON public.notification_logs;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.notification_logs;

-- Allow read access only to admins
CREATE POLICY "Allow admin read access" ON public.notification_logs
    FOR SELECT
    USING (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

-- Allow insert for authenticated users (for when the system sends notifications)
CREATE POLICY "Allow authenticated insert" ON public.notification_logs
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Clean up any existing dummy/test data (run this for production)
DELETE FROM public.notification_logs WHERE recipient_email LIKE '%@email.com' OR recipient_email IN ('students@all', 'premium@users');
