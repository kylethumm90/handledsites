import { useState, useEffect } from "react";

const FONT = "'DM Sans', sans-serif";
const MONO = "'IBM Plex Mono', monospace";

const C = {
  navy: "#1E2A3A",
  amber: "#E8922A",
  amberBg: "#FFF8EF",
  amberBorder: "#F5D4A8",
  white: "#FFFFFF",
  bg: "#F7F7F5",
  border: "#E8E8E4",
  borderLight: "#F0F0EC",
  text: "#1E2A3A",
  textSec: "#6B7280",
  textMuted: "#9CA3AF",
  green: "#16A34A",
  greenBg: "#F0FDF4",
  greenBorder: "#BBF7D0",
  red: "#DC2626",
  redBg: "#FEF2F2",
  redBorder: "#FECACA",
  blue: "#2563EB",
  purple: "#7C3AED",
};

function Dot({ color, size = 6 }) {
  return <div style={{ width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

function AiHint({ children }) {
  return (
    <div style={{
      background: `${C.navy}04`, border: `1px dashed ${C.border}`,
      padding: "8px 12px", marginTop: 10, display: "flex", alignItems: "center", gap: 8,
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: "50%", background: C.amberBg,
        border: `1px solid ${C.amberBorder}`, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 8, flexShrink: 0,
      }}>⚡</div>
      <span style={{ fontFamily: FONT, fontSize: 10, color: C.textMuted, lineHeight: 1.3 }}>{children}</span>
    </div>
  );
}

const PIPELINE_CONTACTS = [
  {
    name: "Dave Rodriguez", initials: "DR",
    stage: "new", stageLabel: "NEW LEAD", stageColor: C.amber,
    source: "Website form", sourceTime: "Yesterday, 6:42 PM",
    job: "Roofing estimate",
    hint: "Wants a roofing estimate. Came through quiz funnel — has storm damage.",
    waitTime: "14 hours", hasWait: true,
  },
  {
    name: "Maria Gonzales", initials: "MG",
    stage: "new", stageLabel: "NEW LEAD", stageColor: C.amber,
    source: "Missed call", sourceTime: "Yesterday, 8:15 PM",
    job: "Solar interest",
    hint: "Called after hours. No voicemail left. Likely shopping around.",
    waitTime: "12 hours", hasWait: true,
  },
  {
    name: "Carlos Mendez", initials: "CM",
    stage: "new", stageLabel: "NEW LEAD", stageColor: C.amber,
    source: "Website form", sourceTime: "Today, 7:45 AM",
    job: "Gutter replacement",
    hint: "Submitted form this morning. Mentioned a quote from another company.",
    waitTime: "1 hour", hasWait: true,
  },
  {
    name: "Tom Bradley", initials: "TB",
    stage: "appt_set", stageLabel: "APPT SET", stageColor: C.navy,
    source: "Referral", sourceTime: "Apr 10",
    job: "Roof repair estimate",
    hint: "Referred by Mike DiPalma. Wife is co-decision maker. Wants quote by Friday.",
    appt: "Thu 4/16 at 10am", unconfirmed: true,
  },
  {
    name: "Linda Ferreira", initials: "LF",
    stage: "contacted", stageLabel: "CONTACTED", stageColor: C.blue,
    source: "Google", sourceTime: "Apr 8",
    job: "Solar site survey",
    hint: "Interested but waiting on HOA approval. Follow up next week.",
  },
];

const POSTSALE_CONTACTS = [
  {
    name: "Brian Walsh", initials: "BW",
    stage: "job_done", stageLabel: "JOB DONE", stageColor: C.green,
    job: "Roof Replacement", completedDate: "Apr 2",
    hint: "Job completed 13 days ago. No feedback yet. Risk of negative review if issue exists.",
    needsAction: "Send feedback request",
  },
  {
    name: "Sarah Chen", initials: "SC",
    stage: "job_done", stageLabel: "JOB DONE", stageColor: C.green,
    job: "Solar Install", completedDate: "Mar 20",
    hint: "Left a 5-star Google review unprompted. High referral potential — she's enthusiastic.",
    review: "5★ Google",
  },
  {
    name: "Mike DiPalma", initials: "MD",
    stage: "job_done", stageLabel: "JOB DONE", stageColor: C.green,
    job: "Solar Install", completedDate: "Mar 28",
    hint: "Mentioned his neighbor Dave wants a quote. This is a warm referral — act fast.",
    needsAction: "Follow up on referral",
  },
  {
    name: "Jessica Thumm", initials: "JT",
    stage: "job_done", stageLabel: "JOB DONE", stageColor: C.green,
    job: "Roof Replacement", completedDate: "Apr 5",
    hint: "Job completed 10 days ago. No outreach yet. Good window to collect feedback.",
    needsAction: "Send feedback request",
  },
  {
    name: "James Oliveira", initials: "JO",
    stage: "job_done", stageLabel: "JOB DONE", stageColor: C.green,
    job: "Solar Install", completedDate: "Mar 25",
    hint: "3 weeks since completion. Feedback window closing — send soon or you'll lose it.",
    needsAction: "Send feedback request",
  },
  {
    name: "Tom Bradley", initials: "TB2",
    stage: "job_done", stageLabel: "JOB DONE", stageColor: C.green,
    job: "Roof Repair", completedDate: "Apr 10",
    hint: "Completed 5 days ago. Ideal time to check in — fresh enough to remember the experience.",
    needsAction: "Send feedback request",
  },
];

export default function HandledPipelineBasic() {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState("pipeline");
  const [activeStage, setActiveStage] = useState(null);

  useEffect(() => { setMounted(true); }, []);

  const pipelineStages = [
    { id: "new", label: "New", count: 5, color: C.amber },
    { id: "contacted", label: "Contacted", count: 3, color: C.blue },
    { id: "appt_set", label: "Appt Set", count: 2, color: C.navy },
    { id: "job_done", label: "Job Done", count: 3, color: C.green },
  ];

  const postSaleStages = [
    { id: "no_feedback", label: "No Feedback", count: 4, color: C.red },
    { id: "feedback", label: "Feedback", count: 0, color: C.amber },
    { id: "reviewed", label: "Reviewed", count: 1, color: C.green },
    { id: "referrer", label: "Referrer", count: 0, color: C.purple },
  ];

  const stages = view === "pipeline" ? pipelineStages : postSaleStages;
  const allContacts = view === "pipeline" ? PIPELINE_CONTACTS : POSTSALE_CONTACTS;
  const contacts = activeStage
    ? allContacts.filter(c => c.stage === activeStage)
    : allContacts;

  return (
    <div style={{
      fontFamily: FONT, background: C.bg, minHeight: "100vh", color: C.text,
      opacity: mounted ? 1 : 0, transition: "opacity 0.3s ease",
    }}>
      {/* Header */}
      <div style={{ background: C.navy, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.white, letterSpacing: "-0.02em" }}>handled.</span>
        <span style={{ fontFamily: FONT, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Elite Roofing & Solar</span>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 20px" }}>

        {/* Toggle */}
        <div style={{
          display: "flex", background: C.white, border: `1px solid ${C.border}`,
          padding: 3, marginBottom: 12,
        }}>
          {[
            { id: "pipeline", label: "Pipeline" },
            { id: "postsale", label: "Post-Sale" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setView(tab.id); setActiveStage(null); }}
              style={{
                flex: 1, fontFamily: FONT, fontSize: 13, fontWeight: 600,
                color: view === tab.id ? C.white : C.textSec,
                background: view === tab.id ? C.navy : "transparent",
                border: "none", padding: "10px 0", cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >{tab.label}</button>
          ))}
        </div>

        {/* Stage boxes */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {stages.map(s => {
            const isActive = activeStage === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStage(isActive ? null : s.id)}
                style={{
                  flex: 1, textAlign: "center", padding: "10px 4px",
                  background: isActive ? `${s.color}08` : C.white,
                  border: isActive ? `1.5px solid ${s.color}` : `1px solid ${C.border}`,
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
              >
                <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.count}</div>
                <div style={{ fontFamily: FONT, fontSize: 8, color: isActive ? s.color : C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3, fontWeight: isActive ? 600 : 400 }}>{s.label}</div>
              </button>
            );
          })}
        </div>

        {/* PIPELINE VIEW — cards without AI */}
        {view === "pipeline" && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {contacts.map(contact => (
                <div key={contact.name} style={{
                  background: C.white, border: `1px solid ${C.border}`,
                  borderLeft: contact.hasWait ? `3px solid ${C.red}` : `3px solid ${contact.stageColor}`,
                  padding: "14px 16px",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", background: C.bg,
                      border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: MONO, fontSize: 10, fontWeight: 600, color: C.textSec, flexShrink: 0,
                    }}>{contact.initials}</div>

                    <div style={{ flex: 1 }}>
                      {/* Name row */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: C.text }}>{contact.name}</span>
                        <span style={{
                          fontFamily: MONO, fontSize: 8, fontWeight: 600, color: contact.stageColor,
                          background: `${contact.stageColor}10`, padding: "2px 7px", letterSpacing: "0.04em",
                        }}>{contact.stageLabel}</span>
                      </div>

                      {/* Info */}
                      <div style={{ fontFamily: FONT, fontSize: 12, color: C.textSec, marginBottom: 4 }}>
                        {contact.job} · {contact.source} · {contact.sourceTime}
                      </div>

                      {/* AI context hint */}
                      {contact.hint && (
                        <div style={{
                          fontFamily: FONT, fontSize: 11, color: C.navy, lineHeight: 1.4,
                          background: C.amberBg, borderLeft: `2px solid ${C.amber}`, padding: "5px 8px",
                          marginBottom: 6,
                        }}>{contact.hint}</div>
                      )}

                      {contact.appt && (
                        <div style={{ fontFamily: FONT, fontSize: 12, color: C.navy, fontWeight: 600, marginBottom: 4 }}>
                          📅 {contact.appt}
                          {contact.unconfirmed && (
                            <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 600, color: C.amber, background: C.amberBg, padding: "2px 6px", marginLeft: 6, letterSpacing: "0.04em" }}>UNCONFIRMED</span>
                          )}
                        </div>
                      )}

                      {/* Wait time — the pain */}
                      {contact.hasWait && (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
                          background: C.redBg, border: `1px solid ${C.redBorder}`, padding: "6px 10px",
                        }}>
                          <Dot color={C.red} size={5} />
                          <span style={{ fontFamily: FONT, fontSize: 11, color: C.red, fontWeight: 600 }}>
                            Waiting {contact.waitTime} for a response
                          </span>
                        </div>
                      )}

                      {/* Manual CTAs */}
                      <div style={{ display: "flex", gap: 6 }}>
                        <div style={{
                          flex: 1, background: C.navy, color: C.white, textAlign: "center",
                          padding: "8px", fontFamily: FONT, fontSize: 11, fontWeight: 700,
                          letterSpacing: "0.02em", cursor: "pointer",
                        }}>CALL</div>
                        <div style={{
                          flex: 1, background: C.white, color: C.navy, textAlign: "center",
                          padding: "8px", fontFamily: FONT, fontSize: 11, fontWeight: 700,
                          letterSpacing: "0.02em", cursor: "pointer", border: `1px solid ${C.border}`,
                        }}>TEXT</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <AiHint>
              With Ava, these leads get an instant text-back — she qualifies, books, and follows up automatically while you're on a job.
            </AiHint>
          </>
        )}

        {/* POST-SALE VIEW — cards without Stella */}
        {view === "postsale" && (
          <>
            {/* The ugly truth */}
            <div style={{
              background: C.redBg, border: `1px solid ${C.redBorder}`, borderLeft: `3px solid ${C.red}`,
              padding: "10px 14px", marginBottom: 10,
            }}>
              <div style={{ fontFamily: FONT, fontSize: 12, color: C.red, fontWeight: 600, lineHeight: 1.4 }}>
                4 of 6 completed jobs have no feedback collected. You don't know if they're happy or about to leave a bad review.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {contacts.map(contact => (
                <div key={contact.name + contact.initials} style={{
                  background: C.white, border: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${contact.stageColor}`,
                  padding: "14px 16px",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", background: C.bg,
                      border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: MONO, fontSize: 10, fontWeight: 600, color: C.textSec, flexShrink: 0,
                    }}>{contact.initials.slice(0, 2)}</div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: C.text }}>{contact.name}</span>
                        <span style={{
                          fontFamily: MONO, fontSize: 8, fontWeight: 600, color: contact.stageColor,
                          background: `${contact.stageColor}10`, padding: "2px 7px", letterSpacing: "0.04em",
                        }}>{contact.stageLabel}</span>
                      </div>

                      <div style={{ fontFamily: FONT, fontSize: 12, color: C.textSec, marginBottom: 4 }}>
                        {contact.job} · Completed {contact.completedDate}
                      </div>

                      {/* AI context hint */}
                      {contact.hint && (
                        <div style={{
                          fontFamily: FONT, fontSize: 11, color: C.navy, lineHeight: 1.4,
                          background: C.amberBg, borderLeft: `2px solid ${C.amber}`, padding: "5px 8px",
                          marginBottom: 6,
                        }}>{contact.hint}</div>
                      )}

                      {contact.review && (
                        <div style={{
                          fontFamily: MONO, fontSize: 11, color: C.green, fontWeight: 600, marginBottom: 6,
                        }}>★ {contact.review}</div>
                      )}

                      {contact.needsAction && (
                        <div style={{
                          background: C.navy, color: C.white, textAlign: "center",
                          padding: "8px", fontFamily: FONT, fontSize: 11, fontWeight: 700,
                          letterSpacing: "0.02em", cursor: "pointer",
                        }}>{contact.needsAction.toUpperCase()}</div>
                      )}

                      {!contact.needsAction && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <div style={{
                            flex: 1, background: C.navy, color: C.white, textAlign: "center",
                            padding: "8px", fontFamily: FONT, fontSize: 11, fontWeight: 700,
                            letterSpacing: "0.02em", cursor: "pointer",
                          }}>CALL</div>
                          <div style={{
                            flex: 1, background: C.white, color: C.navy, textAlign: "center",
                            padding: "8px", fontFamily: FONT, fontSize: 11, fontWeight: 700,
                            letterSpacing: "0.02em", cursor: "pointer", border: `1px solid ${C.border}`,
                          }}>ASK FOR REFERRAL</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <AiHint>
              With Stella, feedback requests, review asks, and referral follow-ups happen automatically — she handles the entire post-sale pipeline.
            </AiHint>
          </>
        )}

        {/* Bottom upsell */}
        <div style={{
          background: C.navy, padding: "18px", textAlign: "center", marginTop: 16,
        }}>
          <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 6 }}>
            {view === "pipeline"
              ? "3 leads have been waiting hours for a response."
              : "4 completed jobs with zero feedback collected."
            }
          </div>
          <div style={{ fontFamily: FONT, fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 12, lineHeight: 1.5 }}>
            {view === "pipeline"
              ? "Ava responds in seconds, qualifies leads, and books appointments — even at 2am."
              : "Stella collects feedback, requests reviews, catches unhappy customers, and asks for referrals — all automatically."
            }
          </div>
          <div style={{
            background: C.amber, color: C.white, padding: "11px",
            fontFamily: FONT, fontSize: 12, fontWeight: 700, letterSpacing: "0.02em",
            cursor: "pointer", display: "inline-block", width: "100%",
          }}>ACTIVATE YOUR AI TEAM</div>
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        button { cursor: pointer; }
      `}</style>
    </div>
  );
}
