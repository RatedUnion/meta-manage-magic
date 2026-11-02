CREATE TABLE public.call_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  contact_name TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','in-progress','missed','failed')),
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  recording_path TEXT,
  transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'urgent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX call_records_created_at_idx ON public.call_records (created_at DESC);
CREATE INDEX call_records_booking_id_idx ON public.call_records (booking_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_records TO authenticated;
GRANT ALL ON public.call_records TO service_role;

ALTER TABLE public.call_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view call records" ON public.call_records FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can add call records" ON public.call_records FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can update call records" ON public.call_records FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can delete call records" ON public.call_records FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));