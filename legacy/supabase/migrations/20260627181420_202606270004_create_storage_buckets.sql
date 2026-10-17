/*
# Create storage buckets and policies for file uploads
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', true, false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('expert-images', 'expert-images', true, false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('messages', 'messages', true, false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'])
ON CONFLICT (id) DO NOTHING;

-- Avatars bucket policies
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_authenticated_insert" ON storage.objects;
CREATE POLICY "avatars_authenticated_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_authenticated_update" ON storage.objects;
CREATE POLICY "avatars_authenticated_update" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_authenticated_delete" ON storage.objects;
CREATE POLICY "avatars_authenticated_delete" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'avatars');

-- Documents bucket policies
DROP POLICY IF EXISTS "documents_public_read" ON storage.objects;
CREATE POLICY "documents_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "documents_authenticated_insert" ON storage.objects;
CREATE POLICY "documents_authenticated_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "documents_authenticated_update" ON storage.objects;
CREATE POLICY "documents_authenticated_update" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "documents_authenticated_delete" ON storage.objects;
CREATE POLICY "documents_authenticated_delete" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'documents');

-- Expert-images bucket policies
DROP POLICY IF EXISTS "expert-images_public_read" ON storage.objects;
CREATE POLICY "expert-images_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'expert-images');

DROP POLICY IF EXISTS "expert-images_authenticated_insert" ON storage.objects;
CREATE POLICY "expert-images_authenticated_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'expert-images');

DROP POLICY IF EXISTS "expert-images_authenticated_update" ON storage.objects;
CREATE POLICY "expert-images_authenticated_update" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'expert-images');

DROP POLICY IF EXISTS "expert-images_authenticated_delete" ON storage.objects;
CREATE POLICY "expert-images_authenticated_delete" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'expert-images');

-- Messages bucket policies
DROP POLICY IF EXISTS "messages_public_read" ON storage.objects;
CREATE POLICY "messages_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'messages');

DROP POLICY IF EXISTS "messages_authenticated_insert" ON storage.objects;
CREATE POLICY "messages_authenticated_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'messages');

DROP POLICY IF EXISTS "messages_authenticated_update" ON storage.objects;
CREATE POLICY "messages_authenticated_update" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'messages');

DROP POLICY IF EXISTS "messages_authenticated_delete" ON storage.objects;
CREATE POLICY "messages_authenticated_delete" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'messages');
