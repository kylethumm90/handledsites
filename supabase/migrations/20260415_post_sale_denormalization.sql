-- ============================================
-- Post-sale denormalization on leads
-- ============================================
--
-- Adds the five-stage post-sale funnel columns to `leads`:
--   jobs done → feedback → reviews → referral partners → referrals
--
-- These are denormalized from child tables (review_responses,
-- referral_partners) for cheap COUNT(*) FILTER queries and simple
-- "who's stuck?" WHERE clauses. Additive only — safe against the
-- existing Pipeline view.
--
-- Every statement is idempotent: safe to re-run, safe against a
-- partial prior run, safe to leave in source control and replay on
-- a new environment.
--
-- Referenced from:
--   app/api/contractor/customers/[id]/route.ts (writes job_completed_at on becoming_customer)
--   app/api/reviews/referral-enroll/route.ts    (writes job_completed_at, referral_opted_in_at)
--   lib/pipeline-v2.ts                          (reads all six for Post-Sale view)
--   components/pipeline/contact-detail-modal.tsx

-- 1. Columns -----------------------------------------------------------------

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS job_completed_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS feedback_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_submitted_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS referral_opted_in_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sentiment_score       SMALLINT,
  ADD COLUMN IF NOT EXISTS job_value_cents       INTEGER,
  ADD COLUMN IF NOT EXISTS referred_by_lead_id   UUID REFERENCES leads(id);

-- 2. Indexes -----------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_leads_business_job_done
  ON leads (business_id, job_completed_at DESC)
  WHERE job_completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_referred_by
  ON leads (referred_by_lead_id)
  WHERE referred_by_lead_id IS NOT NULL;

-- 3. Backfill ----------------------------------------------------------------
--
-- All four UPDATEs are guarded by `WHERE <target> IS NULL` so re-running
-- this migration never overwrites values that the app has since written.

-- 3a. Seed job_completed_at from closed_at on existing customers. Any lead
-- that's already in the `customer` status was a job that shipped — stamp the
-- earliest thing we know about that moment (closed_at) so Post-Sale counts
-- aren't empty on day one.
UPDATE leads
   SET job_completed_at = closed_at
 WHERE status = 'customer'
   AND closed_at IS NOT NULL
   AND job_completed_at IS NULL;

-- 3b. feedback_submitted_at — earliest review_response per lead.
UPDATE leads l
   SET feedback_submitted_at = sub.first_at
  FROM (
    SELECT lead_id, MIN(created_at) AS first_at
      FROM review_responses
     WHERE lead_id IS NOT NULL
     GROUP BY lead_id
  ) sub
 WHERE l.id = sub.lead_id
   AND l.feedback_submitted_at IS NULL;

-- 3c. referral_opted_in_at — referral_partners.created_at.
UPDATE leads l
   SET referral_opted_in_at = rp.created_at
  FROM referral_partners rp
 WHERE rp.customer_id = l.id
   AND l.referral_opted_in_at IS NULL;

-- 3d. sentiment_score — derive from the latest review rating (1-5 → 0-100).
-- Replace with NLP-derived sentiment when that pipeline exists.
UPDATE leads l
   SET sentiment_score = sub.score
  FROM (
    SELECT DISTINCT ON (lead_id)
           lead_id,
           (rating * 20)::smallint AS score
      FROM review_responses
     WHERE lead_id IS NOT NULL
       AND rating IS NOT NULL
     ORDER BY lead_id, created_at DESC
  ) sub
 WHERE l.id = sub.lead_id
   AND l.sentiment_score IS NULL;
