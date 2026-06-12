"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Lead } from "@/lib/supabase";
import { relativeTime, avatarColor, initials } from "@/lib/utils";
import ProfileCompleter from "@/components/ProfileCompleter";
import DemoBanner from "@/components/DemoBanner";

// Design tokens (Handled hi-fi mockups)
const NAVY = "#0F2A4A";
const AMBER = "#F59E0B";
const INK = "#1A2433";
const MUTED = "#66707E";
const GRAY = "#8A93A0";
const BORDER = "#E6E3DC";
const HAIRLINE = "#EFEDE7";

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
};

type ProfileData = {
  owner_name: string | null;
  years_in_business: number | null;
  service_areas: string[] | null;
  license_number: string | null;
  hero_tagline: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_nextdoor: string | null;
  trade: string | null;
  services: string[] | null;
  about_bio: string | null;
  city: string | null;
  state: string | null;
};

type Props = {
  businessName: string;
  logoUrl: string | null;
  leads: Lead[];
  totalLeads: number;
  newLeadsThisWeek: number;
  totalViews?: number;
  googleRating: number | null;
  googleReviewCount: number | null;
  hasDemoLeads?: boolean;
  profileData: ProfileData | null;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

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

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1, marginLeft: 6, position: "relative", top: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 20 20" fill={i <= Math.round(rating) ? AMBER : "#DAD6CD"}>
          <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.27 5.06 16.7 6 11.21 2 7.31l5.53-.8z" />
        </svg>
      ))}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub: string }) {
  return (
    <div style={{ ...card, padding: "16px 18px" }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: GRAY, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 6, color: INK, lineHeight: 1.15 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: GRAY, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

export default function DashboardClient({
  businessName,
  logoUrl,
  leads,
  totalLeads,
  newLeadsThisWeek,
  totalViews,
  googleRating,
  googleReviewCount,
  hasDemoLeads,
  profileData,
}: Props) {
  const router = useRouter();

  const ownerFirst = profileData?.owner_name?.trim().split(/\s+/)[0] || null;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const subParts = [today];
  subParts.push(
    newLeadsThisWeek > 0
      ? `${newLeadsThisWeek} new lead${newLeadsThisWeek === 1 ? "" : "s"} this week`
      : "No new leads yet this week",
  );

  const reviewReady = Math.min(totalLeads, 5);

  return (
    <div style={{ color: INK }}>
      <style>{`
        .dash-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .dash-cols { display: grid; grid-template-columns: 1fr; gap: 22px; align-items: start; }
        @media (min-width: 880px) {
          .dash-stats { grid-template-columns: repeat(4, 1fr); }
        }
        @media (min-width: 1100px) {
          .dash-cols { grid-template-columns: 1fr 340px; }
        }
        .dash-lead-row { transition: background 0.12s ease; }
        .dash-lead-row:hover { background: #FBFAF7; }
      `}</style>

      {/* Greeting header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={businessName}
            style={{ width: 42, height: 42, borderRadius: 999, objectFit: "cover", flex: "none" }}
          />
        ) : (
          <div
            style={{
              width: 42, height: 42, borderRadius: 999, flex: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 800, color: "#fff",
              backgroundColor: avatarColor(businessName),
            }}
          >
            {initials(businessName)}
          </div>
        )}
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.015em", lineHeight: 1.2 }}>
            {getGreeting()}{ownerFirst ? `, ${ownerFirst}` : ""}.
          </h1>
          <div style={{ fontSize: 13.5, color: MUTED, marginTop: 4 }}>{subParts.join(" · ")}</div>
        </div>
      </div>

      {/* Profile completion chat */}
      {profileData && (
        <div style={{ marginBottom: 20 }}>
          <ProfileCompleter businessName={businessName} existing={profileData} />
        </div>
      )}

      {/* Stats */}
      <div className="dash-stats" style={{ marginBottom: 26 }}>
        <StatCard label="Page views" value={totalViews ?? 0} sub="Last 7 days" />
        <StatCard label="New leads" value={newLeadsThisWeek} sub="This week" />
        <StatCard label="Customers" value={totalLeads} sub="All time" />
        <StatCard
          label="Reviews"
          value={
            <>
              {googleReviewCount ?? 0}
              {googleRating ? <Stars rating={googleRating} /> : null}
            </>
          }
          sub={googleRating ? `${googleRating.toFixed(1)} average on Google` : "On Google"}
        />
      </div>

      <div className="dash-cols">
        {/* Recent leads */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Recent leads</h2>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: GRAY }}>
              {totalLeads} total
            </span>
          </div>

          {leads.length === 0 ? (
            <div
              style={{
                background: "#FFFFFF",
                border: "1px dashed #D8D4CC",
                borderRadius: 12,
                padding: "32px 20px",
                textAlign: "center",
              }}
            >
              <p style={{ margin: 0, fontSize: 13.5, color: GRAY }}>No leads yet.</p>
              <p style={{ margin: "6px 0 0", fontSize: 12.5, color: GRAY }}>
                Share your site and quiz funnel to start collecting leads.
              </p>
            </div>
          ) : (
            <div style={{ ...card, overflow: "hidden" }}>
              {leads.map((lead, i) => {
                const service = serviceFromLead(lead);
                return (
                  <button
                    key={lead.id}
                    className="dash-lead-row"
                    onClick={() => router.push(`/contractor/customers/${lead.id}`)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      width: "100%",
                      textAlign: "left",
                      padding: "13px 18px",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      borderTop: i > 0 ? `1px solid ${HAIRLINE}` : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 36, height: 36, borderRadius: 999, flex: "none",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: "#fff",
                        backgroundColor: avatarColor(lead.name),
                      }}
                    >
                      {initials(lead.name)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13.5, fontWeight: 700, color: INK, lineHeight: 1.3,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}
                      >
                        {lead.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12.5, color: GRAY, lineHeight: 1.35, marginTop: 1,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}
                      >
                        {service || "No service specified"}
                      </div>
                    </div>
                    <span
                      style={{
                        flex: "none",
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: MUTED,
                        background: "#F4F2EC",
                        borderRadius: 999,
                        padding: "3px 10px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {sourceLabel(lead.source)}
                    </span>
                    <span style={{ flex: "none", fontSize: 12.5, color: "#A3AAB5", fontWeight: 500, whiteSpace: "nowrap" }}>
                      {relativeTime(lead.created_at)}
                    </span>
                  </button>
                );
              })}
              {totalLeads > leads.length && (
                <Link
                  href="/contractor/customers"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "13px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: NAVY,
                    textDecoration: "none",
                    borderTop: `1px solid ${HAIRLINE}`,
                  }}
                >
                  View all {totalLeads} customers →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Side column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {totalLeads > 0 && (
            <div style={{ ...card, padding: "16px 18px" }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 6 }}>Reviews waiting</div>
              <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.55 }}>
                <strong style={{ color: INK }}>{reviewReady} customer{reviewReady === 1 ? "" : "s"}</strong>{" "}
                {reviewReady === 1 ? "is" : "are"} ready to leave a review.
              </div>
              <button
                style={{
                  marginTop: 12,
                  width: "100%",
                  background: AMBER,
                  color: "#42300A",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 800,
                  fontFamily: "inherit",
                  padding: "9px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Send reminder
              </button>
            </div>
          )}

          {hasDemoLeads && <DemoBanner />}

          <p style={{ textAlign: "center", fontSize: 12.5, color: "#A3AAB5", fontStyle: "italic", margin: "4px 0 0" }}>
            That&apos;s everything. Go do the work.
          </p>
        </div>
      </div>
    </div>
  );
}
