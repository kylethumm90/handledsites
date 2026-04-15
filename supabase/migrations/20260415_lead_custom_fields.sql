-- handled. — universal lead custom_fields column + AI lead profile narrative.
--
-- Adds two columns that together form the AI-maintained layer of the Lead
-- record:
--
--   * custom_fields (jsonb): per-lead structured field values. Canonical
--     schema lives in lib/lead-fields.ts (LEAD_FIELD_CATALOG). Intentionally
--     schema-less so field additions / removals / reorderings never require
--     another DB migration. Fill-empty-only write semantics.
--
--   * ai_lead_profile (text): short (2-4 sentence) narrative written by the
--     AI on every regen. REPLACE-not-append — the model gets the current
--     profile as input and returns an updated one. This is the "briefing"
--     a sales rep would read before calling the lead.
--
-- Idempotent: safe to re-run.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS custom_fields jsonb NULL,
  ADD COLUMN IF NOT EXISTS ai_lead_profile text NULL;

COMMENT ON COLUMN leads.custom_fields IS
  'Universal per-lead custom field values. Keys match lib/lead-fields.ts LEAD_FIELD_CATALOG entries. Populated by the AI extractor on note save and status advance, fill-empty-only.';

COMMENT ON COLUMN leads.ai_lead_profile IS
  'AI-maintained 2-4 sentence narrative briefing of the lead. Regenerated (not appended) on each note/status update by lib/ai-summary.ts. Separate from ai_summary, which is a shorter stage-specific next-action blurb.';

-- GIN index so future filters like "where custom_fields->>'project_urgency' = 'emergency_today'"
-- stay fast as the leads table grows.
CREATE INDEX IF NOT EXISTS leads_custom_fields_gin_idx
  ON leads USING gin (custom_fields);
