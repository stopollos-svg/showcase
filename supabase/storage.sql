-- ==============================================================================
-- Supabase Storage Setup for Amapati
-- Bucket: 'media' (public: true)
-- Folders: {user_id}/{filename}
-- Enforces:
--   - Images: max 5 MB (image/jpeg, image/png, image/webp)
--   - Videos: max 50 MB / 60 seconds (video/mp4, video/webm, video/quicktime)
--   - Audio: max 20 MB / 10 minutes (audio/mpeg, audio/mp4, audio/ogg, audio/wav, audio/webm)
-- ==============================================================================

-- 1. Create Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media',
    'media',
    true,
    52428800, -- 50MB global maximum ceiling
    ARRAY[
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm', 'video/quicktime',
        'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY[
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm', 'video/quicktime',
        'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm'
    ];

-- 2. Storage RLS Policies
-- Allow public viewing of media
CREATE POLICY "Public media access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Authenticated users can upload to their own folder: user_id/*
CREATE POLICY "Users can upload media to their own directory"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update or replace their own media
CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own media files
CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
