-- Tighten public INSERT policies: keep open submissions but validate row shape.
-- Bookings: new rows must be pending/unpaid with bounded text lengths.
DROP POLICY IF EXISTS "Anyone can submit a booking" ON public.bookings;
CREATE POLICY "Anyone can submit a booking"
ON public.bookings FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND payment_status = 'unpaid'
  AND paid_at IS NULL
  AND payment_amount IS NULL
  AND calendar_event_url IS NULL
  AND char_length(reference) BETWEEN 4 AND 40
  AND char_length(service) BETWEEN 2 AND 120
  AND char_length(name) BETWEEN 1 AND 120
  AND char_length(email) BETWEEN 3 AND 254 AND email LIKE '%@%'
  AND char_length(phone) BETWEEN 5 AND 30
  AND (notes IS NULL OR char_length(notes) <= 2000)
  AND photo_count BETWEEN 0 AND 5
  AND cardinality(photo_paths) <= 5
);

-- Feedback: new rows must be unhandled with ratings in range and bounded lengths.
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;
CREATE POLICY "Anyone can submit feedback"
ON public.feedback FOR INSERT TO anon, authenticated
WITH CHECK (
  handled = false
  AND kind IN ('review', 'complaint')
  AND char_length(reference) BETWEEN 4 AND 40
  AND char_length(name) BETWEEN 1 AND 120
  AND char_length(email) BETWEEN 3 AND 254 AND email LIKE '%@%'
  AND (phone IS NULL OR char_length(phone) <= 30)
  AND (service IS NULL OR char_length(service) <= 120)
  AND (booking_reference IS NULL OR char_length(booking_reference) <= 40)
  AND (comments IS NULL OR char_length(comments) <= 4000)
  AND (rating_page IS NULL OR rating_page BETWEEN 1 AND 5)
  AND (rating_layout IS NULL OR rating_layout BETWEEN 1 AND 5)
  AND (rating_timing IS NULL OR rating_timing BETWEEN 1 AND 5)
  AND (rating_affordability IS NULL OR rating_affordability BETWEEN 1 AND 5)
  AND (rating_representative IS NULL OR rating_representative BETWEEN 1 AND 5)
  AND (rating_duration IS NULL OR rating_duration BETWEEN 1 AND 5)
  AND (rating_conclusions IS NULL OR rating_conclusions BETWEEN 1 AND 5)
);