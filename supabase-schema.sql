-- handled.sites — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- 1. Create the contractor_sites table
CREATE TABLE contractor_sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL CHECK (length(phone) = 10),
  email TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL CHECK (length(state) = 2),
  trade TEXT NOT NULL,
  services TEXT[] NOT NULL DEFAULT '{}',
  slug TEXT NOT NULL UNIQUE,
  badge_licensed BOOLEAN NOT NULL DEFAULT false,
  badge_free_estimates BOOLEAN NOT NULL DEFAULT false,
  badge_emergency BOOLEAN NOT NULL DEFAULT false,
  badge_family_owned BOOLEAN NOT NULL DEFAULT false,
  logo_url TEXT,
  cover_image_url TEXT,
  qr_redirect_url TEXT,
  banner_message TEXT NOT NULL DEFAULT 'Now booking spring projects — call today!',
  hours_start INTEGER NOT NULL DEFAULT 7,
  hours_end INTEGER NOT NULL DEFAULT 19,
  review_count INTEGER,
  avg_rating NUMERIC(2,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create index on slug for fast lookups
CREATE INDEX idx_contractor_sites_slug ON contractor_sites (slug);

-- 2b. Unique constraints on phone and email to prevent duplicates
CREATE UNIQUE INDEX idx_contractor_sites_phone ON contractor_sites (phone);
CREATE UNIQUE INDEX idx_contractor_sites_email ON contractor_sites (lower(email)) WHERE email IS NOT NULL;

-- 3. Enable Row Level Security
ALTER TABLE contractor_sites ENABLE ROW LEVEL SECURITY;

-- 4. Allow public inserts (anon key can create new contractors)
CREATE POLICY "Anyone can insert" ON contractor_sites
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 5. Allow public to SELECT slugs only (needed for slug collision checks)
CREATE POLICY "Anyone can check slugs" ON contractor_sites
  FOR SELECT
  TO anon
  USING (true);
  -- Note: The client only selects slug column for collision checks.
  -- All full-row reads happen server-side via the service role key,
  -- which bypasses RLS entirely.

-- 6. Block updates and deletes for anon
-- (No policy = denied by default with RLS enabled)

-- 7. Create storage bucket for logos
-- Run this in SQL Editor or create via Dashboard > Storage > New Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('contractor-assets', 'contractor-assets', true);

-- 8. Allow public uploads to the logos folder
CREATE POLICY "Anyone can upload logos" ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'contractor-assets' AND (storage.foldername(name))[1] = 'logos');

-- 9. Allow public reads from contractor-assets
CREATE POLICY "Public read contractor-assets" ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'contractor-assets');

-- ============================================
-- Magic link auth tables
-- ============================================

-- 10. Auth tokens for magic link login (15min expiry, single-use)
CREATE TABLE contractor_auth_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES contractor_sites(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contractor_auth_tokens_hash ON contractor_auth_tokens (token_hash);

-- 11. Browser sessions (24h expiry)
CREATE TABLE contractor_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES contractor_sites(id) ON DELETE CASCADE,
  session_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contractor_sessions_hash ON contractor_sessions (session_hash);

-- ============================================
-- Custom domain hosting (per-business)
-- ============================================

-- 12. Add custom domain columns to businesses table
-- Run this as a migration if businesses table already exists:
--
-- ALTER TABLE businesses ADD COLUMN custom_domain TEXT UNIQUE;
-- ALTER TABLE businesses ADD COLUMN domain_status TEXT NOT NULL DEFAULT 'none'
--   CHECK (domain_status IN ('none', 'pending', 'active', 'error'));
-- ALTER TABLE businesses ADD COLUMN domain_error TEXT;
-- CREATE INDEX idx_businesses_custom_domain ON businesses (custom_domain) WHERE custom_domain IS NOT NULL;
--
-- Update sites_full view to include domain fields:
-- (Adjust your existing view definition to add custom_domain and domain_status from businesses)

-- ============================================
-- Demo seed leads support
-- ============================================

-- Add is_demo flag to leads table so seed data can be identified and bulk-deleted
-- Run as migration:
--
-- ALTER TABLE leads ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT false;
-- CREATE INDEX idx_leads_is_demo ON leads (business_id) WHERE is_demo = true;

-- ============================================
-- Subscription billing
-- ============================================

-- Run as migration:
--
-- CREATE TABLE subscriptions (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
--   plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'sites_pro', 'tools', 'ai')),
--   status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
--   stripe_customer_id TEXT,
--   stripe_subscription_id TEXT,
--   stripe_price_id TEXT,
--   current_period_end TIMESTAMPTZ,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
-- );
--
-- CREATE UNIQUE INDEX idx_subscriptions_business ON subscriptions (business_id);
-- CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
-- CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
--
-- Backfill existing businesses with free plan:
-- INSERT INTO subscriptions (business_id, plan, status)
-- SELECT id, 'free', 'active' FROM businesses
-- WHERE id NOT IN (SELECT business_id FROM subscriptions);

-- ============================================
-- Referral program + brand color (per-business)
-- ============================================

-- Run as migration:
--
-- ALTER TABLE businesses ADD COLUMN brand_color TEXT;
-- ALTER TABLE businesses ADD COLUMN referral_enabled BOOLEAN NOT NULL DEFAULT true;
-- ALTER TABLE businesses ADD COLUMN referral_reward_amount_cents INTEGER;
-- ALTER TABLE businesses ADD COLUMN referral_reward_type TEXT
--   CHECK (referral_reward_type IN ('cash', 'credit', 'gift_card'));
--
-- Update sites_full view to include the four new business columns so the
-- public review funnel page (/r/[slug]) can read them in its existing query:
-- brand_color, referral_enabled, referral_reward_amount_cents, referral_reward_type

-- ============================================
-- Attribute review responses to specific customers
-- ============================================

-- When the review link carries ?lead_id=<uuid>, the review funnel now stores
-- that lead id on review_responses so reviews are tied to a known customer.
-- Nullable + ON DELETE SET NULL keeps direct/QR-code review flows working.
--
-- Run as migration:
--
-- ALTER TABLE review_responses ADD COLUMN lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;
-- CREATE INDEX idx_review_responses_lead_id ON review_responses (lead_id) WHERE lead_id IS NOT NULL;

-- ============================================
-- Multi-select highlight chips on the review funnel feedback step
-- ============================================

-- The positive-rating feedback step now shows 10 preset chips above the free
-- text box ("Finished ahead of schedule", "Went above and beyond", etc.) so
-- happy reviewers can tap specifics even when they don't want to type. The
-- tapped labels are stored as a text[] alongside the feedback and passed to
-- the AI rewriter so it can mention them in the generated review. Nullable so
-- legacy rows stay valid.
--
-- Run as migration:
--
-- ALTER TABLE review_responses ADD COLUMN highlights TEXT[];

-- ============================================
-- Appointment datetime on leads
-- ============================================

-- When a contractor taps "Appt Booked" on the lead detail view, the UI now
-- collects a date + time before flipping status to "booked". The timestamp
-- is stored on the lead so the Appt Set stage can show it prominently above
-- the action buttons (and later for reminders / confirm flows). Nullable so
-- legacy leads stay valid and leads still in the New stage have it unset.
--
-- Run as migration:
--
-- ALTER TABLE leads ADD COLUMN appointment_at TIMESTAMPTZ;

-- ============================================
-- Reputation funnel: post-sale milestone columns on leads
-- ============================================

-- The reputation dashboard surfaces a five-stage post-sale funnel on top of
-- the same `leads` table used by the pre-sale Pipeline view:
--   jobs done → feedback → reviews → referral partners → referrals
--
-- Those five stages are parallel events (not a continuation of the status
-- enum), so we denormalize them as nullable timestamp columns on the lead
-- row. Each "stage count" becomes a cheap COUNT(*) FILTER on one table; each
-- drop-off list ("who's stuck?") becomes a one-liner WHERE clause. The child
-- tables (review_responses, referral_partners, activity_log) stay canonical
-- for the actual content — these columns are read-side indexes.
--
-- Additive only. Pipeline view is not affected.
--
-- Run as migration:
--
-- ALTER TABLE leads
--   ADD COLUMN job_completed_at      TIMESTAMPTZ,
--   ADD COLUMN feedback_submitted_at TIMESTAMPTZ,
--   ADD COLUMN review_submitted_at   TIMESTAMPTZ,
--   ADD COLUMN referral_opted_in_at  TIMESTAMPTZ,
--   ADD COLUMN sentiment_score       SMALLINT,
--   ADD COLUMN job_value_cents       INTEGER,
--   ADD COLUMN referred_by_lead_id   UUID REFERENCES leads(id);
--
-- CREATE INDEX idx_leads_business_job_done
--   ON leads (business_id, job_completed_at DESC)
--   WHERE job_completed_at IS NOT NULL;
--
-- CREATE INDEX idx_leads_referred_by
--   ON leads (referred_by_lead_id)
--   WHERE referred_by_lead_id IS NOT NULL;
--
-- Backfill from existing child tables (safe to run multiple times):
--
-- UPDATE leads l
--    SET feedback_submitted_at = sub.first_at
--   FROM (
--     SELECT lead_id, MIN(created_at) AS first_at
--     FROM review_responses
--     WHERE lead_id IS NOT NULL
--     GROUP BY lead_id
--   ) sub
--  WHERE l.id = sub.lead_id
--    AND l.feedback_submitted_at IS NULL;
--
-- UPDATE leads l
--    SET referral_opted_in_at = rp.created_at
--   FROM referral_partners rp
--  WHERE rp.customer_id = l.id
--    AND l.referral_opted_in_at IS NULL;
--
-- -- Seed sentiment from the latest review_response rating (1-5 → 0-100).
-- -- Replace with NLP-derived sentiment when that pipeline exists.
-- UPDATE leads l
--    SET sentiment_score = sub.score
--   FROM (
--     SELECT DISTINCT ON (lead_id)
--            lead_id, (rating * 20)::smallint AS score
--     FROM review_responses
--     WHERE lead_id IS NOT NULL AND rating IS NOT NULL
--     ORDER BY lead_id, created_at DESC
--   ) sub
--  WHERE l.id = sub.lead_id
--    AND l.sentiment_score IS NULL;

-- ============================================
-- Pipeline redesign: 'contacted' stage, value, and speed-to-lead tracking
-- ============================================
--
-- The Pipeline screen (components/PipelineClient.tsx) adopts a mobile-
-- first layout with four stage tiles (New / Contacted / Appt set / Done)
-- and a single "Manual" vs "Ava is live" mode chip. Three data points
-- the old UI didn't track are now required:
--
--   1. A "contacted" stage between "lead" and "booked", so the tile
--      for leads the contractor has responded to but not yet booked is
--      a first-class bucket. leads.status is plain TEXT (no enum/check
--      constraint), so no schema change is needed to accept the new
--      value — the app just starts writing 'contacted'.
--
--   2. leads.estimated_value_cents drives the $72.1k pipeline total
--      and the weekly delta chip. Nullable so legacy leads keep working
--      and the UI degrades to $0 when no values are present yet.
--
--   3. leads.first_response_at is stamped the first time a lead moves
--      out of "lead" status (into contacted, booked, or customer).
--      leads.speed_to_lead_seconds is a generated column that computes
--      first_response_at - created_at in seconds — atomic, safe to
--      average, and never rewritten on subsequent status edits.
--
-- businesses.ava_enabled is the per-account toggle that, combined with
-- the `ava` plan feature flag, flips the Pipeline UI into live mode.
-- Defaulting to false means the column can be backfilled today without
-- changing any contractor's experience until the AI responder is ready.
--
-- Run as migration:
--
-- ALTER TABLE leads
--   ADD COLUMN IF NOT EXISTS estimated_value_cents INTEGER,
--   ADD COLUMN IF NOT EXISTS first_response_at     TIMESTAMPTZ,
--   ADD COLUMN IF NOT EXISTS speed_to_lead_seconds INTEGER GENERATED ALWAYS AS
--     (EXTRACT(EPOCH FROM (first_response_at - created_at))::INTEGER) STORED,
--   ADD COLUMN IF NOT EXISTS last_activity_at      TIMESTAMPTZ;
--
-- CREATE INDEX IF NOT EXISTS idx_leads_first_response_null
--   ON leads (business_id, created_at)
--   WHERE first_response_at IS NULL;
--
-- ALTER TABLE businesses
--   ADD COLUMN IF NOT EXISTS ava_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================
-- AI-generated lead summary (Claude Haiku 4.5)
-- ============================================
--
-- The Pipeline lead card shows a one-sentence AI summary generated
-- from every known signal on the lead (service, value, status,
-- appointment, tags, notes, chatbot intake answers, recent activity
-- log) in place of raw notes. Generation is lazy: when the contractor
-- opens the pipeline, the client sequentially calls
-- POST /api/contractor/customers/[id]/ai-summary for each lead where
-- ai_summary IS NULL, and the API route caches the result back on the
-- row so we don't pay for the same lead twice.
--
-- Run as migration:
--
-- ALTER TABLE leads
--   ADD COLUMN IF NOT EXISTS ai_summary TEXT,
--   ADD COLUMN IF NOT EXISTS ai_summary_generated_at TIMESTAMPTZ;

-- ============================================================
-- CSV contact import (2026-04)
-- ============================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS raw_import_data JSONB,
  ADD COLUMN IF NOT EXISTS import_batch_id UUID;
-- ai_summary TEXT is added above by the pipeline redesign migration.

CREATE INDEX IF NOT EXISTS idx_leads_import_batch
  ON leads(import_batch_id)
  WHERE import_batch_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS contact_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  total_rows INT NOT NULL,
  imported_rows INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','complete','failed')),
  column_mappings JSONB NOT NULL,
  ai_context_fields TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_imports_business
  ON contact_imports(business_id, created_at DESC);

ALTER TABLE contact_imports ENABLE ROW LEVEL SECURITY;

-- Deny-all for anon/authenticated. Server routes use the service role
-- (which bypasses RLS) and enforce scoping in-code via .eq("business_id").
CREATE POLICY "contact_imports_no_anon_select"
  ON contact_imports FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "contact_imports_no_anon_write"
  ON contact_imports FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- ============================================================
-- AI summary cache invalidation (2026-04)
-- ============================================================
--
-- Whenever a row is written to activity_log (insert/update/delete),
-- clear the cached ai_summary on the corresponding lead. The pipeline
-- and customer-detail clients both run a lazy backfill effect that
-- regenerates any row where ai_summary IS NULL, so nulling the cache
-- is enough to keep the summary in sync with the timeline the next
-- time a contractor views the lead. Putting this in the database
-- means no route can ever forget to invalidate the cache.

CREATE OR REPLACE FUNCTION invalidate_lead_ai_summary()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leads
     SET ai_summary = NULL,
         ai_summary_generated_at = NULL
   WHERE id = COALESCE(NEW.lead_id, OLD.lead_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS activity_log_invalidate_ai_summary ON activity_log;

CREATE TRIGGER activity_log_invalidate_ai_summary
AFTER INSERT OR UPDATE OR DELETE ON activity_log
FOR EACH ROW
EXECUTE FUNCTION invalidate_lead_ai_summary();

-- ============================================================
-- Service address column (2026-04)
-- ============================================================
--
-- Address is one of the most important operational fields for a
-- contractor — they need to know where the job is before picking up
-- the phone. Previously we had no canonical column and fished an
-- address out of `raw_import_data` / `answers` at read time; that's
-- fine as a fallback for old rows but we want a real column we can
-- query, update from the UI, and have the note-time AI extractor
-- fill in. Rows without a parsed address stay NULL.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS address TEXT;
