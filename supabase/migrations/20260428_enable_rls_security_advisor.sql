-- ============================================================
-- Security Advisor remediation (2026-04-28)
-- ============================================================
--
-- Resolves the errors raised by Supabase's Security Advisor:
--
--   1. SECURITY DEFINER on the `sites_full` view. The view ran with
--      its creator's privileges, which lets callers read rows they
--      could not otherwise see. Switching it to `security_invoker`
--      makes the view honor the caller's RLS, matching what every
--      base table already enforces.
--
--   2. RLS disabled on eight public tables:
--        email_templates, email_logs, referral_partners,
--        user_business_roles, grader_leads, subscriptions,
--        visibility_leads, employees
--      All eight are written and read exclusively by server routes
--      using the service role key (see lib/supabase.ts ->
--      getSupabaseAdmin), which bypasses RLS regardless. Enabling
--      RLS with explicit deny-all policies for `anon` and
--      `authenticated` mirrors the existing `contact_imports`
--      treatment in supabase-schema.sql and removes the advisor
--      finding without changing any application behavior.
--
-- Idempotent: every statement uses IF EXISTS / CREATE POLICY guarded
-- by a DROP POLICY IF EXISTS so the migration is safe to re-run on
-- environments that have been partially patched.

-- 1. sites_full view ---------------------------------------------------------

ALTER VIEW IF EXISTS public.sites_full SET (security_invoker = on);

-- 2. Enable RLS + deny-all on the eight flagged tables -----------------------

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'email_templates',
    'email_logs',
    'referral_partners',
    'user_business_roles',
    'grader_leads',
    'subscriptions',
    'visibility_leads',
    'employees'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      tbl || '_no_anon_select', tbl
    );
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      tbl || '_no_anon_write', tbl
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (false)',
      tbl || '_no_anon_select', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
      tbl || '_no_anon_write', tbl
    );
  END LOOP;
END $$;
