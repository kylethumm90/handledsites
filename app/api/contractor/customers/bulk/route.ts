import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

// Bulk create leads from a CSV import on the Pipeline page. The client
// parses the CSV, maps header aliases to our column names, and POSTs an
// array of normalized contacts here. We cap batch size to keep a single
// request well under the Vercel function timeout.

const MAX_BATCH = 500;

type IncomingContact = {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  service_needed?: unknown;
  notes?: unknown;
  status?: unknown;
};

type PipelineStatus = "lead" | "booked" | "customer";
const VALID_STATUSES: readonly PipelineStatus[] = ["lead", "booked", "customer"];

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// Accept any of our three pipeline statuses from the client; anything
// else falls back to "lead" so a bad row can't land in an unexpected bucket.
function coerceStatus(value: unknown): PipelineStatus {
  if (
    typeof value === "string" &&
    (VALID_STATUSES as readonly string[]).includes(value)
  ) {
    return value as PipelineStatus;
  }
  return "lead";
}

export async function POST(request: NextRequest) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { businessId } = auth;

  const body = await request.json().catch(() => ({}));
  const raw = Array.isArray(body?.contacts) ? (body.contacts as IncomingContact[]) : null;

  if (!raw || raw.length === 0) {
    return NextResponse.json({ error: "No contacts supplied" }, { status: 400 });
  }

  if (raw.length > MAX_BATCH) {
    return NextResponse.json(
      { error: `Too many contacts. Max ${MAX_BATCH} per upload.` },
      { status: 400 }
    );
  }

  // Normalize + filter: every row must have a non-empty name. Silently drop
  // header rows, blank lines, or placeholder rows the client might pass
  // through — but report the skip count back to the UI.
  const rows = raw
    .map((r) => ({
      business_id: businessId,
      name: clean(r.name),
      phone:
        typeof r.phone === "string" ? r.phone.replace(/\D/g, "") : "",
      email: clean(r.email),
      service_needed: clean(r.service_needed),
      notes: clean(r.notes),
      source: "csv_import",
      status: coerceStatus(r.status),
    }))
    .filter((r) => r.name && r.name.length > 0);

  const skipped = raw.length - rows.length;

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No rows had a name. Make sure your CSV has a 'name' column." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: leads, error } = await supabase
    .from("leads")
    .insert(rows)
    .select();

  if (error || !leads) {
    return NextResponse.json(
      { error: error?.message || "Failed to import contacts" },
      { status: 400 }
    );
  }

  // One activity_log row per inserted lead so each shows up in The Story.
  // Best-effort: the leads are already persisted if this fails.
  const logRows = leads.map((lead) => ({
    business_id: businessId,
    lead_id: lead.id,
    type: "lead_created",
    summary: "Imported from CSV",
  }));
  await supabase
    .from("activity_log")
    .insert(logRows)
    .then(() => {}, () => {});

  return NextResponse.json({
    imported: leads.length,
    skipped,
    leads,
  });
}
