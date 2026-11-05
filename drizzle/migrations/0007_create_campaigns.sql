CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  target_audience text NOT NULL,
  channel text NOT NULL,
  budget_ttd numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Draft','Completed')),
  start_date date NOT NULL DEFAULT current_date,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view campaigns" ON public.campaigns FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Staff add campaigns" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Staff update campaigns" ON public.campaigns FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Staff delete campaigns" ON public.campaigns FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.campaigns (title, target_audience, channel, budget_ttd, status, start_date) VALUES
('Commercial Generator Transfer Switch Outreach','Warehouses & Factories (Point Lisas & Macoya)','WhatsApp & Email',1500,'Active','2026-11-01'),
('Holiday Grounds Maintenance & Illumination','Residential Compounds (Westmoorings & Maraval)','Meta Ads & Flyer Drop',850,'Draft','2026-11-15');