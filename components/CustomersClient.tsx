"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lead } from "@/lib/supabase";
import { TRADE_SERVICES, Trade } from "@/lib/constants";
import { X } from "lucide-react";
import { relativeTime, initials, nameHue } from "@/lib/utils";

type Props = {
  leads: Lead[];
  trade: string;
};

type Filter = "all" | "lead" | "booked" | "customer";

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; dot: string; activeBg: string }> = {
  lead: { label: "Lead", bg: "#f3f3f3", color: "#555", dot: "#999", activeBg: "#f3f3f3" },
  booked: { label: "Booked", bg: "#e8f0fe", color: "#1a56a8", dot: "#3574d1", activeBg: "#e8f0fe" },
  customer: { label: "Customer", bg: "#e6f4ea", color: "#137333", dot: "#34a06b", activeBg: "#e6f4ea" },
};

const PIPELINE: ("lead" | "booked" | "customer")[] = ["lead", "booked", "customer"];

function serviceFromLead(lead: Lead): string | null {
  if (lead.service_needed) return lead.service_needed;
  if (lead.answers?.service_type) return lead.answers.service_type;
  return null;
}

function LiquidGlassAvatar({ name }: { name: string }) {
  const hue = nameHue(name);
  const ini = initials(name);
  return (
    <div style={{ width: 44, height: 44, borderRadius: 22, position: "relative", flexShrink: 0, overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0, borderRadius: 22,
        background: `radial-gradient(ellipse at 30% 20%, hsla(${hue}, 40%, 95%, 0.95), hsla(${hue}, 25%, 88%, 0.7) 60%, hsla(${hue}, 20%, 82%, 0.5))`,
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      }} />
      <div style={{
        position: "absolute", top: 2, left: 6, right: 6, height: 18,
        borderRadius: "50% 50% 40% 40%",
        background: "linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.0) 100%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: 1, left: 8, right: 8, height: 6,
        borderRadius: "40% 40% 50% 50%",
        background: "linear-gradient(0deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.0) 100%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", inset: 0, borderRadius: 22,
        border: "1px solid rgba(255,255,255,0.6)",
        boxShadow: `inset 0 1px 2px rgba(255,255,255,0.5), inset 0 -1px 1px rgba(0,0,0,0.03), 0 1px 3px hsla(${hue}, 15%, 50%, 0.1), 0 2px 8px hsla(${hue}, 10%, 50%, 0.06)`,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "relative", zIndex: 1, width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 15, fontWeight: 600, color: `hsl(${hue}, 20%, 40%)`,
        letterSpacing: "-0.01em", textShadow: "0 0.5px 0 rgba(255,255,255,0.4)",
      }}>
        {ini}
      </div>
    </div>
  );
}

function TagIcon({ type }: { type: string }) {
  const c = "#bbb";
  if (type === "review") return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={c}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>
  );
  if (type === "referral") return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
  if (type === "repeat") return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
  return null;
}

export default function CustomersClient({ leads: initialLeads, trade }: Props) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showAdd, setShowAdd] = useState(false);

  const counts: Record<string, number> = { all: leads.length };
  PIPELINE.forEach((s) => { counts[s] = leads.filter((l) => l.status === s).length; });

  const filtered = leads.filter((l) => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "all") return true;
    return l.status === filter;
  });

  return (
    <>
      <style>{`
        .ct-row { cursor: pointer; -webkit-tap-highlight-color: transparent; }
        .ct-row:active { background: #f7f7f7; }
        .ct-pipe { cursor: pointer; -webkit-tap-highlight-color: transparent; border: none; font-family: inherit; }
        .ct-pipe:active { opacity: 0.7; }
        .ct-search:focus { outline: none; border-color: #ccc; }
      `}</style>

      <div>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#111", letterSpacing: "-0.02em" }}>Customers</div>
          <button
            onClick={() => setShowAdd(true)}
            style={{ background: "#111", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, padding: "10px 18px", borderRadius: 8, cursor: "pointer" }}
          >
            + Add
          </button>
        </div>

        {/* Pipeline */}
        <div style={{ marginBottom: 16 }}>
          <button
            className="ct-pipe"
            onClick={() => setFilter("all")}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14, fontWeight: 600,
              marginBottom: 8, textAlign: "left",
              background: filter === "all" ? "#3574d1" : "#f3f3f3",
              color: filter === "all" ? "#fff" : "#666",
            }}
          >
            All {counts.all}
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            {PIPELINE.map((stage) => {
              const cfg = STATUS_CFG[stage];
              const active = filter === stage;
              return (
                <button
                  key={stage}
                  className="ct-pipe"
                  onClick={() => setFilter(filter === stage ? "all" : stage)}
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: 8, textAlign: "left",
                    background: active ? cfg.activeBg : "#fff",
                    border: `1.5px solid ${active ? cfg.dot : "#eee"}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: cfg.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: active ? cfg.color : "#888", fontWeight: 600 }}>{cfg.label}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: active ? cfg.color : "#333", letterSpacing: "-0.02em", marginTop: 2 }}>
                    {counts[stage]}
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", padding: "0 4px", marginTop: -4, marginBottom: 4, pointerEvents: "none" }}>
            <div style={{ flex: 1 }} />
            <div style={{ flex: 1, textAlign: "center", fontSize: 14, color: "#ddd", fontWeight: 600 }}>&rarr;</div>
            <div style={{ flex: 1, textAlign: "center", fontSize: 14, color: "#ddd", fontWeight: 600 }}>&rarr;</div>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ct-search"
          style={{ width: "100%", padding: "12px 14px", border: "1px solid #e5e5e5", borderRadius: 10, fontSize: 15, color: "#111", background: "#fafafa", marginBottom: 12 }}
        />

        {/* Contact list */}
        {filtered.length === 0 ? (
          <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 32, textAlign: "center", fontSize: 14, color: "#bbb" }}>
            {leads.length === 0 ? "No customers yet. Share your site and quiz funnel to start collecting leads." : "No one matches your search."}
          </div>
        ) : (
          <div style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
            {filtered.map((lead, i) => {
              const cfg = STATUS_CFG[lead.status] || STATUS_CFG.lead;
              const service = serviceFromLead(lead);
              const tags = lead.tags || [];

              return (
                <div
                  key={lead.id}
                  className="ct-row"
                  onClick={() => router.push(`/contractor/customers/${lead.id}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: 14,
                    borderBottom: i < filtered.length - 1 ? "1px solid #f0f0f0" : "none",
                  }}
                >
                  <LiquidGlassAvatar name={lead.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 600, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.name}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 4, flexShrink: 0,
                        background: cfg.bg, color: cfg.color,
                      }}>
                        {cfg.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 3 }}>
                      <span style={{ fontSize: 13, color: "#999" }}>
                        {service || "No service"} &middot; {relativeTime(lead.created_at)}
                      </span>
                      {tags.length > 0 && (
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {tags.map((t) => <TagIcon key={t} type={t} />)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
    </>
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
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name *" className={inputClass} autoFocus />
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className={inputClass} />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputClass} />
          {services.length > 0 && (
            <select value={serviceNeeded} onChange={(e) => setServiceNeeded(e.target.value)} className={inputClass}>
              <option value="">Service needed</option>
              {services.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          )}
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={2} className={inputClass} />
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
