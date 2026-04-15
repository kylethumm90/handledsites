import type { Lead } from "@/lib/supabase";

/**
 * Pull a printable address out of a lead. There's no canonical address
 * column on `leads`, so we look in both `raw_import_data` (CSV imports)
 * and `answers` (quiz-funnel responses) for the usual GHL/HubSpot/
 * Salesforce shapes — a single combined "Full Address" field first,
 * then stitch one together from street + city + state + zip. Keys are
 * matched case-insensitively with whitespace/underscores/dashes stripped.
 * Returns null when nothing usable is found.
 *
 * Shared by PipelineClient (list card fallback) and ContactDetailModal
 * (featured address strip) so both always agree on what "the address"
 * for a lead is.
 */
export function addressFromLead(lead: Lead): string | null {
  // Build one normalized key → value map from both answer/raw sources.
  // `answers` wins on conflicts — it's the fresher funnel signal.
  const lower = new Map<string, string>();

  const ingest = (src: unknown) => {
    if (!src || typeof src !== "object") return;
    for (const [k, v] of Object.entries(src as Record<string, unknown>)) {
      if (typeof v !== "string") continue;
      const trimmed = v.trim();
      if (!trimmed) continue;
      lower.set(k.toLowerCase().replace(/[\s_-]+/g, ""), trimmed);
    }
  };

  ingest(lead.raw_import_data);
  ingest(lead.answers);

  const get = (...keys: string[]): string | null => {
    for (const k of keys) {
      const v = lower.get(k);
      if (v) return v;
    }
    return null;
  };

  // 1. Single pre-joined address field.
  const full = get(
    "fulladdress",
    "address",
    "serviceaddress",
    "mailingaddress",
    "homeaddress",
    "propertyaddress",
    "jobaddress",
  );
  if (full) return full;

  // 2. Stitch street + city + state + zip.
  const street = get(
    "streetaddress",
    "street",
    "address1",
    "addressline1",
    "addressline",
  );
  const city = get("city");
  const state = get("state", "region");
  const zip = get("postalcode", "zip", "zipcode");

  const tail = [city, state].filter(Boolean).join(", ");
  const parts = [street, tail, zip].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(", ");
}
