-- Create table for notification templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE, -- e.g., 'welcome-email', 'payment-success'
    label TEXT NOT NULL, -- Human readable name
    description TEXT,
    subject TEXT NOT NULL,
    content TEXT NOT NULL, -- HTML or Markdown content
    variables JSONB DEFAULT '[]'::jsonb, -- List of available placeholders for this template
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users (or maybe just admins? For now, public read is safe-ish for templates, but admins-only is better)
CREATE POLICY "Allow admin read access" ON public.notification_templates
    FOR SELECT
    USING (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

-- Allow update access only to admins
CREATE POLICY "Allow admin update access" ON public.notification_templates
    FOR UPDATE
    USING (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    )
    WITH CHECK (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

-- Trigger for update_at
CREATE TRIGGER update_notification_templates_modtime
    BEFORE UPDATE ON public.notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Seed Data
INSERT INTO public.notification_templates (key, label, description, subject, content, variables)
VALUES 
    ('welcome-email', 'User Welcome Email', 'Sent when a new user registers.', 'Welcome to the School of Mathematics!', 'Hello {{student_name}},\n\nWelcome to the School of Mathematics Nigeria! We''re excited to have you on board.\n\nGet started by browsing our available courses.\n\nBest,\nThe School of Maths NG Team', '["student_name", "login_link"]'),
    
    ('payment-confirmation', 'Payment Confirmation', 'Sent after a successful course payment.', 'Payment Received - {{course_title}}', 'Hi {{student_name}},\n\nWe have received your payment for {{course_title}}.\n\nYou can now access your course from your dashboard.\n\nHappy Learning!', '["student_name", "course_title", "amount", "transaction_id"]'),
    
    ('new-course', 'New Course Announcement', 'Sent when a new course is published.', 'New Course: {{course_title}}', 'Hello,\n\nWe just published a new course: {{course_title}}.\n\nCheck it out here: {{course_link}}', '["course_title", "course_link", "course_description"]'),
    
    ('progress-reminder', 'Course Progress Reminder', 'Sent to inactive students.', 'Continue your learning: {{course_title}}', 'Hi {{student_name}},\n\nIt''s been a while since you studied {{course_title}}. Pick up where you left off!', '["student_name", "course_title", "last_accessed_date"]'),
    
    ('certificate', 'Certificate of Completion', 'Sent after course completion.', 'Congratulations! You completed {{course_title}}', 'Dear {{student_name}},\n\nCongratulations on completing {{course_title}}! Your certificate is attached.\n\nWell done!', '["student_name", "course_title", "completion_date"]')

ON CONFLICT (key) DO NOTHING;
