/**
 * handled. — AI lead summary generator + field extractor.
 *
 * Server-side only. Calls Claude Haiku to produce a one-line summary
 * of a lead that's tailored to the lead's current pipeline / post-sale
 * stage, caches it on `leads.ai_summary`, and *optionally* extracts
 * structured lead fields (service_needed, estimated_value_cents, tags)
 * from free-text notes / activity. The extraction is returned so the
 * caller can decide whether to apply it.
 *
 * Used by:
 *   - POST /api/contractor/customers/[id]/ai-summary — lazy on-demand
 *   - POST /api/contractor/customers/[id]/notes      — after a user note
 *   - PUT  /api/contractor/customers/[id]            — after a status change
 *
 * The result is always best-effort: if generation fails or there's no
 * API key, the helper logs and returns nulls so the caller can gracefully
 * continue without blocking its primary response.
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

/** Structured fields the model can optionally pull from free-text notes. */
export type ExtractedLeadFields = {
  service_needed?: string;
  estimated_value_cents?: number;
  tags?: string[];
};

/** Combined result returned by regenerateAiSummary. */
export type AiSummaryResult = {
  summary: string | null;
  extracted: ExtractedLeadFields | null;
};

/**
 * Resolve the stage a lead is currently in. Pipeline stage takes precedence
 * for pre-sale statuses; post-sale stage kicks in once the lead is a customer.
 */
function stageForLead(lead: LeadLike): StageKey | null {
  return postSaleStageFor(lead) ?? pipelineStageFor(lead);
}

/**
 * Assemble the facts block the model sees. The explicit labeled lines
 * (Name / Service / Estimated value / Tags / Status) double as the
 * "already captured" list — the extraction tool is told not to re-extract
 * anything already present here.
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
 * Regenerate the AI one-liner for a lead (and optionally extract structured
 * fields from free-text notes). Persists the summary to `leads.ai_summary`.
 * Safe to call from any server-side handler; always returns a result object
 * with nulls on failure. Never throws.
 */
export async function regenerateAiSummary({
  supabase,
  leadId,
  businessId,
}: {
  supabase: SupabaseClient;
  leadId: string;
  businessId: string;
}): Promise<AiSummaryResult> {
  const empty: AiSummaryResult = { summary: null, extracted: null };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[ai-summary] ANTHROPIC_API_KEY not set; skipping regenerate");
    return empty;
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
    return empty;
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
      max_tokens: 400,
      system: [
        "You write one-line summaries of sales leads for a contractor's pipeline app",
        "AND extract structured lead fields from free-text notes.",
        "",
        "Audience: a busy contractor glancing at a phone screen. They need to know",
        "what this lead needs and what's next.",
        "",
        "SUMMARY RULES:",
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
        "",
        "EXTRACTION RULES:",
        "- Only extract facts from free-text Notes or Recent activity lines in the facts block.",
        "- NEVER re-extract anything already listed in the explicit labeled lines at the top",
        "  (Name, Service, Estimated value, Tags, Status, Source, Appointment). Those are the",
        "  'already captured' fields — leave them alone.",
        "- If a free-text note clearly mentions a job type and the Service line is missing,",
        "  set `extracted.service_needed` (sentence case, short, e.g. 'Roof replacement').",
        "- If a free-text note clearly mentions a dollar value (like '$250 bill' or 'quoted 4500')",
        "  and the Estimated value line is missing, set `extracted.estimated_value_cents`",
        "  in US CENTS. $250 becomes 25000. $4500 becomes 450000.",
        "- If a free-text note mentions qualifications/attributes that would help filter later",
        "  (credit score, property type, roof orientation, urgency), include them in",
        "  `extracted.tags` as short lowercase strings (e.g. 'credit-700', 'south-facing').",
        "- If a fact is ambiguous or not clearly stated, DO NOT extract it. Guessing is worse",
        "  than leaving a field empty.",
        "- If there's nothing to extract, omit the `extracted` object entirely.",
        "",
        "Always call the `write_lead_summary` tool with your result.",
      ].join("\n"),
      tools: [
        {
          name: "write_lead_summary",
          description:
            "Write the one-line lead summary and optionally extract structured lead fields from free-text notes. Extraction is strictly fill-empty-only — never re-extract fields already listed in the explicit labeled lines at the top of the facts.",
          input_schema: {
            type: "object",
            required: ["summary"],
            properties: {
              summary: {
                type: "string",
                description:
                  "One-line lead summary, max 110 characters. Follow the SUMMARY RULES in the system prompt.",
              },
              extracted: {
                type: "object",
                description:
                  "Optional structured fields extracted from free-text notes / activity. Follow the EXTRACTION RULES in the system prompt. Omit this object entirely if nothing is clearly stated in free text.",
                properties: {
                  service_needed: {
                    type: "string",
                    description:
                      "Short sentence-case service name, e.g. 'Roof replacement', 'Water heater install'. Only set if the Service line is missing from the facts.",
                  },
                  estimated_value_cents: {
                    type: "integer",
                    description:
                      "Estimated job value in US cents. $250 -> 25000, $4500 -> 450000. Only set if the Estimated value line is missing from the facts.",
                  },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description:
                      "Short lowercase qualifying tags, e.g. ['credit-700', 'south-facing']. Additive — existing tags are preserved server-side.",
                  },
                },
              },
            },
          },
        },
      ],
      tool_choice: { type: "tool", name: "write_lead_summary" },
      messages: [
        {
          role: "user",
          content: `Write the summary and extract any new structured fields from these facts:\n${facts}`,
        },
      ],
    });

    const toolUse = message.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      console.warn("[ai-summary] model did not call the tool");
      return empty;
    }

    const input = (toolUse.input ?? {}) as {
      summary?: string;
      extracted?: ExtractedLeadFields;
    };
    const summary = (input.summary ?? "")
      .trim()
      .replace(/^["']|["']$/g, "");

    if (!summary) {
      console.warn("[ai-summary] empty summary from model");
      return { summary: null, extracted: input.extracted ?? null };
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

    return { summary, extracted: input.extracted ?? null };
  } catch (err) {
    console.error("[ai-summary] generation failed:", err);
    return empty;
  }
}

/**
 * Apply extracted fields to a lead — strictly fill-empty-only for scalar
 * fields, and additive-dedupe for `tags`. Never overwrites contractor-entered
 * data. Returns the patch that was applied (so the caller can mirror it into
 * the client-side lead state) and the list of filled field keys (so the
 * caller can log a human-readable "AI filled: service, value" activity).
 *
 * Returns null if nothing was applied (empty extraction, all fields already
 * filled, or the update failed).
 */
export async function applyExtractedFields({
  supabase,
  leadId,
  businessId,
  extracted,
}: {
  supabase: SupabaseClient;
  leadId: string;
  businessId: string;
  extracted: ExtractedLeadFields | null;
}): Promise<{ patch: Partial<Lead>; filledKeys: string[] } | null> {
  if (!extracted) return null;

  const { data: lead, error } = await supabase
    .from("leads")
    .select("service_needed, estimated_value_cents, tags")
    .eq("id", leadId)
    .eq("business_id", businessId)
    .single();
  if (error || !lead) return null;

  const updates: Record<string, unknown> = {};
  const patch: Partial<Lead> = {};
  const filled: string[] = [];

  // Service name — fill only if currently empty / whitespace.
  if (
    typeof extracted.service_needed === "string" &&
    extracted.service_needed.trim() &&
    (!lead.service_needed || !String(lead.service_needed).trim())
  ) {
    const val = extracted.service_needed.trim();
    updates.service_needed = val;
    patch.service_needed = val;
    filled.push("service");
  }

  // Estimated value — fill only if currently null / 0.
  if (
    typeof extracted.estimated_value_cents === "number" &&
    Number.isFinite(extracted.estimated_value_cents) &&
    extracted.estimated_value_cents > 0 &&
    (lead.estimated_value_cents == null || lead.estimated_value_cents === 0)
  ) {
    const cents = Math.round(extracted.estimated_value_cents);
    updates.estimated_value_cents = cents;
    patch.estimated_value_cents = cents;
    filled.push("value");
  }

  // Tags — additive merge, dedupe case-insensitively. Never overwrites.
  if (Array.isArray(extracted.tags) && extracted.tags.length > 0) {
    const existing: string[] = Array.isArray(lead.tags)
      ? (lead.tags as string[])
      : [];
    const normalize = (t: string) => t.trim().toLowerCase();
    const existingKeys = new Set(existing.map(normalize));
    const newTags = extracted.tags
      .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
      .map((t) => t.trim())
      .filter((t) => !existingKeys.has(normalize(t)));
    if (newTags.length > 0) {
      const merged = [...existing, ...newTags];
      updates.tags = merged;
      patch.tags = merged;
      filled.push("tags");
    }
  }

  if (Object.keys(updates).length === 0) return null;

  const { error: updateErr } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", leadId);
  if (updateErr) {
    console.error("[ai-extract] update failed:", updateErr.message);
    return null;
  }

  return { patch, filledKeys: filled };
}

/**
 * Human-readable summary of which fields the AI filled, for the activity_log
 * entry that gets inserted alongside the lead update. "AI filled: service,
 * value" reads clean in the What Happened timeline.
 */
export function formatFilledKeys(keys: string[]): string {
  if (keys.length === 0) return "";
  const labels: Record<string, string> = {
    service: "service",
    value: "value",
    tags: "tags",
  };
  const pretty = keys.map((k) => labels[k] ?? k);
  return `AI filled: ${pretty.join(", ")}`;
}
