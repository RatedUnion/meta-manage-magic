-- Bind booking photo uploads to a booking-reference folder and image types only.
DROP POLICY IF EXISTS "Anyone can upload booking photos" ON storage.objects;
CREATE POLICY "Anyone can upload booking photos"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'booking-photos'
  AND (storage.foldername(name))[1] ~ '^DUA-[A-Z0-9]{6}$'
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'heic')
  AND char_length(name) <= 200
);