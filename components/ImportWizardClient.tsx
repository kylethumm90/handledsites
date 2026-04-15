"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Papa from "papaparse";

// ──────────────────────────────────────────────────────────────
// Color constants — matches the hex palette used across
// CustomerDetailClient / CustomersClient / the auth layout.
// ──────────────────────────────────────────────────────────────
const INK = "#1F2937";
const INK_SOFT = "#374151";
const MUTED = "#6B7280";
const MUTED_LIGHT = "#9CA3AF";
const HAIRLINE = "#E5E7EB";
const HAIRLINE_LIGHT = "#F3F4F6";
const SURFACE = "#FFFFFF";
const PAGE_TINT = "#FAFAFB";
const BLUE = "#2F6FED";
const GREEN = "#2E7D32";
const AMBER = "#E0A800";
const DANGER = "#B91C1C";
const DANGER_BG = "#FEF2F2";
const DANGER_BORDER = "#FECACA";

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif";
const MONO_STACK =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Cascadia Mono', 'Segoe UI Mono', monospace";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3;

// Spec's UI-facing field choices. Some of these (address_line1, city,
// state, zip, assigned_to) don't exist on the leads table — on
// execute we'll route those headers into aiContextFields (raw_import_data)
// instead of sending them as backend column mappings.
type UIField =
  | "first_name"
  | "last_name"
  | "email"
  | "phone"
  | "address_line1"
  | "city"
  | "state"
  | "zip"
  | "tags"
  | "lead_source"
  | "assigned_to";

const UI_FIELDS: { value: UIField; label: string }[] = [
  { value: "first_name", label: "First name" },
  { value: "last_name", label: "Last name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "address_line1", label: "Address" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "zip", label: "ZIP" },
  { value: "tags", label: "Tags" },
  { value: "lead_source", label: "Lead source" },
  { value: "assigned_to", label: "Assigned to" },
];

type ColumnStat = {
  header: string;
  filled: number;
  total: number;
  samples: string[];
};

type ParseResult = {
  filename: string;
  headers: string[];
  columnStats: ColumnStat[];
  totalRows: number;
  previewRows: Record<string, string>[];
  rows: Record<string, string>[];
};

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_ROWS = 50000;

// Auto-suggest patterns for column → UI field matching.
const SUGGEST_PATTERNS: { field: UIField; patterns: RegExp[] }[] = [
  {
    field: "first_name",
    patterns: [/^first[\s_-]?name$/i, /^fname$/i, /^given[\s_-]?name$/i],
  },
  {
    field: "last_name",
    patterns: [
      /^last[\s_-]?name$/i,
      /^lname$/i,
      /^surname$/i,
      /^family[\s_-]?name$/i,
    ],
  },
  { field: "email", patterns: [/email/i, /^e[\s_-]?mail$/i] },
  {
    field: "phone",
    patterns: [/phone/i, /mobile/i, /^cell/i, /\btel(ephone)?\b/i],
  },
  {
    field: "address_line1",
    patterns: [/^address(\s*line)?\s*1?$/i, /street/i, /^addr1?$/i],
  },
  { field: "city", patterns: [/^city$/i, /^town$/i, /^municipality$/i] },
  { field: "state", patterns: [/^state$/i, /^region$/i, /^province$/i] },
  {
    field: "zip",
    patterns: [/^zip([\s_-]?code)?$/i, /^postal([\s_-]?code)?$/i, /^postcode$/i],
  },
  { field: "tags", patterns: [/^tags?$/i, /^labels?$/i, /^categor(y|ies)$/i] },
  {
    field: "lead_source",
    patterns: [/source/i, /^channel$/i, /^medium$/i, /^origin$/i],
  },
  {
    field: "assigned_to",
    patterns: [/^assigned([\s_-]?to)?$/i, /^owner$/i, /^rep$/i, /^agent$/i],
  },
];

function suggestField(header: string): UIField | null {
  for (const { field, patterns } of SUGGEST_PATTERNS) {
    if (patterns.some((re) => re.test(header))) return field;
  }
  return null;
}

function autoMap(stats: ColumnStat[]): Record<string, UIField | null> {
  const out: Record<string, UIField | null> = {};
  const claimed = new Set<UIField>();
  for (const s of stats) {
    if (s.filled === 0) {
      out[s.header] = null;
      continue;
    }
    const suggested = suggestField(s.header);
    if (suggested && !claimed.has(suggested)) {
      claimed.add(suggested);
      out[s.header] = suggested;
    } else {
      out[s.header] = null;
    }
  }
  return out;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// ──────────────────────────────────────────────────────────────
// Step indicator
// ──────────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: Step }) {
  const steps: { n: Step; label: string }[] = [
    { n: 1, label: "Upload" },
    { n: 2, label: "AI context" },
    { n: 3, label: "Review" },
  ];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        marginBottom: 28,
      }}
    >
      {steps.map((s, i) => {
        const isActive = s.n === step;
        const isDone = s.n < step;
        const circleBg = isDone ? INK : isActive ? INK : SURFACE;
        const circleBorder = isDone || isActive ? INK : HAIRLINE;
        const circleColor = isDone || isActive ? SURFACE : MUTED_LIGHT;
        const labelColor = isDone || isActive ? INK : MUTED_LIGHT;
        return (
          <div
            key={s.n}
            style={{ display: "flex", alignItems: "center", flex: i === 2 ? "0 0 auto" : 1 }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  background: circleBg,
                  border: `1.5px solid ${circleBorder}`,
                  color: circleColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  transition: "all 0.2s ease",
                }}
              >
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={SURFACE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  s.n
                )}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: labelColor, letterSpacing: "0.02em" }}>
                {s.label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: s.n < step ? INK : HAIRLINE,
                  marginTop: -18,
                  marginLeft: 8,
                  marginRight: 8,
                  minWidth: 40,
                  transition: "background 0.2s ease",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Step 1 — Upload zone
// ──────────────────────────────────────────────────────────────
function DropZone({
  onFile,
  disabled,
}: {
  onFile: (file: File) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onFile(files[0]);
  };

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        if (disabled) return;
        handleFiles(e.dataTransfer.files);
      }}
      style={{
        border: `1.5px dashed ${hover ? INK : HAIRLINE}`,
        background: hover ? HAIRLINE_LIGHT : SURFACE,
        borderRadius: 12,
        padding: "48px 24px",
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "all 0.15s ease",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          background: HAIRLINE_LIGHT,
          margin: "0 auto 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: INK, marginBottom: 4 }}>
        Drop your CSV here
      </div>
      <div style={{ fontSize: 13, color: MUTED }}>
        or click to choose a file. Up to 10 MB / 50,000 rows.
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Step 1 — Column card
// ──────────────────────────────────────────────────────────────
function ColumnCard({
  stat,
  mapped,
  onChange,
  takenByOther,
}: {
  stat: ColumnStat;
  mapped: UIField | null;
  onChange: (field: UIField | null) => void;
  takenByOther: Set<UIField>;
}) {
  const pct = stat.total > 0 ? stat.filled / stat.total : 0;
  const fillColor = pct > 0.9 ? GREEN : pct > 0.5 ? AMBER : MUTED_LIGHT;
  return (
    <div
      style={{
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 10,
        padding: 14,
        background: SURFACE,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div
          style={{
            fontFamily: MONO_STACK,
            fontSize: 13,
            fontWeight: 600,
            color: INK,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={stat.header}
        >
          {stat.header}
        </div>
        <div
          style={{
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 700,
            color: fillColor,
            background: HAIRLINE_LIGHT,
            padding: "3px 8px",
            borderRadius: 10,
            letterSpacing: "0.02em",
          }}
        >
          {stat.filled}/{stat.total} filled
        </div>
      </div>

      {stat.samples.length > 0 && (
        <div
          style={{
            fontSize: 12,
            color: MUTED,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={stat.samples.join(" · ")}
        >
          e.g. {stat.samples.slice(0, 2).join(" · ")}
        </div>
      )}

      <select
        value={mapped ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : (e.target.value as UIField))}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          width: "100%",
          padding: "9px 30px 9px 12px",
          border: `1px solid ${HAIRLINE}`,
          borderRadius: 8,
          fontSize: 13,
          color: mapped ? INK : MUTED,
          background: `${SURFACE} url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%236B7280' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>") no-repeat right 12px center`,
          fontFamily: FONT_STACK,
          cursor: "pointer",
        }}
      >
        <option value="">— Skip —</option>
        {UI_FIELDS.map((f) => (
          <option key={f.value} value={f.value} disabled={takenByOther.has(f.value) && mapped !== f.value}>
            {f.label}
            {takenByOther.has(f.value) && mapped !== f.value ? " (taken)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────
export default function ImportWizardClient() {
  const [step, setStep] = useState<Step>(1);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [mappings, setMappings] = useState<Record<string, UIField | null>>({});

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    if (!/\.csv$/i.test(file.name) && !file.type.toLowerCase().includes("csv")) {
      setError("File must be a CSV.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`File is too large (${formatBytes(file.size)}). Max is 10 MB.`);
      return;
    }

    setUploading(true);
    try {
      // 1. Parse client-side so we can send a structured row array up
      //    to the execute route without re-uploading the raw file.
      const text = await file.text();
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: (h) => h.trim().replace(/^\uFEFF/, ""),
      });
      if (parsed.errors && parsed.errors.length > 0) {
        const first = parsed.errors[0];
        setError(`CSV parse error: ${first.message}`);
        setUploading(false);
        return;
      }
      const rows = (parsed.data ?? []).filter((r) =>
        Object.values(r).some((v) => typeof v === "string" && v.trim().length > 0)
      );
      if (rows.length === 0) {
        setError("CSV is empty.");
        setUploading(false);
        return;
      }
      if (rows.length > MAX_ROWS) {
        setError(`Too many rows (${rows.length.toLocaleString()}). Max is 50,000.`);
        setUploading(false);
        return;
      }

      // 2. Round-trip the file to the server parser so column stats
      //    are computed the same way the backend will see them.
      const form = new FormData();
      form.append("file", file);
      const resp = await fetch("/api/contractor/import/parse", {
        method: "POST",
        body: form,
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        setError(body?.error || `Upload failed (${resp.status})`);
        setUploading(false);
        return;
      }
      const data = (await resp.json()) as Omit<ParseResult, "rows">;

      const result: ParseResult = { ...data, rows };
      setParseResult(result);
      setMappings(autoMap(result.columnStats));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read CSV.");
    } finally {
      setUploading(false);
    }
  }, []);

  // Which fields are already claimed (so the dropdown can mark them taken).
  const takenFields = useMemo(() => {
    const set = new Set<UIField>();
    for (const v of Object.values(mappings)) if (v) set.add(v);
    return set;
  }, [mappings]);

  // Non-empty columns only — empty columns don't need mapping.
  const mappingColumns = useMemo(
    () => (parseResult?.columnStats ?? []).filter((c) => c.filled > 0),
    [parseResult]
  );

  const hasName = takenFields.has("first_name") || takenFields.has("last_name");
  const hasContact = takenFields.has("email") || takenFields.has("phone");
  const canAdvance = Boolean(parseResult) && hasName && hasContact;

  const resetFile = () => {
    setParseResult(null);
    setMappings({});
    setError(null);
  };

  return (
    <div style={{ fontFamily: FONT_STACK, color: INK }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: INK, letterSpacing: "-0.03em" }}>
          Import contacts
        </div>
      </div>

      <StepIndicator step={step} />

      {/* Step content */}
      {step === 1 && (
        <div>
          {!parseResult ? (
            <>
              <DropZone onFile={handleFile} disabled={uploading} />
              {uploading && (
                <div style={{ marginTop: 14, fontSize: 13, color: MUTED, textAlign: "center" }}>
                  Reading file…
                </div>
              )}
              {error && (
                <div
                  style={{
                    marginTop: 14,
                    padding: "10px 14px",
                    background: DANGER_BG,
                    border: `1px solid ${DANGER_BORDER}`,
                    borderRadius: 10,
                    color: DANGER,
                    fontSize: 13,
                    lineHeight: 1.4,
                  }}
                >
                  {error}
                </div>
              )}
            </>
          ) : (
            <>
              {/* File summary */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: SURFACE,
                  border: `1px solid ${HAIRLINE}`,
                  borderRadius: 10,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: HAIRLINE_LIGHT,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: INK,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {parseResult.filename}
                    </div>
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                      {parseResult.totalRows.toLocaleString()} rows · {parseResult.headers.length} columns
                    </div>
                  </div>
                </div>
                <button
                  onClick={resetFile}
                  style={{
                    background: "transparent",
                    border: `1px solid ${HAIRLINE}`,
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: MUTED,
                    cursor: "pointer",
                    fontFamily: FONT_STACK,
                  }}
                >
                  Replace
                </button>
              </div>

              {/* Mapping instructions */}
              <div style={{ fontSize: 13, color: MUTED, marginBottom: 12, lineHeight: 1.5 }}>
                Map each column to a contact field, or skip it. You'll pick AI context
                columns in the next step.
              </div>

              {/* Column cards grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                {mappingColumns.map((stat) => (
                  <ColumnCard
                    key={stat.header}
                    stat={stat}
                    mapped={mappings[stat.header] ?? null}
                    takenByOther={takenFields}
                    onChange={(field) =>
                      setMappings((prev) => ({ ...prev, [stat.header]: field }))
                    }
                  />
                ))}
              </div>

              {/* Validation hint */}
              {!canAdvance && (
                <div
                  style={{
                    fontSize: 12,
                    color: MUTED,
                    background: HAIRLINE_LIGHT,
                    border: `1px solid ${HAIRLINE}`,
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginBottom: 16,
                    lineHeight: 1.5,
                  }}
                >
                  Map at least a name column (first or last) and one contact method
                  (email or phone) to continue.
                </div>
              )}

              {/* Footer buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  disabled={!canAdvance}
                  onClick={() => setStep(2)}
                  style={{
                    background: canAdvance ? INK : HAIRLINE,
                    color: canAdvance ? SURFACE : MUTED_LIGHT,
                    border: "none",
                    borderRadius: 8,
                    padding: "11px 22px",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: canAdvance ? "pointer" : "not-allowed",
                    fontFamily: FONT_STACK,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div
          style={{
            padding: 48,
            background: SURFACE,
            border: `1px dashed ${HAIRLINE}`,
            borderRadius: 12,
            textAlign: "center",
            color: MUTED,
            fontSize: 14,
          }}
        >
          Step 2 — AI context selection (coming next)
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => setStep(1)}
              style={{
                background: "transparent",
                border: `1px solid ${HAIRLINE}`,
                color: INK,
                borderRadius: 8,
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: FONT_STACK,
              }}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div
          style={{
            padding: 48,
            background: SURFACE,
            border: `1px dashed ${HAIRLINE}`,
            borderRadius: 12,
            textAlign: "center",
            color: MUTED,
            fontSize: 14,
          }}
        >
          Step 3 — Review &amp; import (coming next)
        </div>
      )}

      {/* Suppress the unused-var warning on PAGE_TINT while it's only
          referenced inside the JSX tree below — it's here to keep the
          constant list complete for later steps. */}
      <span style={{ display: "none", color: PAGE_TINT }} />
    </div>
  );
}
