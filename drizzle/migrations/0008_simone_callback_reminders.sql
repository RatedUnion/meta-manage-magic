CREATE TABLE public.callback_reminders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 contact_name text NOT NULL DEFAULT 'Customer' CHECK (char_length(contact_name) BETWEEN 1 AND 120),
 phone_number text NOT NULL CHECK (phone_number ~ '^\+[1-9][0-9]{7,14}$'),
 reason text NOT NULL CHECK (reason IN ('busy','no-answer','sms')),
 message text NOT NULL DEFAULT '' CHECK (char_length(message) <= 1600),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','handled')),
 reminder_at timestamptz NOT NULL DEFAULT now(),
 source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','twilio')),
 provider_event_id text UNIQUE,
 assistant_name text NOT NULL DEFAULT 'Simone' CHECK (assistant_name = 'Simone'),
 created_by uuid,
 created_at timestamptz NOT NULL DEFAULT now(),
 handled_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.callback_reminders TO authenticated;
GRANT ALL ON public.callback_reminders TO service_role;
ALTER TABLE public.callback_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read callback reminders" ON public.callback_reminders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins create callback reminders" ON public.callback_reminders FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update callback reminders" ON public.callback_reminders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete callback reminders" ON public.callback_reminders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX callback_reminders_pending_idx ON public.callback_reminders (status, reminder_at);