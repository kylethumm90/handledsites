-- ============================================
-- Business gallery photos
-- ============================================
--
-- Backs the contractor-facing photo gallery: contractors upload
-- project photos in /contractor/gallery; visible rows render in a
-- "Recent Work" section on their public business card at /[slug].
--
-- Note: there is no `contractors` table in this schema; the FK
-- targets `businesses(id)` (the canonical entity). Reads/writes go
-- through the service-role admin client, matching the existing
-- pattern in lib/supabase.ts.

CREATE TABLE IF NOT EXISTS public.business_gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  caption TEXT,
  service_type TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gallery_business
  ON public.business_gallery_photos (business_id, display_order);

ALTER TABLE public.business_gallery_photos ENABLE ROW LEVEL SECURITY;

-- Lock down direct anon/authenticated access; the service role bypasses
-- RLS for our server-side routes (consistent with referral_events,
-- contractor_sessions, etc.).
CREATE POLICY business_gallery_photos_no_anon_select
  ON public.business_gallery_photos FOR SELECT
  TO anon USING (false);

CREATE POLICY business_gallery_photos_no_anon_write
  ON public.business_gallery_photos FOR ALL
  TO anon USING (false) WITH CHECK (false);

-- ============================================
-- Storage bucket: gallery-photos
-- ============================================
-- Public bucket so the Next.js Image component can fetch URLs without
-- signed-URL juggling. Path convention: {business_id}/{uuid}.{ext}.

INSERT INTO storage.buckets (id, name, public)
  VALUES ('gallery-photos', 'gallery-photos', true)
  ON CONFLICT (id) DO NOTHING;

-- Public read, no anon writes. Server-side uploads use the service role.
CREATE POLICY "Public read gallery-photos"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'gallery-photos');
