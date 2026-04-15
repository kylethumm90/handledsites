/**
 * handled. — AI lead summary generator.
 *
 * Server-side only. Calls Claude Haiku to produce a one-line summary
 * of a lead that's tailored to the lead's current pipeline / post-sale
 * stage, caches it on `leads.ai_summary`, and returns the summary.
 *
 * Used by:
 *   - POST /api/contractor/customers/[id]/ai-summary — lazy on-demand
 *   - POST /api/contractor/customers/[id]/notes      — after a user note is added
 *   - PUT  /api/contractor/customers/[id]            — after a status change
 *
 * The result is always best-effort: if generation fails or there's no
 * API key, the helper logs and returns `null` so the caller can
 * gracefully continue without blocking its primary response.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { pipelineStageFor, postSaleStageFor } from "@/lib/pipeline-v2";
import type { Lead } from "@/lib/supabase";
import type { StageKey } from "@/lib/design-system";

const MODEL = "claude-haiku-4-5-20251001";

/**
 * What to tell Claude about the stage the lead is in. Keeps the one-liner
 * focused on the contractor's *next move*, not the entire lead history.
 * Every hint ends with a concrete action the summary should point at.
 */
const STAGE_PROMPT: Record<StageKey, string> = {
  new: "Stage: NEW (fresh lead, no outreach yet). Lead with what they want and why the contractor should respond right now. Speed to lead matters most.",
  contacted:
    "Stage: CONTACTED (reached out, not booked). Lead with where the conversation left off and what the contractor should do next to close the gap.",
  appt_set:
    "Stage: APPT SET (appointment on the calendar). Lead with the appointment time and what the contractor needs to do to show up ready. Mention confirmation if day-of.",
  job_done:
    "Stage: JOB DONE (work completed, no review yet). Lead with the completed job and point toward asking for feedback / a review. The next move is reputation, not sales.",
  recovery:
    "Stage: RECOVERY (unhappy customer flagged by sentiment). Lead with what went wrong and how urgent outreach is. The next move is damage control.",
  feedback:
    "Stage: FEEDBACK (job done, ready for a feedback request). Lead with the completed job and remind the contractor to send a feedback ask.",
  reviewed:
    "Stage: REVIEWED (customer left a public review). Lead with the review content or rating and point toward asking for a referral.",
  referrer:
    "Stage: REFERRER (opted in as a referral partner). Lead with how many referrals they've sent or could send and the contractor's next move to keep them active.",
};

type LeadLike = Lead & {
  // Columns the ai-summary facts block references that are either on the
  // base Lead type or optional denormalized columns.
  raw_import_data?: Record<string, string> | null;
};

/**
 * Resolve the stage a lead is currently in. Pipeline stage takes precedence
 * for pre-sale statuses; post-sale stage kicks in once the lead is a customer.
 */
function stageForLead(lead: LeadLike): StageKey | null {
  return postSaleStageFor(lead) ?? pipelineStageFor(lead);
}

/**
 * Assemble the facts block the model sees. Same shape as the original
 * ai-summary route so existing prompts and tests stay consistent.
 */
function buildFactsBlock(
  lead: LeadLike,
  activity: Array<{ type: string; summary: string | null; created_at: string }>,
): string {
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
  if (lead.tags && lead.tags.length) {
    facts.push(`Tags: ${lead.tags.join(", ")}`);
  }
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
  return facts.join("\n");
}

/**
 * Regenerate the AI one-liner for a lead and persist it. Safe to call from
 * any server-side handler; always returns either the new summary string or
 * null on failure. Never throws.
 */
export async function regenerateAiSummary({
  supabase,
  leadId,
  businessId,
}: {
  supabase: SupabaseClient;
  leadId: string;
  businessId: string;
}): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[ai-summary] ANTHROPIC_API_KEY not set; skipping regenerate");
    return null;
  }

  // Verify the lead belongs to the caller's business and pull everything
  // we need for the facts block in one round trip.
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .eq("business_id", businessId)
    .single();
  if (leadErr || !lead) {
    console.warn("[ai-summary] lead not found for regenerate", {
      leadId,
      businessId,
      err: leadErr?.message,
    });
    return null;
  }

  const typedLead = lead as LeadLike;

  const { data: activity } = await supabase
    .from("activity_log")
    .select("type, summary, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(8);

  const stage = stageForLead(typedLead);
  const stageHint =
    stage && STAGE_PROMPT[stage]
      ? STAGE_PROMPT[stage]
      : "Stage: unknown. Lead with whatever's most actionable.";

  const facts = buildFactsBlock(typedLead, activity ?? []);

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
        "",
        "Tailor the sentence to the lead's current stage. The next move the contractor",
        "should take depends entirely on where the lead is in the funnel:",
        stageHint,
      ].join("\n"),
      messages: [
        {
          role: "user",
          content: `Write the summary from these facts:\n${facts}`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const summary = (textBlock?.type === "text" ? textBlock.text : "")
      .trim()
      .replace(/^["']|["']$/g, "");

    if (!summary) {
      console.warn("[ai-summary] empty summary from model");
      return null;
    }

    const { error: updateErr } = await supabase
      .from("leads")
      .update({
        ai_summary: summary,
        ai_summary_generated_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    if (updateErr) {
      console.error("[ai-summary] update failed:", updateErr.message);
      // Still return the summary so the caller can at least surface it.
    }

    return summary;
  } catch (err) {
    console.error("[ai-summary] generation failed:", err);
    return null;
  }
}
