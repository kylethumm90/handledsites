import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin, type Lead } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";
import {
  SUMMARY_SYSTEM_PROMPT,
  buildSummaryUserPrompt,
} from "@/lib/csv-import";

// Background job (triggered fire-and-forget by /import/execute) that walks
// every lead in a given import batch and asks Claude Haiku to write a
// 1-2 sentence CRM summary. We sleep 200 ms between calls to stay well
// under Anthropic rate limits and keep the shared system-prompt cached.

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = "claude-haiku-4-5-20251001";
const PER_CALL_DELAY_MS = 200;
const MAX_TOKENS = 200;

type Body = { importId?: unknown };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { businessId } = auth;

  const body = (await request.json().catch(() => ({}))) as Body;
  if (typeof body.importId !== "string" || body.importId.length === 0) {
    return NextResponse.json(
      { error: "importId required" },
      { status: 400 }
    );
  }
  const importId = body.importId;

  const supabase = getSupabaseAdmin();

  const { data: importRow, error: impErr } = await supabase
    .from("contact_imports")
    .select("id, business_id, status")
    .eq("id", importId)
    .eq("business_id", businessId)
    .single();

  if (impErr || !importRow) {
    return NextResponse.json({ error: "Import not found" }, { status: 404 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    await supabase
      .from("contact_imports")
      .update({ status: "failed" })
      .eq("id", importId);
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  await supabase
    .from("contact_imports")
    .update({ status: "processing" })
    .eq("id", importId);

  const { data: leads, error: leadsErr } = await supabase
    .from("leads")
    .select(
      "id, name, email, phone, tags, source, created_at, raw_import_data"
    )
    .eq("business_id", businessId)
    .eq("import_batch_id", importId);

  if (leadsErr) {
    await supabase
      .from("contact_imports")
      .update({ status: "failed" })
      .eq("id", importId);
    return NextResponse.json({ error: leadsErr.message }, { status: 500 });
  }

  const client = new Anthropic({ apiKey });

  let successCount = 0;
  for (const lead of leads ?? []) {
    try {
      const resp = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        // Prompt caching via cache_control on the system block. With an
        // ephemeral cache the identical system prefix is reused across
        // every call in the batch.
        system: [
          {
            type: "text",
            text: SUMMARY_SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [
          {
            role: "user",
            content: buildSummaryUserPrompt(lead as unknown as Lead),
          },
        ],
      });

      const text =
        resp.content
          .map((block) => (block.type === "text" ? block.text : ""))
          .join("")
          .trim() || null;

      if (text) {
        await supabase
          .from("leads")
          .update({ ai_summary: text })
          .eq("id", lead.id)
          .eq("business_id", businessId);
        successCount += 1;
      }
    } catch (err) {
      console.error("[generate-summaries] lead", lead.id, err);
      // Keep going — one bad lead shouldn't abort the whole batch.
    }

    await sleep(PER_CALL_DELAY_MS);
  }

  await supabase
    .from("contact_imports")
    .update({ status: "complete" })
    .eq("id", importId);

  return NextResponse.json({
    ok: true,
    total: leads?.length ?? 0,
    summarized: successCount,
  });
}
