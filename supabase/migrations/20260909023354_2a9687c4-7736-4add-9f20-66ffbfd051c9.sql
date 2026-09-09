CREATE TABLE public.feedback (
  id uuid primary key default gen_random_uuid(),
  reference text not null,
  kind text not null default 'review',
  name text not null,
  email text not null,
  phone text,
  service text,
  booking_reference text,
  rating_page smallint,
  rating_layout smallint,
  rating_timing smallint,
  rating_affordability smallint,
  rating_representative smallint,
  rating_duration smallint,
  rating_conclusions smallint,
  overall numeric,
  comments text,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

GRANT INSERT ON public.feedback TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback" ON public.feedback FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff can view feedback" ON public.feedback FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff can update feedback" ON public.feedback FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff can delete feedback" ON public.feedback FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));