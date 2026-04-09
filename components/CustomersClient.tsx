"use client";

import { useState, useRef } from "react";
import type { Lead } from "@/lib/supabase";
import { TRADE_SERVICES, Trade } from "@/lib/constants";
import { X } from "lucide-react";
import { relativeTime, initials, nameHue } from "@/lib/utils";

type Props = {
  leads: Lead[];
  trade: string;
};

type Filter = "all" | "lead" | "booked" | "customer";

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; dot: string; border: string }> = {
  lead: { label: "LEAD", bg: "#FDF6E3", color: "#92400E", dot: "#E0A800", border: "#E0A800" },
  booked: { label: "BOOKED", bg: "#EEF2FF", color: "#3730A3", dot: "#2F6FED", border: "#2F6FED" },
  customer: { label: "CUSTOMER", bg: "#2E7D32", color: "#fff", dot: "#2E7D32", border: "#2E7D32" },
};

const PIPELINE: ("lead" | "booked" | "customer")[] = ["lead", "booked", "customer"];

function serviceFromLead(lead: Lead): string | null {
  if (lead.service_needed) return lead.service_needed;
  if (lead.answers?.service_type) return lead.answers.service_type;
  return null;
}

function SimpleAvatar({ name }: { name: string }) {
  const hue = nameHue(name);
  const ini = initials(name);
  // Use a muted green-brown palette
  const bg = `hsl(${(hue % 60) + 120}, 25%, 35%)`;
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 22, flexShrink: 0,
      background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "0.02em",
    }}>
      {ini}
    </div>
  );
}


function SizedGlassAvatar({ name, size = 44 }: { name: string; size?: number }) {
  const hue = nameHue(name);
  const ini = initials(name);
  const r = size / 2;
  return (
    <div style={{ width: size, height: size, borderRadius: r, position: "relative", flexShrink: 0, overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0, borderRadius: r,
        background: `radial-gradient(ellipse at 30% 20%, hsla(${hue}, 40%, 95%, 0.95), hsla(${hue}, 25%, 88%, 0.7) 60%, hsla(${hue}, 20%, 82%, 0.5))`,
      }} />
      <div style={{
        position: "absolute", top: 2, left: size * 0.14, right: size * 0.14, height: size * 0.4,
        borderRadius: "50% 50% 40% 40%",
        background: "linear-gradient(180deg, rgba(255,255,255,0.75), rgba(255,255,255,0) 100%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", inset: 0, borderRadius: r,
        border: "1px solid rgba(255,255,255,0.6)",
        boxShadow: `inset 0 1px 2px rgba(255,255,255,0.5), 0 1px 3px hsla(${hue},15%,50%,0.1)`,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "relative", zIndex: 1, width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.34, fontWeight: 600, color: `hsl(${hue},20%,40%)`,
        textShadow: "0 0.5px 0 rgba(255,255,255,0.4)",
      }}>{ini}</div>
    </div>
  );
}

const TAG_LABELS: Record<string, string> = { review: "Google Review", referral: "Referral", repeat: "Repeat Customer" };

function SheetTagIcon({ type }: { type: string }) {
  const c = "#8e8e93";
  if (type === "review") return <svg width="13" height="13" viewBox="0 0 24 24" fill={c}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>;
  if (type === "referral") return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>;
  if (type === "repeat") return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>;
  return null;
}

function PipelineVisual({ status }: { status: string }) {
  const pipeStatuses: Record<string, { label: string; color: string; dot: string }> = {
    lead: { label: "Lead", color: "#555", dot: "#8e8e93" },
    booked: { label: "Booked", color: "#1a56a8", dot: "#007aff" },
    customer: { label: "Customer", color: "#137333", dot: "#34a06b" },
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%" }}>
      {PIPELINE.map((s, i) => {
        const reached = PIPELINE.indexOf(status as typeof PIPELINE[number]) >= i;
        const isCurrent = s === status;
        const cfg = pipeStatuses[s];
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={{
                width: isCurrent ? 10 : 8, height: isCurrent ? 10 : 8, borderRadius: 5,
                background: reached ? cfg.dot : "#e5e5ea",
                border: isCurrent ? `2px solid ${cfg.dot}` : "none",
                boxShadow: isCurrent ? `0 0 0 4px ${cfg.dot}22` : "none",
                transition: "all 0.2s ease",
              }} />
              <div style={{
                fontSize: 10, fontWeight: 600, marginTop: 4,
                color: reached ? cfg.color : "#c7c7cc",
                letterSpacing: "0.02em",
              }}>{cfg.label}</div>
            </div>
            {i < PIPELINE.length - 1 && (
              <div style={{
                height: 2, flex: 1, marginTop: -14,
                background: PIPELINE.indexOf(status as typeof PIPELINE[number]) > i ? pipeStatuses[PIPELINE[i + 1]].dot : "#e5e5ea",
                borderRadius: 1, opacity: 0.4,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const SHEET_STYLES = {
  overlay: { position: "fixed" as const, inset: 0, zIndex: 100, background: "rgba(0,0,0,0.35)", display: "flex", flexDirection: "column" as const, justifyContent: "flex-end" },
  sheet: { background: "#f2f2f7", borderRadius: "16px 16px 0 0", height: "92%", display: "flex", flexDirection: "column" as const, overflow: "hidden" },
  section: { background: "#fff", borderRadius: 12, margin: "8px 12px 0", overflow: "hidden" },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "0.5px solid #f2f2f7" },
  infoLabel: { fontSize: 14, color: "#8e8e93" },
  infoVal: { fontSize: 14, color: "#1c1c1e", fontWeight: 500 },
  secTitle: { fontSize: 12, fontWeight: 600, color: "#8e8e93", textTransform: "uppercase" as const, letterSpacing: "0.03em" },
  dateRow: { display: "flex", alignItems: "center", gap: 8 },
  dateDot: { width: 6, height: 6, borderRadius: 3, background: "#8e8e93", flexShrink: 0 },
  dateLabel: { fontSize: 13, color: "#8e8e93", flex: 1 },
  dateVal: { fontSize: 13, color: "#8e8e93" },
};

function ContactDetailSheet({ contact, onClose }: { contact: Lead; onClose: () => void }) {
  const c = contact;
  const scrollRef = useRef<HTMLDivElement>(null);
  const service = c.service_needed || c.answers?.service_type || "\u2014";
  const srcLabel = c.source === "quiz_funnel" ? "Quiz funnel" : c.source === "contact_form" ? "Contact form" : c.source === "manual" ? "Manual" : c.source;
  const tags = c.tags || [];
  const createdDate = new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="cs-overlay" style={SHEET_STYLES.overlay} onClick={onClose}>
      <div className="cs-sheet" style={SHEET_STYLES.sheet} onClick={e => e.stopPropagation()}>
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
          <div style={{ width: 36, height: 5, borderRadius: 3, background: "#e5e5ea" }} />
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          {/* Identity */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 16px 12px", background: "#fff" }}>
            <SizedGlassAvatar name={c.name} size={64} />
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1c1c1e", marginTop: 10, letterSpacing: "-0.02em" }}>{c.name}</div>
            <div style={{ marginTop: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: STATUS_CFG[c.status]?.bg, color: STATUS_CFG[c.status]?.color }}>
                {STATUS_CFG[c.status]?.label}
              </span>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display: "flex", justifyContent: "center", gap: 20, padding: "8px 16px 16px", background: "#fff", borderBottom: "0.5px solid #e5e5ea" }}>
            {[
              { label: "Call", href: c.phone ? `tel:${c.phone}` : undefined, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg> },
              { label: "Text", href: c.phone ? `sms:${c.phone}` : undefined, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg> },
              { label: "Email", href: c.email ? `mailto:${c.email}` : undefined, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg> },
            ].map(a => {
              const inner = (
                <>
                  <div style={{ width: 44, height: 44, borderRadius: 22, background: "#f2f2f7", display: "flex", alignItems: "center", justifyContent: "center" }}>{a.icon}</div>
                  <div style={{ fontSize: 11, color: "#007aff", fontWeight: 500 }}>{a.label}</div>
                </>
              );
              return a.href ? (
                <a key={a.label} href={a.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textDecoration: "none" }}>{inner}</a>
              ) : (
                <button key={a.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer" }}>{inner}</button>
              );
            })}
          </div>

          {/* Contact info */}
          <div style={SHEET_STYLES.section}>
            <div style={SHEET_STYLES.infoRow}>
              <div style={SHEET_STYLES.infoLabel}>Phone</div>
              <a href={c.phone ? `tel:${c.phone}` : undefined} style={{ ...SHEET_STYLES.infoVal, color: "#007aff", textDecoration: "none" }}>{c.phone || "\u2014"}</a>
            </div>
            <div style={{ ...SHEET_STYLES.infoRow, borderBottom: "none" }}>
              <div style={SHEET_STYLES.infoLabel}>Email</div>
              <a href={c.email ? `mailto:${c.email}` : undefined} style={{ ...SHEET_STYLES.infoVal, color: "#007aff", textDecoration: "none" }}>{c.email || "\u2014"}</a>
            </div>
          </div>

          {/* Pipeline */}
          <div style={SHEET_STYLES.section}>
            <div style={{ padding: "14px 16px" }}>
              <PipelineVisual status={c.status} />
            </div>
            <div style={{ padding: "0 16px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={SHEET_STYLES.dateRow}><span style={SHEET_STYLES.dateDot} /><span style={SHEET_STYLES.dateLabel}>Created</span><span style={SHEET_STYLES.dateVal}>{createdDate}</span></div>
            </div>
          </div>

          {/* Job details */}
          <div style={SHEET_STYLES.section}>
            <div style={SHEET_STYLES.infoRow}>
              <div style={SHEET_STYLES.infoLabel}>Service</div>
              <div style={SHEET_STYLES.infoVal}>{service}</div>
            </div>
            <div style={SHEET_STYLES.infoRow}>
              <div style={SHEET_STYLES.infoLabel}>Source</div>
              <div style={SHEET_STYLES.infoVal}>{srcLabel}</div>
            </div>
            <div style={{ ...SHEET_STYLES.infoRow, borderBottom: "none", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
              <div style={SHEET_STYLES.infoLabel}>Notes</div>
              <div style={{ fontSize: 14, color: "#1c1c1e", lineHeight: 1.45 }}>{c.notes || "\u2014"}</div>
            </div>
          </div>

          {/* Activity (customers only) */}
          {c.status === "customer" && (
            <div style={SHEET_STYLES.section}>
              <div style={{ padding: "10px 16px 6px" }}>
                <div style={SHEET_STYLES.secTitle}>Activity</div>
              </div>
              {tags.length > 0 ? tags.map(t => (
                <div key={t} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 16px", borderTop: "0.5px solid #f2f2f7" }}>
                  <SheetTagIcon type={t} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#1c1c1e" }}>{TAG_LABELS[t] || t}</div>
                  </div>
                </div>
              )) : (
                <div style={{ padding: "0 16px 14px" }}>
                  <button style={{ width: "100%", padding: 10, borderRadius: 8, background: "#f2f2f7", border: "none", fontSize: 14, fontWeight: 600, color: "#007aff", cursor: "pointer" }}>
                    Send review request
                  </button>
                </div>
              )}
            </div>
          )}

          <div style={{ height: 20 }} />
        </div>

        {/* Bottom action bar */}
        <div style={{ padding: "8px 12px 12px", background: "#f2f2f7", borderTop: "0.5px solid #e5e5ea", flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ width: "100%", padding: 13, borderRadius: 12, background: "#007aff", color: "#fff", border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer", letterSpacing: "-0.01em" }}
          >
            {c.status === "lead" ? "Mark as Booked" : c.status === "booked" ? "Mark as Customer" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomersClient({ leads: initialLeads, trade }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Lead | null>(null);

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
        @keyframes csSheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes csOverlayIn { from { opacity: 0; } to { opacity: 1; } }
        .cs-sheet { animation: csSheetUp 0.38s cubic-bezier(0.32, 0.72, 0, 1) both; }
        .cs-overlay { animation: csOverlayIn 0.25s ease both; }
      `}</style>

      <div>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#1F2937", letterSpacing: "-0.03em" }}>Customers</div>
          <button
            onClick={() => setShowAdd(true)}
            style={{ background: "#1F2937", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, padding: "10px 20px", borderRadius: 8, cursor: "pointer" }}
          >
            + Add
          </button>
        </div>

        {/* Alert banner */}
        {(counts.customer > 0 || counts.lead > 0) && (
          <div style={{
            background: "#FDF6E3", border: "1px solid #F3E8C8", borderRadius: 10,
            padding: "14px 16px", marginBottom: 16,
            display: "flex", alignItems: "flex-start", gap: 10,
            fontSize: 14, color: "#6B5B3A", lineHeight: 1.5,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚡</span>
            <span>
              {counts.customer > 0 && <><strong>{counts.customer} customer{counts.customer !== 1 ? "s" : ""}</strong> ready for review requests. </>}
              {counts.lead > 0 && <><strong>{counts.lead} lead{counts.lead !== 1 ? "s" : ""}</strong> haven&#39;t been contacted in 3+ days.</>}
            </span>
          </div>
        )}

        {/* Stat cards */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {PIPELINE.map((stage) => (
            <div key={stage} style={{
              flex: 1, padding: "14px 16px",
              border: "1px solid #E5E7EB", borderRadius: 8,
              background: "#fff",
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {stage === "lead" ? "Leads" : stage === "booked" ? "Booked" : "Customers"}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#1F2937", marginTop: 4, letterSpacing: "-0.02em" }}>
                {counts[stage]}
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ct-search"
            style={{ width: "100%", padding: "12px 14px 12px 40px", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, color: "#1F2937", background: "#fff" }}
          />
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {([
            { key: "all" as Filter, label: "All", count: counts.all },
            { key: "lead" as Filter, label: "Lead", count: counts.lead },
            { key: "booked" as Filter, label: "Booked", count: counts.booked },
            { key: "customer" as Filter, label: "Customer", count: counts.customer },
          ]).map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                className="ct-pipe"
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "7px 14px", borderRadius: 20,
                  fontSize: 13, fontWeight: 600,
                  background: active ? "#1F2937" : "#fff",
                  color: active ? "#fff" : "#6B7280",
                  border: `1px solid ${active ? "#1F2937" : "#E5E7EB"}`,
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                {f.label}
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: active ? "rgba(255,255,255,0.7)" : "#9CA3AF",
                }}>{f.count}</span>
              </button>
            );
          })}
        </div>

        {/* Section label */}
        <div style={{
          fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase",
          letterSpacing: "0.08em", marginBottom: 10,
        }}>
          {filter === "all" ? "All Customers" : STATUS_CFG[filter]?.label || "Filtered"}
        </div>

        {/* Contact list */}
        {filtered.length === 0 ? (
          <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 32, textAlign: "center", fontSize: 14, color: "#bbb" }}>
            {leads.length === 0 ? "No customers yet. Share your site and quiz funnel to start collecting leads." : "No one matches your search."}
          </div>
        ) : (
          <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
            {filtered.map((lead, i) => {
              const cfg = STATUS_CFG[lead.status] || STATUS_CFG.lead;
              const service = serviceFromLead(lead);

              return (
                <div
                  key={lead.id}
                  className="ct-row"
                  onClick={() => window.location.href = `/contractor/customers/${lead.id}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "16px 16px",
                    borderBottom: i < filtered.length - 1 ? "1px solid #F3F4F6" : "none",
                  }}
                >
                  <SimpleAvatar name={lead.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>{lead.name}</span>
                    <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                      {service || "No service"} &middot; {relativeTime(lead.created_at)}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 4, flexShrink: 0,
                    letterSpacing: "0.03em",
                    background: cfg.bg, color: cfg.color,
                    border: lead.status === "customer" ? "none" : `1px solid ${cfg.border}30`,
                  }}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Contact detail sheet */}
        {selectedContact && (
          <ContactDetailSheet contact={selectedContact} onClose={() => setSelectedContact(null)} />
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
