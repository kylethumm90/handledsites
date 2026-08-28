-- Remove the abandoned Google Business Profile integration and the plaintext
-- OAuth credentials it stored.
--
-- user_google_auth held access_token and refresh_token as bare `text`. The one
-- row is the owner's own Google account, granted with scope
-- `https://www.googleapis.com/auth/business.manage` -- full read/write on the
-- Google Business Profile, including posting and replying to reviews. The
-- access token expired 2026-04-02, but the refresh token does not expire on
-- its own and can still mint new access tokens until the grant is revoked.
--
-- Neither table has a single reference anywhere in the codebase; the
-- integration was never finished.
--
-- DO THIS FIRST -- revoking is not something the migration can do:
--   1. Sign in as the affected Google account.
--   2. Go to https://myaccount.google.com/permissions
--   3. Remove this application's access.
--   4. Confirm the grant is gone, then run this migration.
--
-- Running the migration without revoking first destroys the record of which
-- grant to revoke while leaving the grant itself live at Google.
--
-- If the GBP integration is picked back up later, store tokens encrypted
-- (pgsodium / Supabase Vault) rather than as plaintext columns.

DROP TABLE IF EXISTS public.user_gbp_locations;
DROP TABLE IF EXISTS public.user_google_auth;
