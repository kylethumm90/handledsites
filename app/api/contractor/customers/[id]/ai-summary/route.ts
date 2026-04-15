import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

// Claude Haiku 4.5 generates a tight, contractor-facing one-liner that
// the Pipeline lead card uses in place of raw notes. It pulls every
// known signal (service, value, status, appointment, tags, notes,
// chatbot answers, recent activity) and produces something a
// contractor can scan in half a second to know "what's going on with
// this lead".
//
// We cache the result on leads.ai_summary so we don't pay for every
// page load. The client calls this endpoint lazily for leads where
// ai_summary is null.

const MODEL = "claude-haiku-4-5-20251001";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { businessId } = auth;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI not configured" },
      { status: 500 },
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("*")
    .eq("id", params.id)
    .eq("business_id", businessId)
    .single();

  if (leadErr || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // Pull a few recent activity log entries so the summary can reflect
  // the conversation arc ("called twice, left voicemail, texted quote").
  const { data: activity } = await supabase
    .from("activity_log")
    .select("type, summary, created_at")
    .eq("lead_id", lead.id)
    .order("created_at", { ascending: false })
    .limit(8);

  const facts: string[] = [];
  facts.push(`Name: ${lead.name}`);
  if (lead.service_needed) facts.push(`Service: ${lead.service_needed}`);
  if (lead.estimated_value_cents) {
    facts.push(
      `Estimated value: $${(lead.estimated_value_cents / 100).toFixed(0)}`,
    );
  }
  facts.push(`Status: ${lead.status}`);
  if (lead.source) facts.push(`Source: ${lead.source}`);
  if (lead.appointment_at) facts.push(`Appointment: ${lead.appointment_at}`);
  if (lead.tags && lead.tags.length) facts.push(`Tags: ${lead.tags.join(", ")}`);
  if (lead.notes) facts.push(`Notes: ${lead.notes}`);
  if (lead.answers && typeof lead.answers === "object") {
    const qa = Object.entries(lead.answers as Record<string, string>)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
    if (qa) facts.push(`Intake answers: ${qa}`);
  }
  if (activity && activity.length) {
    facts.push(
      `Recent activity: ${activity
        .map((a) => `${a.type}:${a.summary ?? ""}`.trim())
        .join(" | ")}`,
    );
  }
  // For CSV-imported leads, the rich source-of-truth data lives in
  // raw_import_data (the columns the contractor flagged as AI context
  // during the import wizard). Fold every non-empty key into the facts
  // block so Claude can write a meaningful one-liner even when the
  // canonical columns (service_needed, notes, etc.) are all null.
  if (lead.raw_import_data && typeof lead.raw_import_data === "object") {
    const entries = Object.entries(
      lead.raw_import_data as Record<string, string>,
    )
      .filter(([, v]) => typeof v === "string" && v.trim().length > 0)
      .slice(0, 20);
    if (entries.length > 0) {
      facts.push(
        `CSV context:\n${entries.map(([k, v]) => `  ${k}: ${v}`).join("\n")}`,
      );
    }
  }

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 120,
      system: [
        "You write one-line summaries of sales leads for a contractor's pipeline app.",
        "Audience: a busy contractor glancing at a phone screen. They need to know what this lead needs and what's next.",
        "Rules:",
        "- Output ONE sentence, max 110 characters.",
        "- No greetings, no preamble, no labels. Just the sentence.",
        "- Lead with the concrete job (e.g. 'Water heater replacement — wants a quote by Friday').",
        "- If there's urgency, a deadline, or a blocker, surface it.",
        "- No em dashes. No emojis. No hashtags.",
        "- If you don't have enough info, say what's known plainly (e.g. 'New inbound lead, no details yet.').",
      ].join("\n"),
      messages: [
        {
          role: "user",
          content: `Write the summary from these facts:\n${facts.join("\n")}`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const summary = (textBlock?.type === "text" ? textBlock.text : "")
      .trim()
      .replace(/^["']|["']$/g, "");

    if (!summary) {
      return NextResponse.json(
        { error: "Empty summary" },
        { status: 502 },
      );
    }

    const { error: updateErr } = await supabase
      .from("leads")
      .update({
        ai_summary: summary,
        ai_summary_generated_at: new Date().toISOString(),
      })
      .eq("id", lead.id);

    if (updateErr) {
      console.error("ai-summary update failed:", updateErr);
    }

    return NextResponse.json({ id: lead.id, ai_summary: summary });
  } catch (err) {
    console.error("ai-summary generation failed:", err);
    return NextResponse.json(
      { error: "Generation failed" },
      { status: 500 },
    );
  }
}
