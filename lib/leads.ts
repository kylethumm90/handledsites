import type { Lead } from "@/lib/supabase";

/**
 * Narrow shape `addressFromLead` needs — the real `leads.address` column
 * when available, plus the JSON blobs we scan as a fallback. Accepts a
 * subset of `Lead` so server routes can call it before they have a
 * fully-hydrated row (e.g. the quiz submit handler passing `{ answers }`
 * alone to derive an address at insert time).
 */
type AddressSource = Pick<Lead, "answers" | "raw_import_data"> & {
  address?: string | null;
};

/**
 * Resolve a printable service address for a lead.
 *
 * Order:
 *   1. `leads.address` column — the canonical field. New writes land here.
 *   2. A combined "Full Address" style key in `raw_import_data` or `answers`.
 *   3. Stitched street + city + state + zip from the usual
 *      GHL/HubSpot/Salesforce/quiz-funnel shapes.
 *
 * Keys in (2)/(3) are compared case-insensitively with whitespace,
 * underscores, and dashes stripped. Returns null when nothing usable
 * is found.
 *
 * Shared by PipelineClient (list card fallback), ContactDetailModal
 * (featured address strip), and the server-side insert handlers
 * (quiz / website / CSV import) so everyone agrees on what "the
 * address" for a lead is. Kept tolerant of the legacy shapes so old
 * rows written before the column existed still render correctly.
 */
export function addressFromLead(lead: AddressSource): string | null {
  // Column wins. Once the CSV importer, quiz funnel, and note-time
  // AI extractor start populating this, it'll be the only path we
  // actually hit for new rows.
  const col = lead.address?.trim();
  if (col) return col;

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
