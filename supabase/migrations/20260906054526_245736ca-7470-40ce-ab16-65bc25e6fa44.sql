CREATE TABLE public.payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL DEFAULT 'unknown',
  reference text NOT NULL,
  succeeded boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.payment_attempts TO service_role;

ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages payment attempts"
ON public.payment_attempts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX payment_attempts_ip_created_idx ON public.payment_attempts (ip, created_at DESC);
CREATE INDEX payment_attempts_reference_created_idx ON public.payment_attempts (reference, created_at DESC);