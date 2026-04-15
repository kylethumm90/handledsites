import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";
import {
  applyColumnMappings,
  buildRawImportData,
  isLeadField,
  loadExistingByEmailOrPhone,
  mergeRawImportData,
  type ColumnMappings,
  type LeadField,
} from "@/lib/csv-import";

// Step 2 of the CSV import flow. The client has already parsed the CSV
// (via /import/parse) and collected column mappings plus AI-context
// selections. Here we:
//   1. Create a contact_imports tracking row.
//   2. Dedupe against existing leads by email/phone for this business.
//   3. Insert non-duplicate rows in chunks; merge raw_import_data into
//      duplicates without overwriting their existing keys.
//   4. Kick off AI summary generation non-blocking.

export const runtime = "nodejs";
export const maxDuration = 60;

const INSERT_CHUNK = 500;
const MAX_ROWS = 50000;

type ExecuteBody = {
  filename?: unknown;
  columnMappings?: unknown;
  aiContextFields?: unknown;
  rows?: unknown;
};

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function parseColumnMappings(
  raw: unknown
):
  | { ok: true; mappings: ColumnMappings }
  | { ok: false; error: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "columnMappings must be an object" };
  }
  const out: ColumnMappings = {};
  const seenFields = new Set<LeadField>();
  for (const [header, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === null || value === undefined || value === "") {
      out[header] = null;
      continue;
    }
    if (!isLeadField(value)) {
      return {
        ok: false,
        error: `columnMappings[${header}] is not a valid lead field`,
      };
    }
    if (seenFields.has(value)) {
      return {
        ok: false,
        error: `Multiple CSV headers map to the same field "${value}"`,
      };
    }
    seenFields.add(value);
    out[header] = value;
  }
  if (!seenFields.has("name")) {
    return {
      ok: false,
      error: "At least one CSV header must map to 'name'",
    };
  }
  return { ok: true, mappings: out };
}

export async function POST(request: NextRequest) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { businessId, siteId } = auth;

  const body = (await request.json().catch(() => ({}))) as ExecuteBody;

  const filename =
    typeof body.filename === "string" && body.filename.trim().length > 0
      ? body.filename.trim()
      : "upload.csv";

  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json(
      { error: "rows must be a non-empty array" },
      { status: 400 }
    );
  }
  if (body.rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows. Max ${MAX_ROWS}.` },
      { status: 400 }
    );
  }
  const rows = body.rows as Record<string, string>[];

  if (!isStringArray(body.aiContextFields)) {
    return NextResponse.json(
      { error: "aiContextFields must be an array of strings" },
      { status: 400 }
    );
  }
  const aiContextFields = body.aiContextFields;

  const mappingResult = parseColumnMappings(body.columnMappings);
  if (!mappingResult.ok) {
    return NextResponse.json({ error: mappingResult.error }, { status: 400 });
  }
  const columnMappings = mappingResult.mappings;

  const supabase = getSupabaseAdmin();

  // 1. Create the contact_imports tracking row.
  const { data: importRow, error: impErr } = await supabase
    .from("contact_imports")
    .insert({
      business_id: businessId,
      filename,
      total_rows: rows.length,
      imported_rows: 0,
      status: "pending",
      column_mappings: columnMappings,
      ai_context_fields: aiContextFields,
    })
    .select()
    .single();

  if (impErr || !importRow) {
    return NextResponse.json(
      { error: impErr?.message || "Failed to create import record" },
      { status: 500 }
    );
  }
  const importBatchId: string = importRow.id;

  // 2. Pre-compute every row's mapped fields once. We keep the original
  //    row index alongside so we can thread raw_import_data through the
  //    dedupe step without re-parsing.
  type Prepared = {
    raw: Record<string, string>;
    fields: ReturnType<typeof applyColumnMappings>;
    rawData: Record<string, string> | null;
  };

  const prepared: Prepared[] = [];
  for (const raw of rows) {
    const fields = applyColumnMappings(raw, columnMappings);
    if (!fields.name) continue; // no name, no lead
    const rawData = buildRawImportData(raw, aiContextFields);
    prepared.push({ raw, fields, rawData });
  }

  // 3. Batch-fetch existing duplicates by email/phone. Avoids N+1 queries
  //    for large imports.
  const candidateEmails = Array.from(
    new Set(
      prepared
        .map((p) => p.fields.email)
        .filter((e): e is string => typeof e === "string" && e.length > 0)
    )
  );
  const candidatePhones = Array.from(
    new Set(
      prepared
        .map((p) => p.fields.phone)
        .filter((p): p is string => typeof p === "string" && p.length > 0)
    )
  );

  const { byEmail, byPhone } = await loadExistingByEmailOrPhone(
    supabase,
    businessId,
    candidateEmails,
    candidatePhones
  );

  // Track which existing-lead ids we've already merged into so two
  // duplicate rows in the same CSV collapse onto the same merge op.
  const mergedIntoExisting = new Map<
    string,
    { raw: Record<string, string> | null }
  >();
  // Track duplicates within this same CSV batch — first occurrence wins
  // the insert, later occurrences merge into it in-memory.
  const batchByEmail = new Map<string, number>();
  const batchByPhone = new Map<string, number>();

  const inserts: Record<string, unknown>[] = [];
  let skipped = 0;

  for (const p of prepared) {
    // (a) Dedupe against existing leads in the DB.
    const existing =
      (p.fields.email && byEmail.get(p.fields.email)) ||
      (p.fields.phone && byPhone.get(p.fields.phone)) ||
      null;

    if (existing) {
      const prior =
        mergedIntoExisting.get(existing.id)?.raw ?? existing.raw_import_data;
      mergedIntoExisting.set(existing.id, {
        raw: mergeRawImportData(prior, p.rawData),
      });
      skipped += 1;
      continue;
    }

    // (b) Dedupe within this same batch.
    const batchHitIdx =
      (p.fields.email !== undefined
        ? batchByEmail.get(p.fields.email)
        : undefined) ??
      (p.fields.phone !== undefined
        ? batchByPhone.get(p.fields.phone)
        : undefined);

    if (batchHitIdx !== undefined) {
      const target = inserts[batchHitIdx];
      target.raw_import_data = mergeRawImportData(
        target.raw_import_data as Record<string, string> | null,
        p.rawData
      );
      skipped += 1;
      continue;
    }

    const idx = inserts.length;
    inserts.push({
      business_id: businessId,
      site_id: siteId,
      source: p.fields.source ?? "csv_import",
      status: "lead",
      import_batch_id: importBatchId,
      raw_import_data: p.rawData,
      name: p.fields.name,
      email: p.fields.email ?? null,
      phone: p.fields.phone ?? "",
      service_needed: p.fields.service_needed ?? null,
      notes: p.fields.notes ?? null,
      tags: p.fields.tags ?? null,
    });
    if (p.fields.email) batchByEmail.set(p.fields.email, idx);
    if (p.fields.phone) batchByPhone.set(p.fields.phone, idx);
  }

  // 4. Insert new leads in chunks.
  type InsertedLead = { id: string };
  const inserted: InsertedLead[] = [];
  for (let i = 0; i < inserts.length; i += INSERT_CHUNK) {
    const slice = inserts.slice(i, i + INSERT_CHUNK);
    const { data, error } = await supabase
      .from("leads")
      .insert(slice)
      .select("id");
    if (error || !data) {
      await supabase
        .from("contact_imports")
        .update({ status: "failed" })
        .eq("id", importBatchId);
      return NextResponse.json(
        { error: error?.message || "Failed to insert leads" },
        { status: 500 }
      );
    }
    inserted.push(...(data as InsertedLead[]));
  }

  // 5. Apply raw_import_data merges to existing leads.
  for (const entry of Array.from(mergedIntoExisting.entries())) {
    const [leadId, payload] = entry;
    await supabase
      .from("leads")
      .update({ raw_import_data: payload.raw })
      .eq("id", leadId)
      .eq("business_id", businessId);
  }

  // 6. Update the tracking row with the final inserted count.
  await supabase
    .from("contact_imports")
    .update({ imported_rows: inserted.length })
    .eq("id", importBatchId);

  // 7. Best-effort activity log entries (mirrors the bulk route pattern).
  if (inserted.length > 0) {
    const logRows = inserted.map((lead) => ({
      business_id: businessId,
      lead_id: lead.id,
      type: "lead_created",
      summary: `Imported from CSV (${filename})`,
    }));
    await supabase
      .from("activity_log")
      .insert(logRows)
      .then(
        () => {},
        () => {}
      );
  }

  // 8. Fire-and-forget the AI summary generation. We do NOT await — the
  //    client gets a response immediately and the background job writes
  //    ai_summary onto each lead. keepalive: true tells the Node runtime
  //    to flush the outgoing request even as this function terminates.
  //    Cookie forwarding lets the summaries route reuse the same auth.
  if (inserted.length > 0) {
    try {
      const url = new URL(
        "/api/contractor/import/generate-summaries",
        request.url
      );
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      fetch(url.toString(), {
        method: "POST",
        keepalive: true,
        headers: {
          "content-type": "application/json",
          cookie: request.headers.get("cookie") ?? "",
        },
        body: JSON.stringify({ importId: importBatchId }),
      }).catch(() => {});
    } catch {
      // Never let a trigger failure affect the import response.
    }
  } else {
    // Nothing to summarize — mark complete immediately.
    await supabase
      .from("contact_imports")
      .update({ status: "complete" })
      .eq("id", importBatchId);
  }

  return NextResponse.json({
    importId: importBatchId,
    importedCount: inserted.length,
    skipped,
  });
}
