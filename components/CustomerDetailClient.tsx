"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lead, ActivityLogEntry } from "@/lib/supabase";
import { formatPhone } from "@/lib/utils";

type Props = {
  lead: Lead;
  timeline: ActivityLogEntry[];
  counts: { lead: number; booked: number; customer: number };
  existingReferralCode?: string | null;
  referrerName?: string | null;
  employees?: { id: string; name: string }[];
  reviewFunnelSlug?: string | null;
};

// 4-COLOR SYSTEM
const GREEN = "#2E7D32";
const BLUE = "#2F6FED";
const AMBER = "#E0A800";
const DARK = "#1F2937";
const GREY_BG = "#F3F4F6";
const GREY_BORDER = "#D1D5DB";

type Stage = "lead" | "booked" | "customer";

const STAGE_META: Record<Stage, { label: string; color: string }> = {
  lead: { label: "New", color: AMBER },
  booked: { label: "Appt Set", color: BLUE },
  customer: { label: "Sold", color: GREEN },
};

function sourceLabel(source: string): string {
  switch (source) {
    case "quiz_funnel": return "Quiz Funnel";
    case "contact_form": return "Contact Form";
    case "manual": return "Manual";
    default: return source;
  }
}

function serviceFromLead(lead: Lead): string | null {
  if (lead.service_needed) return lead.service_needed;
  if (lead.answers?.service_type) return lead.answers.service_type;
  return null;
}

function timelineColor(entry: ActivityLogEntry): string {
  if (entry.agent) return GREEN; // Ava action
  if (entry.type === "status_change") return BLUE; // system
  if (entry.summary?.toLowerCase().includes("intent") || entry.summary?.toLowerCase().includes("wants")) return AMBER;
  if (entry.summary?.toLowerCase().includes("new lead")) return BLUE;
  return BLUE; // default system
}

function firstName(name: string): string {
  return name.split(" ")[0] || name;
}

export default function CustomerDetailClient({ lead, timeline: initialTimeline, counts, existingReferralCode, referrerName, employees, reviewFunnelSlug }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Stage>(lead.status);
  const [timeline, setTimeline] = useState(initialTimeline);
  const [referralCode, setReferralCode] = useState<string | null>(existingReferralCode || null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const [assignedEmployee, setAssignedEmployee] = useState<string | null>(lead.employee_id || null);

  const meta = STAGE_META[status];
  const service = serviceFromLead(lead);
  const name = firstName(lead.name);

  const handleStatusChange = async (newStatus: Stage) => {
    const oldStatus = status;
    setStatus(newStatus);

    try {
      const res = await fetch(`/api/contractor/customers/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");

      setTimeline((prev) => [
        {
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          business_id: lead.business_id,
          lead_id: lead.id,
          type: "status_change",
          summary: `Status changed to ${STAGE_META[newStatus].label}`,
          agent: null,
        },
        ...prev,
      ]);
    } catch {
      setStatus(oldStatus);
    }
  };

  const F = "'Archivo', sans-serif";

  return (
    <div style={{
      fontFamily: F,
      maxWidth: "100%",
      margin: "0 auto",
      background: "#fff",
      minHeight: "100vh",
      color: DARK,
      position: "relative",
      paddingBottom: 68,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Stage bar */}
      <div style={{
        background: meta.color,
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => router.push("/contractor/customers")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 13, letterSpacing: 0.5, textTransform: "uppercase" }}>
            {meta.label}
          </span>
        </div>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, letterSpacing: -0.3 }}>
          handled.
        </span>
      </div>

      {/* Name + service */}
      <div style={{ padding: "22px 20px 18px" }}>
        <div style={{ fontWeight: 900, fontSize: 26, letterSpacing: -0.8, lineHeight: 1.1, color: DARK }}>
          {lead.name}
        </div>
        {service && (
          <div style={{ fontSize: 14, color: "#6B7280", marginTop: 5, fontWeight: 500 }}>
            {service}
          </div>
        )}

        {/* Alert banner */}
        <div style={{
          marginTop: 14,
          background: "#FDF6E3",
          borderLeft: `4px solid ${AMBER}`,
          padding: "11px 14px",
          fontSize: 13,
          fontWeight: 700,
          color: "#92400E",
        }}>
          {status === "lead" && "⚡ Wants a quote. Ready to book."}
          {status === "booked" && "📅 Appointment set. Confirm before the day."}
          {status === "customer" && "✅ Sold. Time to get the review."}
        </div>
      </div>

      {/* Stage actions */}
      <div style={{ padding: "0 20px 20px" }}>

        {/* NEW */}
        {status === "lead" && (<>
          {lead.phone && (
            <a href={`tel:${lead.phone}`} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              width: "100%", background: GREEN, color: "#fff",
              padding: "20px 20px", fontSize: 16, fontWeight: 900,
              fontFamily: F, textDecoration: "none", border: "none",
              borderRadius: 0, letterSpacing: -0.3, textTransform: "uppercase",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              Call {name}
            </a>
          )}
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button onClick={() => handleStatusChange("booked")} style={{
              flex: 1, background: "#fff", border: `2px solid ${GREEN}`,
              color: GREEN, padding: "16px 12px", fontSize: 14, fontWeight: 800,
              fontFamily: F, cursor: "pointer", borderRadius: 0,
            }}>
              Appt Booked ✓
            </button>
            {lead.phone && (
              <a href={`sms:${lead.phone}`} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                background: "#fff", border: `2px solid ${BLUE}`,
                color: BLUE, padding: "16px 12px", fontSize: 14, fontWeight: 800,
                fontFamily: F, textDecoration: "none", borderRadius: 0,
              }}>
                Text {name}
              </a>
            )}
          </div>
        </>)}

        {/* APPT SET */}
        {status === "booked" && (<>
          <button style={{
            width: "100%", background: GREEN, color: "#fff", border: "none",
            padding: "20px 20px", fontSize: 16, fontWeight: 900,
            fontFamily: F, cursor: "pointer", borderRadius: 0,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            letterSpacing: -0.3, textTransform: "uppercase",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
            Confirm Appointment
          </button>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            {lead.phone && (
              <a href={`sms:${lead.phone}`} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                background: "#fff", border: `2px solid ${BLUE}`,
                color: BLUE, padding: "16px 12px", fontSize: 14, fontWeight: 800,
                fontFamily: F, textDecoration: "none", borderRadius: 0,
              }}>
                Send Reminder
              </a>
            )}
            <button style={{
              flex: 1, background: "#fff", border: `2px solid ${GREY_BORDER}`,
              color: "#6B7280", padding: "16px 12px", fontSize: 14, fontWeight: 800,
              fontFamily: F, cursor: "pointer", borderRadius: 0,
            }}>
              Reschedule
            </button>
          </div>
          <button onClick={() => handleStatusChange("customer")} style={{
            width: "100%", marginTop: 6, background: "#fff",
            border: `2px solid ${GREEN}`, color: GREEN,
            padding: "16px 12px", fontSize: 14, fontWeight: 800,
            fontFamily: F, cursor: "pointer", borderRadius: 0,
          }}>
            Mark as Sold ✓
          </button>
        </>)}

        {/* SOLD */}
        {status === "customer" && (<>
          {(() => {
            const assignedEmp = employees?.find(e => e.id === assignedEmployee);
            const params = new URLSearchParams();
            params.set("lead_id", lead.id);
            if (assignedEmp) params.set("rep_id", assignedEmp.id);
            const reviewUrl = reviewFunnelSlug ? `/r/${reviewFunnelSlug}?${params.toString()}` : null;
            return reviewUrl ? (
              <a href={reviewUrl} target="_blank" rel="noopener noreferrer" style={{
                width: "100%", background: GREEN, color: "#fff", border: "none",
                padding: "20px 20px", fontSize: 16, fontWeight: 900,
                fontFamily: F, textDecoration: "none", borderRadius: 0,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                letterSpacing: -0.3, textTransform: "uppercase",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Send Review Request
              </a>
            ) : (
              <button disabled style={{
                width: "100%", background: "#9CA3AF", color: "#fff", border: "none",
                padding: "20px 20px", fontSize: 16, fontWeight: 900,
                fontFamily: F, cursor: "default", borderRadius: 0,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                letterSpacing: -0.3, textTransform: "uppercase",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Send Review Request
              </button>
            );
          })()}
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button style={{
              flex: 1, background: "#fff", border: `2px solid ${GREEN}`,
              color: GREEN, padding: "16px 12px", fontSize: 14, fontWeight: 800,
              fontFamily: F, cursor: "pointer", borderRadius: 0,
            }}>
              Ask for Referral
            </button>
            {lead.phone && (
              <a href={`tel:${lead.phone}`} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: "#fff", border: `2px solid ${GREY_BORDER}`,
                color: "#6B7280", padding: "16px 12px", fontSize: 14, fontWeight: 800,
                fontFamily: F, textDecoration: "none", borderRadius: 0,
              }}>
                Call {name}
              </a>
            )}
          </div>
        </>)}
      </div>

      {/* Contact card */}
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{
          fontSize: 10, fontWeight: 800, color: "#9CA3AF",
          textTransform: "uppercase", letterSpacing: 2, marginBottom: 10,
        }}>
          Contact
        </div>
        <div style={{ background: "#fff", border: `1px solid ${GREY_BORDER}`, overflow: "hidden" }}>
          {lead.phone && (
            <a href={`tel:${lead.phone}`} style={{
              display: "flex", alignItems: "center", padding: "14px 16px",
              borderBottom: `1px solid ${GREY_BG}`, textDecoration: "none", color: DARK,
            }}>
              <div style={{ width: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              </div>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{formatPhone(lead.phone)}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, background: `${GREEN}12`, padding: "4px 10px" }}>CALL</span>
            </a>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`} style={{
              display: "flex", alignItems: "center", padding: "14px 16px",
              borderBottom: `1px solid ${GREY_BG}`, textDecoration: "none", color: DARK,
            }}>
              <div style={{ width: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>
              </div>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{lead.email}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: BLUE, background: `${BLUE}12`, padding: "4px 10px" }}>EMAIL</span>
            </a>
          )}
          <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", borderBottom: referrerName ? `1px solid ${GREY_BG}` : "none" }}>
            <div style={{ width: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#6B7280" }}>{sourceLabel(lead.source)}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF" }}>
              {new Date(lead.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
          {referrerName && (
            <div style={{ display: "flex", alignItems: "center", padding: "14px 16px" }}>
              <div style={{ width: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
              </div>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#6B7280" }}>Referred by {referrerName}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, background: `${GREEN}12`, padding: "4px 10px" }}>REFERRAL</span>
            </div>
          )}
        </div>
      </div>

      {/* Assign rep */}
      {employees && employees.length > 0 && (
        <div style={{ padding: "0 20px 20px" }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: "#9CA3AF",
            textTransform: "uppercase", letterSpacing: 2, marginBottom: 10,
          }}>
            Assigned To
          </div>
          <select
            value={assignedEmployee || ""}
            onChange={async (e) => {
              const empId = e.target.value || null;
              setAssignedEmployee(empId);
              await fetch(`/api/contractor/customers/${lead.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ employee_id: empId }),
              });
            }}
            style={{
              width: "100%", padding: "12px 14px",
              border: `1px solid ${GREY_BORDER}`, background: "#fff",
              fontSize: 14, fontWeight: 600, color: assignedEmployee ? DARK : "#9CA3AF",
              fontFamily: "'Archivo', sans-serif",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 14px center",
            }}
          >
            <option value="">Unassigned</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Referral partner — only for Sold contacts */}
      {(status === "customer" || referralCode) && (
      <div style={{ padding: "0 20px 20px" }}>
        {referralCode ? (
          <div style={{ background: "#fff", border: `1px solid ${GREY_BORDER}`, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Referral Link</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ flex: 1, fontSize: 13, color: DARK, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {typeof window !== "undefined" ? window.location.origin : ""}/refer/{referralCode}
              </span>
              <button onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/refer/${referralCode}`);
                setReferralCopied(true);
                setTimeout(() => setReferralCopied(false), 1500);
              }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: referralCopied ? GREEN : "#6B7280", padding: "4px 8px" }}>
                {referralCopied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={async () => {
              setReferralLoading(true);
              try {
                const res = await fetch("/api/contractor/referral-partner", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ customer_id: lead.id }),
                });
                const data = await res.json();
                if (data.referral_code) setReferralCode(data.referral_code);
              } catch { /* ignore */ }
              setReferralLoading(false);
            }}
            disabled={referralLoading}
            style={{
              width: "100%", padding: "12px", background: "#fff",
              border: `1px solid ${GREY_BORDER}`, fontSize: 13, fontWeight: 600,
              color: "#6B7280", cursor: "pointer", fontFamily: "'Archivo', sans-serif",
            }}
          >
            {referralLoading ? "Creating..." : "Make referral partner"}
          </button>
        )}
      </div>
      )}

      {/* Activity timeline */}
      <div style={{ padding: "0 20px 28px" }}>
        <div style={{
          fontSize: 10, fontWeight: 800, color: "#9CA3AF",
          textTransform: "uppercase", letterSpacing: 2, marginBottom: 14,
        }}>
          What Happened
        </div>

        {timeline.length === 0 ? (
          <div style={{ fontSize: 14, color: "#9CA3AF" }}>No activity yet.</div>
        ) : (
          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute", left: 5, top: 6, bottom: 6,
              width: 2, background: GREY_BG,
            }} />

            {timeline.map((entry, i) => {
              const dotColor = timelineColor(entry);
              const isIntent = entry.summary?.toLowerCase().includes("wants") || entry.summary?.toLowerCase().includes("intent");
              return (
                <div key={entry.id} style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  paddingBottom: i < timeline.length - 1 ? 16 : 0, position: "relative",
                }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: "50%",
                    background: dotColor, border: "2px solid #fff",
                    flexShrink: 0, marginTop: 2, position: "relative", zIndex: 1,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: isIntent ? 700 : 500,
                      color: isIntent ? DARK : "#6B7280",
                      lineHeight: 1.3,
                    }}>
                      {entry.summary}
                      {entry.agent && (
                        <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 6 }}>({entry.agent})</span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500, flexShrink: 0, marginTop: 2 }}>
                    {new Date(entry.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pipeline tabs */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: "100%", background: "#fff",
        borderTop: `1px solid ${GREY_BORDER}`, display: "flex",
      }}>
        {([
          { key: "lead" as Stage, label: "New", color: AMBER, count: counts.lead },
          { key: "booked" as Stage, label: "Appt Set", color: BLUE, count: counts.booked },
          { key: "customer" as Stage, label: "Sold", color: GREEN, count: counts.customer },
        ]).map((tab) => {
          const isActive = tab.key === status;
          return (
            <button
              key={tab.key}
              onClick={() => handleStatusChange(tab.key)}
              style={{
                flex: 1, padding: "12px 0 10px", background: "transparent",
                border: "none", borderTop: isActive ? `3px solid ${tab.color}` : "3px solid transparent",
                cursor: "pointer", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 2, fontFamily: F,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{
                  fontSize: 12, fontWeight: isActive ? 800 : 600,
                  color: isActive ? tab.color : "#9CA3AF",
                }}>{tab.label}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: isActive ? tab.color : "#9CA3AF",
                  background: isActive ? `${tab.color}15` : GREY_BG,
                  padding: "1px 6px",
                  minWidth: 18, textAlign: "center",
                }}>{tab.count}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
