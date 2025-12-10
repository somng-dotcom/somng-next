-- Create a 'public' bucket for general site assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public read access to the 'public' bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'public' );

-- Policy to allow authenticated uploads to the 'public' bucket (e.g., for admins)
-- You might want to restrict this further to just admins if possible, but for now authenticated is a good step.
CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'public' AND auth.role() = 'authenticated' );

-- Policy to allow owners (or admins) to update/delete their files
CREATE POLICY "Owner Update/Delete"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'public' AND auth.uid() = owner )
WITH CHECK ( bucket_id = 'public' AND auth.uid() = owner );

CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'public' AND auth.uid() = owner );
