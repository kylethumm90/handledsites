import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lead } from "@/lib/supabase";

// Canonical lead columns the CSV importer is allowed to write to. Any other
// CSV headers either land in raw_import_data (if the user selects them as AI
// context fields) or are dropped.
export const LEAD_FIELD_WHITELIST = [
  "name",
  "email",
  "phone",
  "tags",
  "notes",
  "service_needed",
  "source",
  "address",
] as const;

export type LeadField = (typeof LEAD_FIELD_WHITELIST)[number];

export type ColumnMappings = Record<string, LeadField | null>;

export function isLeadField(value: unknown): value is LeadField {
  return (
    typeof value === "string" &&
    (LEAD_FIELD_WHITELIST as readonly string[]).includes(value)
  );
}

export function normalizeName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length === 0) return null;
  // Soft validation — a cell with "n/a" isn't an email but we don't want to
  // reject rows over it. Require at least an `@` and a `.`.
  if (!trimmed.includes("@") || !trimmed.includes(".")) return null;
  return trimmed;
}

// Phones are stored as digits-only strings in the leads table. Anything with
// fewer than 7 digits is treated as empty (matches the existing bulk route
// behavior of dropping garbage phones silently).
export function normalizePhone(value: unknown): string {
  if (typeof value !== "string") return "";
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 ? digits : "";
}

export function parseTags(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// Result of mapping a single CSV row through a ColumnMappings object. Only
// keys with non-empty values are set, so the caller can spread-merge into
// the final insert payload without clobbering defaults.
export type MappedLeadFields = {
  name?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  notes?: string;
  service_needed?: string;
  source?: string;
  address?: string;
};

export function applyColumnMappings(
  row: Record<string, string>,
  mappings: ColumnMappings
): MappedLeadFields {
  const out: MappedLeadFields = {};
  for (const [header, field] of Object.entries(mappings)) {
    if (!field) continue;
    const raw = row[header];
    if (raw === undefined) continue;
    switch (field) {
      case "name": {
        const v = normalizeName(raw);
        if (v) out.name = v;
        break;
      }
      case "email": {
        const v = normalizeEmail(raw);
        if (v) out.email = v;
        break;
      }
      case "phone": {
        const v = normalizePhone(raw);
        if (v) out.phone = v;
        break;
      }
      case "tags": {
        const v = parseTags(raw);
        if (v.length > 0) out.tags = v;
        break;
      }
      case "notes": {
        const v = cleanText(raw);
        if (v) out.notes = v;
        break;
      }
      case "service_needed": {
        const v = cleanText(raw);
        if (v) out.service_needed = v;
        break;
      }
      case "source": {
        const v = cleanText(raw);
        if (v) out.source = v;
        break;
      }
      case "address": {
        const v = cleanText(raw);
        if (v) out.address = v;
        break;
      }
    }
  }
  return out;
}

// Pick the selected AI-context columns from the raw CSV row, keeping only
// non-empty string values. Returns null if nothing was selected/filled so
// callers can skip writing an empty JSON object.
export function buildRawImportData(
  row: Record<string, string>,
  aiContextFields: string[]
): Record<string, string> | null {
  const out: Record<string, string> = {};
  for (const key of aiContextFields) {
    const raw = row[key];
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (trimmed.length === 0) continue;
    // Guard against absurd cell sizes — a single huge cell shouldn't blow
    // up a JSONB row. Truncate at 4 KB per field.
    out[key] = trimmed.length > 4096 ? trimmed.slice(0, 4096) : trimmed;
  }
  return Object.keys(out).length > 0 ? out : null;
}

// Merge incoming raw_import_data into an existing lead's raw_import_data.
// Per spec: incoming keys must NOT overwrite existing keys — we preserve
// the original import's data and only add new keys from the new import.
export function mergeRawImportData(
  existing: Record<string, string> | null | undefined,
  incoming: Record<string, string> | null | undefined
): Record<string, string> | null {
  if (!existing && !incoming) return null;
  const merged: Record<string, string> = { ...(incoming ?? {}) };
  // Existing keys win over incoming.
  for (const [k, v] of Object.entries(existing ?? {})) {
    merged[k] = v;
  }
  return Object.keys(merged).length > 0 ? merged : null;
}

// Build the user-facing prompt content for the Claude AI summary. Omits
// missing fields gracefully so we don't feed the model dead labels.
// Note: `location` is deliberately excluded — no such column exists on leads.
export function buildSummaryUserPrompt(
  lead: Pick<
    Lead,
    | "name"
    | "email"
    | "phone"
    | "tags"
    | "source"
    | "created_at"
    | "raw_import_data"
  >
): string {
  const lines: string[] = [];
  if (lead.name) lines.push(`Name: ${lead.name}`);
  if (lead.email) lines.push(`Email: ${lead.email}`);
  if (lead.phone) lines.push(`Phone: ${lead.phone}`);
  if (lead.tags && lead.tags.length > 0) {
    lines.push(`Tags: ${lead.tags.join(", ")}`);
  }
  if (lead.source) lines.push(`Lead source: ${lead.source}`);
  if (lead.created_at) lines.push(`Created at: ${lead.created_at}`);
  if (lead.raw_import_data && Object.keys(lead.raw_import_data).length > 0) {
    lines.push(`Additional data: ${JSON.stringify(lead.raw_import_data)}`);
  }
  return lines.join("\n");
}

export const SUMMARY_SYSTEM_PROMPT =
  "You are a CRM assistant for a home services company. Given this contact's data, write 1-2 concise sentences summarizing their status and what needs attention next. Be direct, specific, and useful for a sales rep.";

// Duplicate lookup used during CSV execution. We pre-fetch all potential
// duplicates in a single pair of queries per call site, so this function is
// really a batch helper: given lists of candidate emails and phones, return
// Maps keyed by email and by phone.
export async function loadExistingByEmailOrPhone(
  supabase: SupabaseClient,
  businessId: string,
  emails: string[],
  phones: string[]
): Promise<{
  byEmail: Map<string, Pick<Lead, "id" | "raw_import_data">>;
  byPhone: Map<string, Pick<Lead, "id" | "raw_import_data">>;
}> {
  const byEmail = new Map<string, Pick<Lead, "id" | "raw_import_data">>();
  const byPhone = new Map<string, Pick<Lead, "id" | "raw_import_data">>();

  const chunk = <T>(arr: T[], size: number): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  if (emails.length > 0) {
    for (const slice of chunk(emails, 500)) {
      const { data } = await supabase
        .from("leads")
        .select("id, email, raw_import_data")
        .eq("business_id", businessId)
        .in("email", slice);
      for (const row of data ?? []) {
        if (row.email) byEmail.set(row.email.toLowerCase(), row);
      }
    }
  }

  if (phones.length > 0) {
    for (const slice of chunk(phones, 500)) {
      const { data } = await supabase
        .from("leads")
        .select("id, phone, raw_import_data")
        .eq("business_id", businessId)
        .in("phone", slice);
      for (const row of data ?? []) {
        if (row.phone) byPhone.set(row.phone, row);
      }
    }
  }

  return { byEmail, byPhone };
}
