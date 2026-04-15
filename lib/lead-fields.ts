/**
 * handled. — universal lead field catalog.
 *
 * A single source of truth for the structured fields the AI extractor can
 * populate on a lead. This catalog is deliberately universal across trades
 * (solar, roofing, HVAC, plumbing, electrical, etc.) so every business gets
 * the same 22-field schema without per-trade configuration.
 *
 * The catalog drives three things at runtime:
 *   1. The tool schema sent to Claude during note/status-advance extraction
 *      (`customFieldsToolSchema()` — each catalog entry becomes one property).
 *   2. Server-side validation + fill-empty-only apply in
 *      `applyExtractedCustomFields()` (never overwrites contractor-entered
 *      values, enforces types + enum values).
 *   3. The grouped, label-aware rendering of populated custom fields in the
 *      AI Details section of the contact detail modal.
 *
 * Storage: `leads.custom_fields jsonb`. Keys match `LeadFieldDef.key` exactly.
 * Currency fields are stored as WHOLE US DOLLARS (not cents) so the JSON
 * column is readable and debuggable; the label conveys units (e.g.
 * `relevant_recurring_bill_dollars`).
 *
 * Adding or changing a field: edit this file. No migration needed — the
 * column is JSONB and the UI only shows populated keys. Removing a field
 * hides it from the UI but does NOT delete data from existing leads.
 */

export type LeadFieldType =
  | "text"
  | "number"
  | "currency" // stored as whole dollars in custom_fields
  | "boolean"
  | "enum";

export type LeadFieldCategory =
  | "customer"
  | "property"
  | "project"
  | "financial"
  | "engagement";

export type LeadFieldValue = string | number | boolean;

export type LeadCustomFields = Record<string, LeadFieldValue>;

export type LeadFieldDef = {
  /** Stable snake_case DB key — do not rename casually. */
  key: string;
  /** Human-readable label for the UI (AI Details section). */
  label: string;
  type: LeadFieldType;
  /** Required for type='enum' — lowercase snake_case values. */
  enumValues?: readonly string[];
  /**
   * Prompt description sent to Claude as the tool-property description.
   * This is how the model learns what the field means — be specific and
   * concrete. Include an example value when useful.
   */
  description: string;
  category: LeadFieldCategory;
};

// ---------------------------------------------------------------------------
// THE CATALOG — 22 fields, universal across trades
// ---------------------------------------------------------------------------

export const LEAD_FIELD_CATALOG: readonly LeadFieldDef[] = [
  // ---- Customer (4) ----
  {
    key: "homeowner_status",
    label: "Homeowner status",
    type: "enum",
    enumValues: ["owner", "renter", "landlord", "unknown"],
    description:
      "Whether the customer owns, rents, or is a landlord for this property. Hard qualifier for trades that require property ownership. Only set if clearly stated.",
    category: "customer",
  },
  {
    key: "decision_maker_situation",
    label: "Decision maker",
    type: "enum",
    enumValues: ["sole", "needs_spouse", "needs_partner", "unknown"],
    description:
      "Whether the person on the line is the sole decision maker, or needs to loop in a spouse or business partner before buying. Only set if stated.",
    category: "customer",
  },
  {
    key: "household_income_range",
    label: "Household income range",
    type: "enum",
    enumValues: ["under_75k", "75_125k", "125_200k", "200k_plus", "unknown"],
    description:
      "Approximate household annual income in US dollars. Only set if the customer volunteered this — never guess from other signals.",
    category: "customer",
  },
  {
    key: "language_preference",
    label: "Language",
    type: "enum",
    enumValues: ["english", "spanish", "other"],
    description:
      "Preferred language for sales and service communication. Only set if clearly stated or strongly implied (e.g. Spanish-only intake).",
    category: "customer",
  },

  // ---- Property (4) ----
  {
    key: "property_type",
    label: "Property type",
    type: "enum",
    enumValues: [
      "single_family",
      "condo",
      "townhome",
      "mobile",
      "commercial",
      "rental",
      "unknown",
    ],
    description:
      "Type of building on the property. Condo/mobile often have install restrictions; commercial changes the whole sales process. Only set if clearly stated.",
    category: "property",
  },
  {
    key: "property_ownership_years",
    label: "Years at property",
    type: "number",
    description:
      "How many whole years the customer has owned or lived at this property. Stability signal.",
    category: "property",
  },
  {
    key: "property_square_footage",
    label: "Property sq ft",
    type: "number",
    description:
      "Approximate square footage of the building. Drives sizing for most trades. Whole number.",
    category: "property",
  },
  {
    key: "property_age_years",
    label: "Property age (years)",
    type: "number",
    description:
      "Approximate age of the building in years. Older properties often need more work to bring systems to code.",
    category: "property",
  },

  // ---- Project (6) ----
  {
    key: "job_scope_summary",
    label: "Job scope",
    type: "text",
    description:
      "One-line description of exactly what the customer needs done — more detailed than the top-level service. Example: 'Replace 40gal gas water heater and relocate to garage'. Only set if clearly stated.",
    category: "project",
  },
  {
    key: "project_driver",
    label: "Project driver",
    type: "enum",
    enumValues: [
      "emergency_breakdown",
      "upgrade",
      "routine_maintenance",
      "new_construction",
      "insurance_claim",
      "code_compliance",
      "other",
    ],
    description:
      "What's causing this project to happen right now. emergency_breakdown = something broke. upgrade = voluntary improvement. insurance_claim = storm damage / filed claim. Only set if clearly stated.",
    category: "project",
  },
  {
    key: "project_urgency",
    label: "Urgency",
    type: "enum",
    enumValues: [
      "emergency_today",
      "this_week",
      "this_month",
      "this_quarter",
      "exploring",
    ],
    description:
      "How soon the customer wants this work done. emergency_today = active leak / no heat / no power. exploring = no real timeline yet.",
    category: "project",
  },
  {
    key: "existing_equipment_notes",
    label: "Existing equipment",
    type: "text",
    description:
      "One short paragraph describing what's currently on the property that's relevant to this job — type, material, brand/model, approximate age, and condition all in one sentence. Example: '200A Square D panel, ~15y old, fair condition with corrosion on bus bars'. Only extract content that describes the EXISTING setup, not the proposed job.",
    category: "project",
  },
  {
    key: "primary_motivation",
    label: "Primary motivation",
    type: "enum",
    enumValues: [
      "save_money",
      "comfort",
      "safety_health",
      "aesthetic",
      "required",
      "peace_of_mind",
      "other",
    ],
    description:
      "The outcome the customer most cares about. Tailors the sales pitch. Only set if clearly stated.",
    category: "project",
  },
  {
    key: "relevant_recurring_bill_dollars",
    label: "Relevant monthly bill",
    type: "currency",
    description:
      "The monthly utility or recurring cost that's relevant to this trade's value prop — electric bill for solar, water bill for water softeners, heating cost for HVAC. Value is in WHOLE US DOLLARS (not cents). $320 is 320. NEVER set this for one-time costs, quotes, or contract values — those go on the top-level estimated_value_dollars field, not here. If the note says '$500/month bill', set this to 500.",
    category: "project",
  },

  // ---- Financial (4) ----
  {
    key: "estimated_budget_dollars",
    label: "Customer budget",
    type: "currency",
    description:
      "What the CUSTOMER says they can spend on the job, in WHOLE US DOLLARS (not cents). Distinct from the contractor's quote — this is the BUYER's stated budget. Only set if the customer clearly stated a budget figure.",
    category: "financial",
  },
  {
    key: "credit_score_range",
    label: "Credit score range",
    type: "enum",
    enumValues: [
      "under_600",
      "600_650",
      "650_700",
      "700_750",
      "750_plus",
      "unknown",
    ],
    description:
      "Approximate credit score bucket the customer volunteered. Only set if the customer told you — never infer from other signals.",
    category: "financial",
  },
  {
    key: "financing_preference",
    label: "Financing preference",
    type: "enum",
    enumValues: [
      "cash",
      "loan",
      "credit_card",
      "in_house",
      "insurance",
      "undecided",
    ],
    description:
      "How the customer plans to pay. 'in_house' = contractor financing. 'insurance' = filing a claim. Only set if clearly stated.",
    category: "financial",
  },
  {
    key: "prior_quotes_received",
    label: "Prior quotes",
    type: "enum",
    enumValues: ["none", "one", "multiple", "unknown"],
    description:
      "How many competing quotes the customer has already received from other contractors. Signals competitive pressure.",
    category: "financial",
  },

  // ---- Engagement (4) ----
  {
    key: "purchase_timeline_weeks",
    label: "Purchase timeline (weeks)",
    type: "number",
    description:
      "Approximate weeks until the customer plans to buy. 0 = ready now, 4 = about a month out, 12 = about a quarter out. Only set if clearly stated or strongly implied.",
    category: "engagement",
  },
  {
    key: "contact_preference",
    label: "Contact preference",
    type: "enum",
    enumValues: ["phone", "text", "email", "any"],
    description:
      "How the customer prefers to be contacted. Only set if clearly stated.",
    category: "engagement",
  },
  {
    key: "responsiveness_signal",
    label: "Responsiveness",
    type: "enum",
    enumValues: [
      "very_responsive",
      "responsive",
      "slow",
      "unresponsive",
      "unknown",
    ],
    description:
      "Based on observed communication: how quickly the customer replies to outreach. Only set if there's clear evidence in the activity log, not just one data point.",
    category: "engagement",
  },
  {
    key: "referral_relationship",
    label: "Referral relationship",
    type: "text",
    description:
      "Who sent this customer, in freeform. Example: 'Neighbor of the Johnsons on Oak Street' or 'Friend of Rep Mike'. Only set if clearly stated.",
    category: "engagement",
  },
] as const;

// ---------------------------------------------------------------------------
// Catalog helpers
// ---------------------------------------------------------------------------

/** Look up a field definition by key. Returns undefined if unknown. */
export function getLeadFieldDef(key: string): LeadFieldDef | undefined {
  return LEAD_FIELD_CATALOG.find((f) => f.key === key);
}

/**
 * Build the JSON Schema object sent to Claude as the `extracted.custom_fields`
 * tool property. Each catalog entry becomes one property with a per-type
 * schema and the prompt description verbatim.
 */
export function customFieldsToolSchema(): {
  type: "object";
  description: string;
  properties: Record<string, unknown>;
} {
  const properties: Record<string, unknown> = {};
  for (const field of LEAD_FIELD_CATALOG) {
    properties[field.key] = buildFieldSchema(field);
  }
  return {
    type: "object",
    description:
      "Structured per-lead fields extracted from free-text notes or activity. Only include a key if the note CLEARLY states that value — never guess, never infer from vague signals. Follow each field's description for the extraction rule. Omit this object entirely if nothing is clearly extractable.",
    properties,
  };
}

function buildFieldSchema(field: LeadFieldDef): Record<string, unknown> {
  const base = { description: field.description };
  switch (field.type) {
    case "text":
      return { type: "string", ...base };
    case "number":
    case "currency":
      return { type: "integer", ...base };
    case "boolean":
      return { type: "boolean", ...base };
    case "enum":
      return { type: "string", enum: field.enumValues ?? [], ...base };
  }
}

/**
 * Validate an AI-extracted custom_fields object against the catalog and
 * produce a fill-empty-only patch. Never overwrites existing values. Never
 * accepts values that don't match the catalog's type or enum constraints.
 *
 * Returns the patch (to apply to leads.custom_fields) and the list of
 * catalog labels that got filled (for the AI activity log entry).
 */
export function validateAndPatchCustomFields(
  current: LeadCustomFields | null,
  extracted: unknown,
): { patch: LeadCustomFields; filledLabels: string[] } {
  const patch: LeadCustomFields = {};
  const filledLabels: string[] = [];

  if (!extracted || typeof extracted !== "object" || Array.isArray(extracted)) {
    return { patch, filledLabels };
  }

  const extractedMap = extracted as Record<string, unknown>;
  const currentMap: LeadCustomFields = current ?? {};

  for (const field of LEAD_FIELD_CATALOG) {
    const raw = extractedMap[field.key];
    if (raw === undefined || raw === null) continue;

    // Fill-empty-only: never overwrite contractor-entered or previously-
    // extracted values. A previously-filled value is the source of truth.
    const existing = currentMap[field.key];
    if (existing !== undefined && existing !== null && existing !== "") {
      continue;
    }

    const validated = validateFieldValue(field, raw);
    if (validated === undefined) continue;

    patch[field.key] = validated;
    filledLabels.push(field.label);
  }

  return { patch, filledLabels };
}

function validateFieldValue(
  field: LeadFieldDef,
  value: unknown,
): LeadFieldValue | undefined {
  switch (field.type) {
    case "text": {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      // Cap length — a "short paragraph" shouldn't be a novel.
      return trimmed.slice(0, 400);
    }
    case "number": {
      const n = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(n)) return undefined;
      if (n < 0 || n > 1_000_000) return undefined;
      return Math.round(n);
    }
    case "currency": {
      // Stored as whole dollars in the custom_fields JSONB blob.
      // Same sanity range as the core estimated_value clamp: $50-$500k.
      const n = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(n)) return undefined;
      if (n < 0 || n > 500_000) return undefined;
      return Math.round(n);
    }
    case "boolean":
      return typeof value === "boolean" ? value : undefined;
    case "enum":
      if (typeof value !== "string") return undefined;
      return field.enumValues?.includes(value) ? value : undefined;
  }
}

/**
 * Pretty-print a raw custom_fields value for the UI. Handles currency
 * formatting, enum label casing, and boolean yes/no. Returns null if the
 * value is empty so the caller can skip rendering.
 */
export function formatCustomFieldValue(
  field: LeadFieldDef,
  value: LeadFieldValue | null | undefined,
): string | null {
  if (value == null || value === "") return null;
  switch (field.type) {
    case "text":
      return typeof value === "string" ? value : null;
    case "number": {
      const n = Number(value);
      if (!Number.isFinite(n)) return null;
      return n.toLocaleString("en-US");
    }
    case "currency": {
      const n = Number(value);
      if (!Number.isFinite(n)) return null;
      return n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });
    }
    case "boolean":
      return value ? "Yes" : "No";
    case "enum": {
      if (typeof value !== "string") return null;
      // Convert snake_case enum values to Title Case for display.
      // Special-cased for common money bands so "200k_plus" reads "$200k+".
      const money = value.match(
        /^(under_|)([0-9]+)(k)(_([0-9]+)(k)(_plus)?|_plus)?$/,
      );
      if (money) {
        if (value.startsWith("under_")) return `< $${money[2]}k`;
        if (value.endsWith("_plus")) return `$${money[2]}k+`;
        const m = value.match(/^([0-9]+)k_([0-9]+)k$/);
        if (m) return `$${m[1]}k – $${m[2]}k`;
      }
      return value
        .split("_")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(" ");
    }
  }
}

/** Category display labels + stable ordering for the AI Details section. */
export const LEAD_FIELD_CATEGORY_ORDER: readonly LeadFieldCategory[] = [
  "project",
  "property",
  "customer",
  "financial",
  "engagement",
];

export const LEAD_FIELD_CATEGORY_LABEL: Record<LeadFieldCategory, string> = {
  customer: "Customer",
  property: "Property",
  project: "Project",
  financial: "Financial",
  engagement: "Engagement",
};

/**
 * The 5 signals that get promoted to colored chips directly under the Lead
 * Profile narrative in the modal. Chosen because each one drives a visual
 * decision the contractor needs to make at a glance — emergency urgency
 * flags a red badge, renter flags an amber qualifier warning, etc.
 *
 * Every other populated field from the catalog still renders, just in the
 * quieter AI Details section below. This list is a DISPLAY curation, not
 * a capture limit — all 22 catalog fields are always available for
 * extraction.
 */
export const CHIP_SIGNAL_KEYS: readonly string[] = [
  "project_urgency",
  "homeowner_status",
  "project_driver",
  "purchase_timeline_weeks",
  "decision_maker_situation",
] as const;

/**
 * Lookup for chip styling per enum value. Missing keys / values fall back
 * to a neutral navy chip. Keeps the modal's rendering code dumb — it just
 * reads `chipStyleFor(fieldKey, value)` and gets a color token back.
 */
export type ChipTone = "red" | "amber" | "green" | "blue" | "navy" | "muted";

const CHIP_TONES: Record<string, Record<string, ChipTone>> = {
  project_urgency: {
    emergency_today: "red",
    this_week: "amber",
    this_month: "blue",
    this_quarter: "navy",
    exploring: "muted",
  },
  homeowner_status: {
    owner: "green",
    renter: "amber",
    landlord: "blue",
    unknown: "muted",
  },
  project_driver: {
    emergency_breakdown: "red",
    upgrade: "blue",
    routine_maintenance: "muted",
    new_construction: "blue",
    insurance_claim: "amber",
    code_compliance: "amber",
    other: "muted",
  },
  decision_maker_situation: {
    sole: "green",
    needs_spouse: "amber",
    needs_partner: "amber",
    unknown: "muted",
  },
};

export function chipToneFor(fieldKey: string, rawValue: LeadFieldValue): ChipTone {
  if (fieldKey === "purchase_timeline_weeks") {
    const n = typeof rawValue === "number" ? rawValue : Number(rawValue);
    if (!Number.isFinite(n)) return "muted";
    if (n <= 1) return "red";
    if (n <= 4) return "amber";
    if (n <= 12) return "blue";
    return "muted";
  }
  if (typeof rawValue !== "string") return "navy";
  return CHIP_TONES[fieldKey]?.[rawValue] ?? "navy";
}
