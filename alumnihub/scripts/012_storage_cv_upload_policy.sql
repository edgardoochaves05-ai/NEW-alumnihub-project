-- Allow authenticated users to upload CV files into their own folder (cvs/{user_id}/...)
-- Run this in the Supabase SQL Editor.

-- INSERT: user can upload to cvs/{their own user id}/
CREATE POLICY "Users can upload their own CVs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cv-uploads'
  AND (storage.foldername(name))[1] = 'cvs'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- UPDATE/UPSERT: needed when overwriting an existing file with upsert: true
CREATE POLICY "Users can update their own CVs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cv-uploads'
  AND (storage.foldername(name))[1] = 'cvs'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
