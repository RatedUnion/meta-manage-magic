-- Booking references are DUA- plus 5 base36 chars; correct the folder pattern.
DROP POLICY IF EXISTS "Anyone can upload booking photos" ON storage.objects;
CREATE POLICY "Anyone can upload booking photos"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'booking-photos'
  AND (storage.foldername(name))[1] ~ '^DUA-[A-Z0-9]{5}$'
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'heic')
  AND char_length(name) <= 200
);