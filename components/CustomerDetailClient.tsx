"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lead, ActivityLogEntry } from "@/lib/supabase";
import { ArrowLeft, Phone, Mail } from "lucide-react";
import { relativeTime, avatarColor, initials, formatPhone } from "@/lib/utils";

type Props = {
  lead: Lead;
  timeline: ActivityLogEntry[];
};

const STATUSES = [
  { value: "new", label: "New", bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200" },
  { value: "contacted", label: "Contacted", bg: "bg-gray-100", text: "text-gray-600", ring: "ring-gray-200" },
  { value: "quoted", label: "Quoted", bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  { value: "won", label: "Won", bg: "bg-green-50", text: "text-green-700", ring: "ring-green-200" },
  { value: "lost", label: "Lost", bg: "bg-gray-50", text: "text-gray-400", ring: "ring-gray-200" },
];

function sourceLabel(source: string): string {
  switch (source) {
    case "quiz_funnel": return "Quiz funnel";
    case "contact_form": return "Contact form";
    case "manual": return "Manual";
    default: return source;
  }
}

function serviceFromLead(lead: Lead): string | null {
  if (lead.service_needed) return lead.service_needed;
  if (lead.answers?.service_type) return lead.answers.service_type;
  return null;
}

export default function CustomerDetailClient({ lead, timeline: initialTimeline }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(lead.status);
  const [timeline, setTimeline] = useState(initialTimeline);
  const [noteText, setNoteText] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  const color = avatarColor(lead.name);
  const service = serviceFromLead(lead);

  const handleStatusChange = async (newStatus: string) => {
    const oldStatus = status;
    setStatus(newStatus); // Optimistic

    try {
      const res = await fetch(`/api/contractor/customers/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");

      // Add to timeline optimistically
      setTimeline((prev) => [
        {
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          business_id: lead.business_id,
          lead_id: lead.id,
          type: "status_change",
          summary: `Status changed to ${newStatus}`,
          agent: null,
        },
        ...prev,
      ]);
    } catch {
      setStatus(oldStatus); // Revert
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);

    try {
      const res = await fetch(`/api/contractor/customers/${lead.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: noteText.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      const entry = await res.json();

      setTimeline((prev) => [entry, ...prev]);
      setNoteText("");
      setShowNoteInput(false);
    } catch {
      // keep input open on error
    } finally {
      setSavingNote(false);
    }
  };

  const labelClass = "text-[10px] font-medium uppercase tracking-wider text-gray-400";

  return (
    <div className="pb-20">
      {/* Back */}
      <button
        onClick={() => router.push("/contractor/customers")}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Customers
      </button>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-base font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {initials(lead.name)}
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{lead.name}</h1>
          <p className="text-xs text-gray-500">{sourceLabel(lead.source)}</p>
        </div>
      </div>

      {/* Status selector */}
      <div className="mb-6">
        <p className={`mb-2 ${labelClass}`}>Status</p>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => handleStatusChange(s.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                status === s.value
                  ? `${s.bg} ${s.text} ring-2 ${s.ring}`
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contact info */}
      <div className="mb-8 space-y-3">
        {lead.phone && (
          <div>
            <p className={labelClass}>Phone</p>
            <a
              href={`tel:${lead.phone}`}
              className="flex items-center gap-2 text-sm text-gray-900 hover:text-blue-600"
            >
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              {formatPhone(lead.phone)}
            </a>
          </div>
        )}
        {lead.email && (
          <div>
            <p className={labelClass}>Email</p>
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center gap-2 text-sm text-gray-900 hover:text-blue-600"
            >
              <Mail className="h-3.5 w-3.5 text-gray-400" />
              {lead.email}
            </a>
          </div>
        )}
        {service && (
          <div>
            <p className={labelClass}>Service needed</p>
            <p className="text-sm text-gray-900">{service}</p>
          </div>
        )}
        <div>
          <p className={labelClass}>Date added</p>
          <p className="text-sm text-gray-900">
            {new Date(lead.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        {lead.notes && (
          <div>
            <p className={labelClass}>Notes</p>
            <p className="text-sm text-gray-700">{lead.notes}</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div>
        <p className={`mb-3 ${labelClass}`}>Timeline</p>

        {timeline.length === 0 ? (
          <p className="text-sm text-gray-400">No activity yet.</p>
        ) : (
          <div className="space-y-0">
            {timeline.map((entry, i) => (
              <div key={entry.id} className="flex gap-3">
                {/* Dot + line */}
                <div className="flex flex-col items-center">
                  <div className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-green-500" />
                  {i < timeline.length - 1 && (
                    <div className="w-px flex-1 bg-gray-200" />
                  )}
                </div>
                {/* Content */}
                <div className="pb-5">
                  <p className="text-sm text-gray-700">{entry.summary}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {relativeTime(entry.created_at)}
                    </span>
                    {entry.agent && (
                      <span className="rounded-full bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-600">
                        {entry.agent}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add note - fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4">
        <div className="mx-auto max-w-3xl">
          {showNoteInput ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Type a note..."
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
              />
              <button
                onClick={handleAddNote}
                disabled={savingNote || !noteText.trim()}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {savingNote ? "..." : "Save"}
              </button>
              <button
                onClick={() => { setShowNoteInput(false); setNoteText(""); }}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNoteInput(true)}
              className="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Add a note
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
