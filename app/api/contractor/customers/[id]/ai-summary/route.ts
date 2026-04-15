import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin, type Lead } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";
import {
  SUMMARY_SYSTEM_PROMPT,
  buildSummaryUserPrompt,
} from "@/lib/csv-import";

// Generate (or regenerate) the Claude-written CRM summary for a single
// customer. Same prompt + model + cache semantics as the bulk import
// summary job, so a rep can ask for a fresh summary whenever they want.

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 200;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { businessId } = auth;

  const leadId = params.id;
  if (!leadId) {
    return NextResponse.json({ error: "Missing lead id" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select(
      "id, name, email, phone, tags, source, created_at, raw_import_data"
    )
    .eq("id", leadId)
    .eq("business_id", businessId)
    .single();

  if (leadErr || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const client = new Anthropic({ apiKey });

  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
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

    if (!text) {
      return NextResponse.json(
        { error: "No summary generated" },
        { status: 500 }
      );
    }

    const { error: updateErr } = await supabase
      .from("leads")
      .update({ ai_summary: text })
      .eq("id", leadId)
      .eq("business_id", businessId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ai_summary: text });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate summary";
    console.error("[customers/ai-summary]", leadId, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
