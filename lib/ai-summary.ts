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
import {
  LEAD_FIELD_CATALOG,
  customFieldsToolSchema,
  validateAndPatchCustomFields,
  type LeadCustomFields,
} from "@/lib/lead-fields";

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
  /**
   * One-time job value in US DOLLARS (not cents). The model is bad at unit
   * conversions, so we ask it for dollars and multiply by 100 server-side
   * in `applyExtractedFields`. Must be a one-time contract value, NOT a
   * recurring bill / monthly cost / annual subscription — see the
   * EXTRACTION RULES in the system prompt.
   */
  estimated_value_dollars?: number;
  tags?: string[];
  /**
   * Universal catalog-driven custom fields. Keys must match the
   * LEAD_FIELD_CATALOG in lib/lead-fields.ts. Fill-empty-only is enforced
   * server-side in applyExtractedFields + validateAndPatchCustomFields.
   */
  custom_fields?: Record<string, unknown>;
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
  // Echo already-populated custom fields back to the model as "already
  // captured" — the extractor is told not to re-extract anything here,
  // so this doubles as a fill-empty-only hint at the prompt layer (the
  // server-side validator enforces it regardless).
  const custom = lead.custom_fields ?? null;
  if (custom && typeof custom === "object") {
    const lines: string[] = [];
    for (const field of LEAD_FIELD_CATALOG) {
      const v = (custom as Record<string, unknown>)[field.key];
      if (v === undefined || v === null || v === "") continue;
      lines.push(`  ${field.label}: ${String(v)}`);
    }
    if (lines.length > 0) {
      facts.push(`Already-captured custom fields (DO NOT re-extract):\n${lines.join("\n")}`);
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
        "",
        "ESTIMATED VALUE — read this carefully, this field is tricky:",
        "- `estimated_value_dollars` is the ONE-TIME contract / job value the contractor will",
        "  bill the customer for the work. Dollars, not cents — $250 is `250`, $4500 is `4500`.",
        "- Only set it if the note states a ONE-TIME job quote / estimate / contract amount",
        "  (e.g. 'quoted 4500', 'bid $12k', 'contract total 8200', 'estimate of $250').",
        "- DO NOT extract recurring / periodic amounts. If the note says '$500/month', 'per month',",
        "  'monthly bill', '$X/yr', 'annually', '/mo', 'subscription', 'maintenance plan', the value",
        "  is NOT a job value. Leave `estimated_value_dollars` unset.",
        "- DO NOT extract the customer's utility bills, energy bills, power bills, water bills,",
        "  rent, mortgage, or any cost the customer PAYS to someone else. Those describe the",
        "  customer's situation (useful for sizing a solar install, for example) but they are NOT",
        "  the contractor's job value. Put them in `tags` instead (e.g. 'power-bill-500-mo').",
        "- If a value is ambiguous about one-time vs recurring, DO NOT extract it. Leave it empty.",
        "",
        "TAGS:",
        "- Tags are the escape valve for trade-specific attributes that don't fit a custom field.",
        "- Short lowercase kebab-case strings: 'south-facing', 'copper-pipes', 'panel-200a'.",
        "- Do NOT put anything in tags that belongs in a catalog custom field (see below).",
        "",
        "CUSTOM FIELDS (catalog-driven structured data):",
        "- The `extracted.custom_fields` object holds universal structured lead data. Each",
        "  property maps to a catalog entry with a specific type and a specific meaning —",
        "  read each property's description carefully and only populate it when the note",
        "  CLEARLY states that exact piece of information.",
        "- Fill-empty-only: never populate a field that appears in the 'Already-captured",
        "  custom fields' section of the facts. Those values are locked in.",
        "- Enum fields MUST use one of the allowed enum values verbatim — never invent new",
        "  values, never paraphrase, never translate.",
        "- Currency fields are in WHOLE US DOLLARS (not cents). $320 is `320`, $4500 is `4500`.",
        "- Number fields are whole numbers. No ranges, no estimates with plus-or-minus.",
        "- `existing_equipment_notes` is a free-text short paragraph about what's physically",
        "  on the property now (type + material + age + condition). Do NOT put the proposed",
        "  job scope there — that goes in `job_scope_summary` or stays out.",
        "- If there's no clearly-stated value for a field, leave it out. Omit the whole",
        "  `custom_fields` object if nothing is clearly extractable.",
        "",
        "- If a fact is ambiguous or not clearly stated, DO NOT extract it. Guessing is worse",
        "  than leaving a field empty.",
        "- If there's nothing to extract at all, omit the `extracted` object entirely.",
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
                  estimated_value_dollars: {
                    type: "integer",
                    description:
                      "One-time contract / job value in US DOLLARS (not cents). $250 -> 250, $4500 -> 4500. ONLY set this if the note clearly states a one-time job quote / estimate / contract total. NEVER extract recurring amounts like '$500/month', 'per month', 'monthly bill', utility / power / water / energy bills, subscriptions, or maintenance plans — those describe the customer's situation, not the contractor's job value. When in doubt, leave empty and put context in `tags` instead.",
                  },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description:
                      "Short lowercase qualifying tags, e.g. ['credit-700', 'south-facing']. Additive — existing tags are preserved server-side. Do NOT use tags for anything that fits a catalog custom field below.",
                  },
                  custom_fields: customFieldsToolSchema(),
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
    .select("service_needed, estimated_value_cents, tags, custom_fields")
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

  // Estimated value — fill only if currently null / 0. The model returns
  // whole US dollars (it's bad at cents math); we convert to cents server-
  // side so there's no way a unit mistake like "$500 -> 500000 cents"
  // survives. We also clamp to a sanity range: < $50 is almost certainly
  // noise; > $500k is almost certainly a hallucinated figure or the model
  // re-doing the cents math anyway. Values outside the range are dropped.
  if (
    typeof extracted.estimated_value_dollars === "number" &&
    Number.isFinite(extracted.estimated_value_dollars) &&
    extracted.estimated_value_dollars >= 50 &&
    extracted.estimated_value_dollars <= 500000 &&
    (lead.estimated_value_cents == null || lead.estimated_value_cents === 0)
  ) {
    const cents = Math.round(extracted.estimated_value_dollars * 100);
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

  // Catalog-driven custom fields — fill-empty-only, per-field type/enum
  // validation. The validator returns only the keys that passed, so this
  // is safe to merge into the existing blob.
  const currentCustom: LeadCustomFields | null =
    lead.custom_fields && typeof lead.custom_fields === "object"
      ? (lead.custom_fields as LeadCustomFields)
      : null;
  const { patch: customPatch, filledLabels } = validateAndPatchCustomFields(
    currentCustom,
    extracted.custom_fields,
  );
  if (filledLabels.length > 0) {
    const merged: LeadCustomFields = { ...(currentCustom ?? {}), ...customPatch };
    updates.custom_fields = merged;
    patch.custom_fields = merged;
    // Surface the human-readable labels in the filled list so the activity
    // log reads as "AI filled: Homeowner status, Project urgency" instead of
    // "AI filled: homeowner_status, project_urgency".
    for (const label of filledLabels) filled.push(label);
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
 * entry that gets inserted alongside the lead update. Mixes hardcoded core
 * keys ("service" / "value" / "tags") and pretty catalog labels
 * ("Homeowner status", "Project urgency") — the apply function pushes both
 * onto the same list in the order they were filled.
 */
export function formatFilledKeys(keys: string[]): string {
  if (keys.length === 0) return "";
  const coreLabels: Record<string, string> = {
    service: "service",
    value: "value",
    tags: "tags",
  };
  const pretty = keys.map((k) => coreLabels[k] ?? k);
  return `AI filled: ${pretty.join(", ")}`;
}
