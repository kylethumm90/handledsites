-- handled. — universal lead custom_fields column.
--
-- Adds a single jsonb column for per-lead structured field values. The
-- canonical schema lives in lib/lead-fields.ts (LEAD_FIELD_CATALOG) — this
-- migration is intentionally schema-less so field additions / removals /
-- reorderings never require another DB migration.
--
-- Idempotent: safe to re-run.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS custom_fields jsonb NULL;

COMMENT ON COLUMN leads.custom_fields IS
  'Universal per-lead custom field values. Keys match lib/lead-fields.ts LEAD_FIELD_CATALOG entries. Populated by the AI extractor on note save and status advance, fill-empty-only.';

-- GIN index so future filters like "where custom_fields->>'project_urgency' = 'emergency_today'"
-- stay fast as the leads table grows.
CREATE INDEX IF NOT EXISTS leads_custom_fields_gin_idx
  ON leads USING gin (custom_fields);
