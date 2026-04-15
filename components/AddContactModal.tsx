"use client";

// Extracted from the former CustomersClient.tsx so the Pipeline redesign
// can keep the single-contact + CSV import flow without dragging the
// entire legacy list view along. Logic is unchanged — only the pipeline
// status union widened to include "contacted".

import { useState } from "react";
import type { Lead } from "@/lib/supabase";
import { TRADE_SERVICES, Trade } from "@/lib/constants";
import { X } from "lucide-react";

type PipelineStatus = "lead" | "contacted" | "booked" | "customer";

type ParsedContact = {
  name: string;
  phone: string;
  email: string;
  service_needed: string;
  notes: string;
  // Raw status string from the CSV (pre-normalization). Empty when no
  // status column is mapped; the view falls back to `defaultStatus` in
  // that case.
  status: string;
};

// =============================================================================
// CSV parser (minimal RFC 4180 — handles quoted fields, escaped quotes, CRLF)
// =============================================================================
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((col) => col.trim() !== ""));
}

const HEADER_ALIASES: Record<keyof ParsedContact, string[]> = {
  name: ["name", "fullname", "firstname", "contactname", "customername", "clientname"],
  phone: ["phone", "phonenumber", "mobile", "cell", "tel", "telephone"],
  email: ["email", "emailaddress", "mail"],
  service_needed: ["service", "serviceneeded", "job", "jobtype", "work"],
  notes: ["notes", "comments", "memo", "remarks"],
  status: ["status", "stage", "pipeline", "leadstatus", "customerstatus", "type"],
};

// Map a raw status cell value to one of our four pipeline statuses.
// Returns null when the value is blank or doesn't match anything we
// recognize, so callers can fall back to the user's default selection.
function normalizePipelineStatus(raw: string): PipelineStatus | null {
  const v = raw.toLowerCase().replace(/[^a-z]/g, "");
  if (!v) return null;
  if (["lead", "leads", "new", "prospect", "prospects", "inquiry", "open"].includes(v))
    return "lead";
  if (["contacted", "contact", "reached", "responded", "reply", "replied", "qualifying"].includes(v))
    return "contacted";
  if (["booked", "scheduled", "appointment", "appt", "confirmed", "pending"].includes(v))
    return "booked";
  if (
    [
      "customer",
      "customers",
      "client",
      "clients",
      "sold",
      "closed",
      "closedwon",
      "won",
      "active",
      "paid",
      "complete",
      "completed",
      "done",
    ].includes(v)
  )
    return "customer";
  return null;
}

function normalizeHeader(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function autoMapHeaders(headerRow: string[]): Record<keyof ParsedContact, number> {
  const normalized = headerRow.map(normalizeHeader);
  const mapping: Record<keyof ParsedContact, number> = {
    name: -1,
    phone: -1,
    email: -1,
    service_needed: -1,
    notes: -1,
    status: -1,
  };
  (Object.keys(HEADER_ALIASES) as (keyof ParsedContact)[]).forEach((field) => {
    const aliases = HEADER_ALIASES[field];
    const idx = normalized.findIndex((h) => aliases.includes(h));
    mapping[field] = idx;
  });
  return mapping;
}

const FIELD_DEFS: { key: keyof ParsedContact; label: string; required: boolean }[] = [
  { key: "name", label: "Name", required: true },
  { key: "phone", label: "Phone", required: false },
  { key: "email", label: "Email", required: false },
  { key: "service_needed", label: "Service", required: false },
  { key: "notes", label: "Notes", required: false },
  { key: "status", label: "Status", required: false },
];

function projectRow(
  row: string[],
  mapping: Record<keyof ParsedContact, number>,
): ParsedContact {
  const pick = (key: keyof ParsedContact) => {
    const idx = mapping[key];
    if (idx < 0) return "";
    return (row[idx] || "").trim();
  };
  return {
    name: pick("name"),
    phone: pick("phone"),
    email: pick("email"),
    service_needed: pick("service_needed"),
    notes: pick("notes"),
    status: pick("status"),
  };
}

export default function AddContactModal({
  trade,
  onClose,
  onAdded,
  onBulkAdded,
}: {
  trade: string;
  onClose: () => void;
  onAdded: (lead: Lead) => void;
  onBulkAdded: (leads: Lead[]) => void;
}) {
  const [mode, setMode] = useState<"single" | "csv">("single");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [serviceNeeded, setServiceNeeded] = useState("");
  const [notes, setNotes] = useState("");
  const [estimatedDollars, setEstimatedDollars] = useState("");

  const services = TRADE_SERVICES[trade as Trade] || [];

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const dollars = parseFloat(estimatedDollars);
      const estimatedCents =
        Number.isFinite(dollars) && dollars > 0 ? Math.round(dollars * 100) : null;
      const res = await fetch("/api/contractor/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.replace(/\D/g, ""),
          email: email.trim() || null,
          service_needed: serviceNeeded || null,
          notes: notes.trim() || null,
          estimated_value_cents: estimatedCents,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const lead = await res.json();
      onAdded(lead);
    } catch {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            {mode === "single" ? "Add contact" : "Import from CSV"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {mode === "single" ? (
          <>
            <div className="space-y-3">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name *" className={inputClass} autoFocus />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className={inputClass} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputClass} />
              {services.length > 0 && (
                <select value={serviceNeeded} onChange={(e) => setServiceNeeded(e.target.value)} className={inputClass}>
                  <option value="">Service needed</option>
                  {services.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              )}
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={estimatedDollars}
                onChange={(e) => setEstimatedDollars(e.target.value)}
                placeholder="Estimated value ($)"
                className={inputClass}
              />
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={2} className={inputClass} />
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="mt-4 w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add contact"}
            </button>

            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setMode("csv")}
                className="text-xs text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline"
              >
                Or import from CSV
              </button>
            </div>
          </>
        ) : (
          <CsvImportView
            onBack={() => setMode("single")}
            onImported={onBulkAdded}
          />
        )}
      </div>
    </div>
  );
}

function CsvImportView({
  onBack,
  onImported,
}: {
  onBack: () => void;
  onImported: (leads: Lead[]) => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[] | null>(null);
  const [dataRows, setDataRows] = useState<string[][] | null>(null);
  const [mapping, setMapping] = useState<Record<keyof ParsedContact, number>>({
    name: -1,
    phone: -1,
    email: -1,
    service_needed: -1,
    notes: -1,
    status: -1,
  });
  const [defaultStatus, setDefaultStatus] = useState<PipelineStatus>("lead");
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setParseError(null);
    setImportError(null);
    setHeaders(null);
    setDataRows(null);
    setFileName(file.name);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) {
        setParseError("CSV is empty or only has a header row.");
        return;
      }
      const header = rows[0];
      const data = rows.slice(1);
      setHeaders(header);
      setDataRows(data);
      setMapping(autoMapHeaders(header));
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Could not read file.");
    }
  };

  const contacts: ParsedContact[] = dataRows
    ? dataRows.map((r) => projectRow(r, mapping)).filter((c) => c.name.length > 0)
    : [];

  const resolveStatus = (raw: string): PipelineStatus =>
    normalizePipelineStatus(raw) ?? defaultStatus;

  const statusCounts: Record<PipelineStatus, number> = {
    lead: 0,
    contacted: 0,
    booked: 0,
    customer: 0,
  };
  contacts.forEach((c) => {
    statusCounts[resolveStatus(c.status)]++;
  });
  const statusColumnMapped = mapping.status >= 0;

  const nameMissing = mapping.name < 0;
  const hasFile = headers !== null && dataRows !== null;

  const handleImport = async () => {
    if (nameMissing) {
      setImportError("Pick which column has the contact name.");
      return;
    }
    if (contacts.length === 0) {
      setImportError("No rows have a value in the selected name column.");
      return;
    }
    setImporting(true);
    setImportError(null);
    try {
      const payload = contacts.map((c) => ({
        name: c.name,
        phone: c.phone,
        email: c.email,
        service_needed: c.service_needed,
        notes: c.notes,
        status: resolveStatus(c.status),
      }));
      const res = await fetch("/api/contractor/customers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: payload }),
      });
      const json = await res.json();
      if (!res.ok) {
        setImportError(json.error || "Import failed");
        setImporting(false);
        return;
      }
      onImported(json.leads as Lead[]);
    } catch {
      setImportError("Network error");
      setImporting(false);
    }
  };

  return (
    <>
      <p className="mb-3 text-xs text-gray-500 leading-relaxed">
        Upload a CSV with a header row. You&apos;ll pick which columns map to{" "}
        name, phone, email, service, and notes. Only name is required.
      </p>

      <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center hover:border-gray-400 hover:bg-gray-100">
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <span className="text-sm font-medium text-gray-700">
          {fileName ?? "Choose CSV file"}
        </span>
        <span className="mt-1 text-xs text-gray-400">
          {fileName ? "Tap to replace" : "Tap to pick a file"}
        </span>
      </label>

      {parseError && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {parseError}
        </div>
      )}

      {hasFile && headers && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Map columns
            </span>
          </div>
          <div className="space-y-2 p-3">
            {FIELD_DEFS.map(({ key, label, required }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-xs text-gray-600">
                  {label}
                  {required && <span className="text-red-500"> *</span>}
                </span>
                <select
                  value={mapping[key]}
                  onChange={(e) =>
                    setMapping({ ...mapping, [key]: Number(e.target.value) })
                  }
                  className="flex-1 min-w-0 rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-800 focus:border-gray-400 focus:outline-none"
                >
                  <option value={-1}>— Skip —</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h.trim() || `Column ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasFile && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Import as
            </span>
          </div>
          <div className="p-3">
            <div className="flex gap-1.5 rounded-lg bg-gray-100 p-1">
              {(["lead", "contacted", "booked", "customer"] as PipelineStatus[]).map((s) => {
                const active = defaultStatus === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDefaultStatus(s)}
                    className={`flex-1 rounded-md px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition ${
                      active
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] leading-snug text-gray-400">
              {statusColumnMapped
                ? "Used as a fallback when a row's Status value is blank or unrecognized."
                : "Applied to every imported row. Map a Status column above to use per-row values."}
            </p>
          </div>
        </div>
      )}

      {hasFile && contacts.length > 0 && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Preview
            </span>
            <span className="text-xs text-gray-400">
              {contacts.length} contact{contacts.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="max-h-32 overflow-y-auto">
            {contacts.slice(0, 5).map((c, i) => {
              const resolved = resolveStatus(c.status);
              return (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-gray-50 px-3 py-2 text-xs last:border-b-0"
                >
                  <span className="min-w-0 flex-1 truncate font-medium text-gray-800">
                    {c.name}
                  </span>
                  <span className="ml-3 truncate text-gray-400">
                    {c.phone || c.email || "—"}
                  </span>
                  <span
                    className={`ml-3 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      resolved === "customer"
                        ? "bg-blue-100 text-blue-800"
                        : resolved === "booked"
                          ? "bg-green-100 text-green-800"
                          : resolved === "contacted"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                    }`}
                  >
                    {resolved}
                  </span>
                </div>
              );
            })}
            {contacts.length > 5 && (
              <div className="px-3 py-2 text-xs text-gray-400">
                +{contacts.length - 5} more…
              </div>
            )}
          </div>
          {statusColumnMapped && (
            <div className="border-t border-gray-100 px-3 py-2 text-[11px] text-gray-500">
              {statusCounts.lead} new · {statusCounts.contacted} contacted ·{" "}
              {statusCounts.booked} appt · {statusCounts.customer} done
            </div>
          )}
        </div>
      )}

      {hasFile && nameMissing && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Pick which column has the contact name to continue.
        </div>
      )}

      {importError && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {importError}
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={!hasFile || nameMissing || contacts.length === 0 || importing}
        className="mt-4 w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {importing
          ? "Importing..."
          : hasFile && !nameMissing
            ? `Import ${contacts.length} contact${contacts.length === 1 ? "" : "s"}`
            : "Import contacts"}
      </button>

      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline"
        >
          Back to single contact
        </button>
      </div>
    </>
  );
}
