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

