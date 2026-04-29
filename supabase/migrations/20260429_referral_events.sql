-- Per-partner activity events (clicks now; share/nudge later when we have
-- a customer-side share button or Twilio wired up). Drives the "Referral
-- Activity" card on the contractor's contact detail modal: click count,
-- last activity timestamp, "Sharing" badge.

CREATE TABLE IF NOT EXISTS public.referral_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  referral_partner_id uuid NOT NULL REFERENCES public.referral_partners(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('click', 'share', 'nudge')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS referral_events_partner_idx
  ON public.referral_events (referral_partner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS referral_events_business_idx
  ON public.referral_events (business_id, created_at DESC);

-- Match the lockdown pattern used on referral_partners: anon role gets
-- nothing, the service role bypasses RLS for our server inserts/reads.
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY referral_events_no_anon_select
  ON public.referral_events FOR SELECT
  TO anon USING (false);

CREATE POLICY referral_events_no_anon_write
  ON public.referral_events FOR ALL
  TO anon USING (false) WITH CHECK (false);
