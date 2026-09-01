CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  service text NOT NULL,
  booking_date date NOT NULL,
  booking_time text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  notes text,
  photo_count integer NOT NULL DEFAULT 0,
  calendar_event_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a booking"
  ON public.bookings FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Signed-in staff can view bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Signed-in staff can update bookings"
  ON public.bookings FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Signed-in staff can delete bookings"
  ON public.bookings FOR DELETE TO authenticated
  USING (true);

CREATE INDEX bookings_created_at_idx ON public.bookings (created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();