-- Remove public (anon) table access from businesses, sites and contractor_sites.
--
-- These policies date from the original design, where the browser inserted
-- signups directly with the anon key. Because the anon key ships to every
-- visitor, `USING (true)` on SELECT meant anyone could enumerate every
-- business row -- owner_name, phone, email, custom_domain and the cached
-- google_reviews payload. `WITH CHECK (true)` on INSERT let anyone write
-- arbitrary rows into businesses and sites.
--
-- Signup now runs server-side via POST /api/signup using the service-role
-- key, so no public policy is needed. After these drops each table still has
-- RLS enabled with no policies, which denies anon and authenticated outright;
-- the service-role key bypasses RLS and is unaffected.
--
-- ORDER OF OPERATIONS: deploy the application first. Running this against a
-- deployment whose client still inserts directly will break signup.
--
-- To roll back, recreate the policies at the bottom of this file.

DROP POLICY IF EXISTS "Allow public read businesses"    ON public.businesses;
DROP POLICY IF EXISTS "Allow public insert to businesses" ON public.businesses;

DROP POLICY IF EXISTS "Allow public read sites"         ON public.sites;
DROP POLICY IF EXISTS "Allow public insert to sites"    ON public.sites;

-- contractor_sites is the superseded gen-1 table. Nothing references it in
-- code, but it still held both public policies and 7 real rows.
DROP POLICY IF EXISTS "Anyone can check slugs"          ON public.contractor_sites;
DROP POLICY IF EXISTS "Anyone can insert"               ON public.contractor_sites;

-- Rollback:
--   CREATE POLICY "Allow public read businesses" ON public.businesses
--     FOR SELECT TO anon USING (true);
--   CREATE POLICY "Allow public insert to businesses" ON public.businesses
--     FOR INSERT TO anon WITH CHECK (true);
--   CREATE POLICY "Allow public read sites" ON public.sites
--     FOR SELECT TO anon USING (true);
--   CREATE POLICY "Allow public insert to sites" ON public.sites
--     FOR INSERT TO anon WITH CHECK (true);
--   CREATE POLICY "Anyone can check slugs" ON public.contractor_sites
--     FOR SELECT TO anon USING (true);
--   CREATE POLICY "Anyone can insert" ON public.contractor_sites
--     FOR INSERT TO anon WITH CHECK (true);
