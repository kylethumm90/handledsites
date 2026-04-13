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

