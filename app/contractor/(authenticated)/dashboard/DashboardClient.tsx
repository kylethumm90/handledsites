"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Lead } from "@/lib/supabase";
import { relativeTime, avatarColor, initials } from "@/lib/utils";
import ProfileCompleter from "@/components/ProfileCompleter";

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
    <span style={{ display: "inline-flex", gap: 1, marginLeft: 4, position: "relative", top: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 20 20" fill={i <= Math.round(rating) ? "#d99a1e" : "#ddd"}>
          <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.27 5.06 16.7 6 11.21 2 7.31l5.53-.8z" />
        </svg>
      ))}
    </span>
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
  profileData,
}: Props) {
  const router = useRouter();

  return (
    <div className="space-y-5">
      {/* Greeting header */}
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <img src={logoUrl} alt={businessName} className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ backgroundColor: avatarColor(businessName) }}>
            {initials(businessName)}
          </div>
        )}
        <div>
          <p className="text-sm text-gray-400">{getGreeting()}</p>
          <h1 className="text-xl font-bold text-gray-900" style={{ letterSpacing: "-0.02em" }}>
            {businessName}
          </h1>
        </div>
      </div>

      {/* Profile completion chat */}
      {profileData && (
        <ProfileCompleter businessName={businessName} existing={profileData} />
      )}

      {/* Stats row */}
      <div style={{ display: "flex", border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ flex: 1, padding: "16px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{totalViews ?? 0}</div>
          <div style={{ fontSize: 11, color: "#999", fontWeight: 500, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.03em" }}>Page views</div>
        </div>
        <div style={{ flex: 1, padding: "16px 14px", textAlign: "center", borderLeft: "1px solid #eee" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{newLeadsThisWeek}</div>
          <div style={{ fontSize: 11, color: "#999", fontWeight: 500, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.03em" }}>New leads</div>
        </div>
        <div style={{ flex: 1, padding: "16px 14px", textAlign: "center", borderLeft: "1px solid #eee" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{totalLeads}</div>
          <div style={{ fontSize: 11, color: "#999", fontWeight: 500, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.03em" }}>Customers</div>
        </div>
        <div style={{ flex: 1, padding: "16px 14px", textAlign: "center", borderLeft: "1px solid #eee" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            {googleReviewCount ?? 0}
            {googleRating ? <Stars rating={googleRating} /> : null}
          </div>
          <div style={{ fontSize: 11, color: "#999", fontWeight: 500, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.03em" }}>Reviews</div>
        </div>
      </div>

      {/* Review nudge */}
      {totalLeads > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, fontSize: 13 }}>
          <div>
            <span style={{ fontWeight: 600, color: "#111" }}>{Math.min(totalLeads, 5)} customers</span>
            <span style={{ color: "#666" }}> are ready to leave a review.</span>
          </div>
          <button style={{ background: "#111", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap" }}>
            Send reminder
          </button>
        </div>
      )}

      {/* Recent leads */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#bbb", letterSpacing: "0.05em", marginBottom: 8, textTransform: "uppercase" }}>
          Recent leads
        </p>

        {leads.length === 0 ? (
          <div style={{ border: "1px solid #eee", borderRadius: 10, padding: "40px 20px", textAlign: "center" }}>
            <p className="text-sm text-gray-400">No leads yet.</p>
            <p className="mt-1 text-xs text-gray-400">
              Share your site and quiz funnel to start collecting leads.
            </p>
          </div>
        ) : (
          <>
            <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
              {leads.map((lead, i) => {
                const service = serviceFromLead(lead);
                const color = avatarColor(lead.name);

                return (
                  <button
                    key={lead.id}
                    onClick={() => router.push(`/contractor/customers/${lead.id}`)}
                    className="flex w-full items-center gap-3 text-left hover:bg-gray-50"
                    style={{
                      padding: "12px 14px",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      borderBottom: i < leads.length - 1 ? "1px solid #f2f2f2" : "none",
                    }}
                  >
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {initials(lead.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#111" }} className="truncate">
                        {lead.name}
                      </p>
                      <p style={{ fontSize: 12, color: "#aaa", marginTop: 1 }} className="truncate">
                        {service || "No service specified"}
                        <span style={{ margin: "0 4px", color: "#ddd" }}>&middot;</span>
                        {sourceLabel(lead.source)}
                      </p>
                    </div>
                    <span style={{ fontSize: 12, color: "#ccc", fontWeight: 500, flexShrink: 0 }}>
                      {relativeTime(lead.created_at)}
                    </span>
                  </button>
                );
              })}
            </div>

            {totalLeads > leads.length && (
              <Link
                href="/contractor/customers"
                style={{ display: "block", textAlign: "center", padding: 14, fontSize: 13, color: "#888" }}
              >
                View all {totalLeads} customers
              </Link>
            )}
          </>
        )}
      </div>

      {/* Closing line */}
      <p style={{ textAlign: "center", fontSize: 13, color: "#ddd", fontStyle: "italic", paddingTop: 8 }}>
        That&apos;s everything. Go do the work.
      </p>
    </div>
  );
}
