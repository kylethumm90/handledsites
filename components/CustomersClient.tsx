"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lead } from "@/lib/supabase";
import { TRADE_SERVICES, Trade } from "@/lib/constants";
import { Plus, X } from "lucide-react";
import { relativeTime, avatarColor, initials } from "@/lib/utils";

type Props = {
  leads: Lead[];
  trade: string;
};

type Filter = "all" | "needs_attention" | "won";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: "bg-blue-50", text: "text-blue-700", label: "New" },
  contacted: { bg: "bg-gray-100", text: "text-gray-600", label: "Contacted" },
  quoted: { bg: "bg-amber-50", text: "text-amber-700", label: "Quoted" },
  won: { bg: "bg-green-50", text: "text-green-700", label: "Won" },
  lost: { bg: "bg-gray-50", text: "text-gray-400", label: "Lost" },
};

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

export default function CustomersClient({ leads: initialLeads, trade }: Props) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = leads.filter((lead) => {
    // Search
    if (search) {
      const q = search.toLowerCase();
      const nameMatch = lead.name.toLowerCase().includes(q);
      const phoneMatch = lead.phone.includes(q.replace(/\D/g, ""));
      if (!nameMatch && !phoneMatch) return false;
    }
    // Filter
    if (filter === "needs_attention") return lead.status === "new" || lead.status === "quoted";
    if (filter === "won") return lead.status === "won";
    return true;
  });

  const filterTabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: leads.length },
    { key: "needs_attention", label: "Needs attention", count: leads.filter((l) => l.status === "new" || l.status === "quoted").length },
    { key: "won", label: "Won", count: leads.filter((l) => l.status === "won").length },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Customers</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or phone..."
        className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
      />

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === tab.key
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 ${filter === tab.key ? "text-gray-300" : "text-gray-400"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contact list */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-gray-400">
            {leads.length === 0
              ? "No customers yet. Share your site and quiz funnel to start collecting leads."
              : "No contacts match your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((lead) => {
            const style = STATUS_STYLES[lead.status] || STATUS_STYLES.new;
            const service = serviceFromLead(lead);
            const color = avatarColor(lead.name);

            return (
              <button
                key={lead.id}
                onClick={() => router.push(`/contractor/customers/${lead.id}`)}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                {/* Avatar */}
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: color }}
                >
                  {initials(lead.name)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-gray-900">
                      {lead.name}
                    </span>
                    <span className={`inline-flex flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </div>
                  <p className="truncate text-xs text-gray-500">
                    {service || "No service specified"}
                    <span className="mx-1 text-gray-300">&middot;</span>
                    {sourceLabel(lead.source)}
                  </p>
                </div>

                {/* Timestamp */}
                <span className="flex-shrink-0 text-xs text-gray-400">
                  {relativeTime(lead.created_at)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Add contact modal */}
      {showAdd && (
        <AddContactModal
          trade={trade}
          onClose={() => setShowAdd(false)}
          onAdded={(lead) => {
            setLeads([lead, ...leads]);
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

function AddContactModal({
  trade,
  onClose,
  onAdded,
}: {
  trade: string;
  onClose: () => void;
  onAdded: (lead: Lead) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [serviceNeeded, setServiceNeeded] = useState("");
  const [notes, setNotes] = useState("");

  const services = TRADE_SERVICES[trade as Trade] || [];

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/contractor/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.replace(/\D/g, ""),
          email: email.trim() || null,
          service_needed: serviceNeeded || null,
          notes: notes.trim() || null,
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
          <h2 className="text-base font-semibold text-gray-900">Add contact</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name *"
            className={inputClass}
            autoFocus
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            className={inputClass}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={inputClass}
          />
          {services.length > 0 && (
            <select
              value={serviceNeeded}
              onChange={(e) => setServiceNeeded(e.target.value)}
              className={inputClass}
            >
              <option value="">Service needed</option>
              {services.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
            rows={2}
            className={inputClass}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="mt-4 w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Add contact"}
        </button>
      </div>
    </div>
  );
}
