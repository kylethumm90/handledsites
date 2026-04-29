"use client";

/**
 * handled. — Reputation dashboard client
 *
 * Post-sale "handled. reputation" view. Shows feedback, Google reviews,
 * and customer advocates alongside a sticky Stella funnel.
 * Receives fully-shaped rows from the server component in
 * `./page.tsx`; all Supabase work happens there.
 */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ActivityLogEntry, Lead } from "@/lib/supabase";
import { colors, fonts } from "@/lib/design-system";
import ContactDetailModal from "@/components/pipeline/contact-detail-modal";

// ---------------------------------------------------------------------------
// Shared types (also re-exported for server page.tsx)
// ---------------------------------------------------------------------------

export type TimeRange = "7d" | "30d" | "90d" | "All";

export type SurveyAnswers = {
  rating: number;
  feedback: string;
  techName: string | null;
  professionalism: string | null;
  communication: string | null;
};

export type FeedbackItem = {
  id: string;
  leadId: string | null;
  name: string;
  initials: string;
  job: string;
  time: string;
  emoji: string;
  label: string;
  comment: string;
  sentiment: number;
  reviewSent: boolean;
  survey: SurveyAnswers;
};

export type ReviewStatus = "posted" | "awaiting review" | "needs attention";

export type ReviewItem = {
  id: string;
  name: string;
  initials: string;
  job: string;
  source: string;
  time: string;
  rating: number | null;
  status: ReviewStatus;
  text: string;
  sentiment: number;
  alert?: string;
  externalUrl: string | null;
};

export type AdvocatePartner = {
  id: string;
  leadId: string | null;
  name: string;
  initials: string;
  joinedAt: string;
  joinedLabel: string;
  submitted: number;
  successful: number;
  revenueLabel: string | null;
};

export type AdvocatesData = {
  newAdvocates: AdvocatePartner[];
  rankedAdvocates: AdvocatePartner[];
};

export type FunnelColorKey = "navy" | "blue" | "amber" | "green";

export type FunnelStep = {
  label: string;
  value: number;
  colorKey: FunnelColorKey;
};

/**
 * Per-partner stats shipped server-side from page.tsx so the contact
 * modal's referral activity card has its data the moment a leaderboard
 * row is tapped — no extra round trip. Keyed by lead id (customer_id on
 * the referral_partners row), identical to the shape the pipeline page
 * passes to PipelineV2.
 */
export type ReferralStats = {
  referralCode: string;
  partnerSince: string;
  clicks: number;
  leads: number;
  lastActivityAt: string;
};

export type ReputationData = {
  companyName: string;
  range: TimeRange;
  stats: {
    feedback: number;
    reviews: number;
    avgRating: number;
    advocates: number;
  };
  advocateRevenue: {
    amount: string;
    conversionPct: number;
  };
  funnel: FunnelStep[];
  feedback: FeedbackItem[];
  reviews: ReviewItem[];
  advocates: AdvocatesData;
  referralStatsByLead: Record<string, ReferralStats>;
  referralRewardCents: number | null;
};

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

type FilterKey = "feedback" | "reviews" | "advocates";

const TIME_RANGES: TimeRange[] = ["7d", "30d", "90d", "All"];

const REVIEW_STATUS_COLOR: Record<ReviewStatus, string> = {
  posted: colors.green,
  "awaiting review": colors.amber,
  "needs attention": colors.red,
};

const FUNNEL_COLOR: Record<FunnelColorKey, string> = {
  navy: colors.navy,
  blue: colors.blue,
  amber: colors.amber,
  green: colors.green,
};

const STELLA_FUNNEL_HEIGHT = 76;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReputationClient({ data }: { data: ReputationData }) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("reviews");
  const [openSurvey, setOpenSurvey] = useState<FeedbackItem | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedLeadError, setSelectedLeadError] = useState<string | null>(
    null
  );
  const [activitiesByLead, setActivitiesByLead] = useState<
    Record<string, ActivityLogEntry[]>
  >({});
  const router = useRouter();

  function setRange(next: TimeRange) {
    if (next === data.range) return;
    const params = new URLSearchParams();
    if (next !== "30d") params.set("range", next);
    const qs = params.toString();
    router.push(`/contractor/reputation${qs ? `?${qs}` : ""}`);
  }

  function openContact(leadId: string | null | undefined) {
    if (!leadId) return;
    setSelectedLeadError(null);
    setSelectedLead(null);
    setSelectedLeadId(leadId);
  }

  // Fetch the Lead + its activity log when a customer row is tapped.
  useEffect(() => {
    if (!selectedLeadId) return;
    let cancelled = false;
    (async () => {
      try {
        const [leadRes, actRes] = await Promise.all([
          fetch(`/api/contractor/customers/${selectedLeadId}`, {
            cache: "no-store",
          }),
          fetch(`/api/contractor/customers/${selectedLeadId}/activities`, {
            cache: "no-store",
          }),
        ]);
        if (!leadRes.ok) {
          throw new Error("Couldn't load customer.");
        }
        const { lead } = (await leadRes.json()) as { lead: Lead };
        if (cancelled) return;
        setSelectedLead(lead);
        if (actRes.ok) {
          const { activities } = (await actRes.json()) as {
            activities?: ActivityLogEntry[];
          };
          setActivitiesByLead((prev) => ({
            ...prev,
            [selectedLeadId]: activities ?? [],
          }));
        }
      } catch (err) {
        if (cancelled) return;
        setSelectedLeadError(
          err instanceof Error ? err.message : "Couldn't load customer."
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedLeadId]);

  return (
    <div
      style={{
        background: "#FAFAFA",
        fontFamily: fonts.body,
        color: colors.navy,
        minHeight: "100vh",
        paddingBottom: STELLA_FUNNEL_HEIGHT,
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 20px 0" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: colors.blue,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 2,
            fontFamily: fonts.body,
          }}
        >
          Reputation
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#1C1B18",
            lineHeight: 1.2,
            fontFamily: fonts.body,
          }}
        >
          {data.companyName}
        </div>
      </div>

      {/* Stats row — also acts as the filter tabs */}
      <div
        style={{
          display: "flex",
          margin: "14px 20px 0",
          background: colors.white,
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
          overflow: "hidden",
        }}
      >
        <StatBox
          value={String(data.stats.feedback)}
          label="Feedback"
          color={colors.green}
          border
          active={activeFilter === "feedback"}
          onClick={() => setActiveFilter("feedback")}
        />
        <StatBox
          value={String(data.stats.reviews)}
          label="Reviews"
          color="#1C1B18"
          border
          active={activeFilter === "reviews"}
          onClick={() => setActiveFilter("reviews")}
        />
        <StatBox
          value={data.stats.avgRating > 0 ? data.stats.avgRating.toFixed(1) : "—"}
          label="Avg Rating"
          color={colors.amber}
          border
        />
        <StatBox
          value={String(data.stats.advocates)}
          label="Advocates"
          color={colors.green}
          active={activeFilter === "advocates"}
          onClick={() => setActiveFilter("advocates")}
        />
      </div>

      {/* Time filter */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "12px 20px 0",
          justifyContent: "flex-end",
        }}
      >
        {TIME_RANGES.map((t) => {
          const active = data.range === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setRange(t)}
              style={{
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                border: `1px solid ${active ? colors.navy : colors.border}`,
                borderRadius: 4,
                background: active ? colors.navy : colors.white,
                color: active ? colors.white : colors.muted,
                cursor: "pointer",
                fontFamily: fonts.body,
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: "16px 20px 24px" }}>
        {activeFilter === "reviews" &&
          (data.reviews.length > 0 ? (
            data.reviews.map((r) => <ReviewCard key={r.id} review={r} />)
          ) : (
            <EmptyState
              title="No reviews yet"
              body="Reviews will appear here as customers complete the feedback funnel."
            />
          ))}

        {activeFilter === "feedback" &&
          (data.feedback.length > 0 ? (
            data.feedback.map((f) => (
              <FeedbackCard
                key={f.id}
                item={f}
                onOpenContact={() => openContact(f.leadId)}
                onViewSurvey={() => setOpenSurvey(f)}
              />
            ))
          ) : (
            <EmptyState
              title="No feedback yet"
              body="Completed post-job surveys will show up here."
            />
          ))}

        {activeFilter === "advocates" && (
          <AdvocatesPanel
            revenue={data.advocateRevenue}
            advocates={data.advocates}
            onOpenContact={openContact}
          />
        )}
      </div>

      <StellaFunnel steps={data.funnel} />

      {openSurvey && (
        <SurveyModal item={openSurvey} onClose={() => setOpenSurvey(null)} />
      )}

      {selectedLeadId && selectedLead && (
        <ContactDetailModal
          lead={selectedLead}
          activities={activitiesByLead[selectedLeadId]}
          referralStats={data.referralStatsByLead[selectedLeadId] ?? null}
          referralRewardCents={data.referralRewardCents}
          businessName={data.companyName}
          onUpdate={() => {
            setActivitiesByLead((prev) => {
              const next = { ...prev };
              delete next[selectedLeadId];
              return next;
            });
            router.refresh();
          }}
          onNoteAdded={(entry) => {
            setActivitiesByLead((prev) => {
              const existing = prev[selectedLeadId] ?? [];
              return { ...prev, [selectedLeadId]: [...existing, entry] };
            });
          }}
          onClose={() => {
            setSelectedLeadId(null);
            setSelectedLead(null);
            setSelectedLeadError(null);
          }}
        />
      )}

      {selectedLeadId && !selectedLead && selectedLeadError && (
        <ErrorToast
          message={selectedLeadError}
          onClose={() => {
            setSelectedLeadId(null);
            setSelectedLeadError(null);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stats row
// ---------------------------------------------------------------------------

function StatBox({
  value,
  label,
  color,
  border,
  active,
  onClick,
}: {
  value: string;
  label: string;
  color: string;
  border?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  const clickable = typeof onClick === "function";
  const Wrapper = clickable ? "button" : "div";
  return (
    <Wrapper
      type={clickable ? "button" : undefined}
      aria-pressed={clickable ? !!active : undefined}
      onClick={onClick}
      style={{
        flex: 1,
        textAlign: "center",
        padding: "12px 4px 10px",
        borderRight: border ? `1px solid ${colors.border}` : "none",
        background: active ? "#F1F5F9" : "transparent",
        borderTop: active
          ? `2px solid ${colors.navy}`
          : "2px solid transparent",
        cursor: clickable ? "pointer" : "default",
        fontFamily: fonts.body,
        color: "inherit",
      }}
    >
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color,
          fontFamily: fonts.body,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: active ? colors.navy : colors.muted,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginTop: 4,
          fontFamily: fonts.body,
        }}
      >
        {label}
      </div>
    </Wrapper>
  );
}

// ---------------------------------------------------------------------------
// Shared card pieces
// ---------------------------------------------------------------------------

function Card({
  children,
  accentColor,
}: {
  children: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <div
      style={{
        background: colors.white,
        borderRadius: 10,
        border: `1px solid ${colors.border}`,
        borderLeft: accentColor
          ? `3px solid ${accentColor}`
          : `1px solid ${colors.border}`,
        padding: "16px 18px",
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function Avatar({ initials, size = 40 }: { initials: string; size?: number }) {
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#F1F5F9",
        border: `1px solid ${colors.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.32,
        fontWeight: 700,
        color: colors.muted,
        flexShrink: 0,
        fontFamily: fonts.body,
      }}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        fontFamily: fonts.body,
      }}
    >
      {label}
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ fontSize: 14, letterSpacing: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{ color: i <= rating ? "#FBBF24" : colors.border }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function SentimentBar({ score }: { score: number }) {
  const color =
    score >= 80 ? colors.green : score >= 60 ? colors.amber : colors.red;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
      }}
    >
      <div
        style={{
          flex: 1,
          height: 4,
          background: "#F8F8F8",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: "100%",
            background: color,
            borderRadius: 2,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color,
          minWidth: 28,
          fontFamily: fonts.body,
        }}
      >
        {score}
      </span>
    </div>
  );
}

function ActionButtons({
  primary,
  secondary,
  onPrimary,
  onSecondary,
  primaryDisabled,
  secondaryDisabled,
}: {
  primary: string;
  secondary: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  primaryDisabled?: boolean;
  secondaryDisabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <button
        type="button"
        onClick={onPrimary}
        disabled={primaryDisabled}
        style={{
          flex: 1,
          padding: "12px 0",
          background: colors.navy,
          color: colors.white,
          border: "none",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 700,
          cursor: primaryDisabled ? "not-allowed" : "pointer",
          opacity: primaryDisabled ? 0.5 : 1,
          letterSpacing: "0.05em",
          fontFamily: fonts.body,
        }}
      >
        {primary}
      </button>
      <button
        type="button"
        onClick={onSecondary}
        disabled={secondaryDisabled}
        style={{
          flex: 1,
          padding: "12px 0",
          background: colors.white,
          color: colors.navy,
          border: `1px solid ${colors.border}`,
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 700,
          cursor: secondaryDisabled ? "not-allowed" : "pointer",
          opacity: secondaryDisabled ? 0.5 : 1,
          letterSpacing: "0.05em",
          fontFamily: fonts.body,
        }}
      >
        {secondary}
      </button>
    </div>
  );
}

function ClickableAvatar({
  initials,
  onClick,
}: {
  initials: string;
  onClick?: () => void;
}) {
  if (!onClick) return <Avatar initials={initials} />;
  return (
    <button
      type="button"
      aria-label="Open customer details"
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
      }}
    >
      <Avatar initials={initials} />
    </button>
  );
}

function ClickableName({
  name,
  onClick,
}: {
  name: string;
  onClick?: () => void;
}) {
  if (!onClick) return <div style={bodyRowName}>{name}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...bodyRowName,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      {name}
    </button>
  );
}

const bodyRowMeta: React.CSSProperties = {
  fontSize: 12,
  color: colors.muted,
  marginTop: 1,
  fontFamily: fonts.body,
};

const bodyRowName: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: "#1C1B18",
  fontFamily: fonts.body,
};

const greyContentBox: React.CSSProperties = {
  marginTop: 8,
  padding: "10px 12px",
  background: "#F8F8F8",
  borderRadius: 6,
  fontSize: 13,
  lineHeight: 1.5,
  color: "#374151",
  fontFamily: fonts.body,
};

// ---------------------------------------------------------------------------
// Review card
// ---------------------------------------------------------------------------

function ReviewCard({ review }: { review: ReviewItem }) {
  const statusColor = REVIEW_STATUS_COLOR[review.status];
  const isAttention = review.status === "needs attention";
  const canOpenExternal = !isAttention && !!review.externalUrl;
  return (
    <Card accentColor={statusColor}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <Avatar initials={review.initials} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={bodyRowName}>{review.name}</div>
              <div style={bodyRowMeta}>
                {review.job} · {review.source} · {review.time}
              </div>
            </div>
            <StatusBadge label={review.status} color={statusColor} />
          </div>
          {review.rating !== null && (
            <div style={{ marginTop: 8 }}>
              <Stars rating={review.rating} />
            </div>
          )}
          <div style={greyContentBox}>{review.text}</div>
          {review.alert && (
            <div
              style={{
                marginTop: 8,
                padding: "8px 12px",
                background:
                  statusColor === colors.red
                    ? "rgba(220,38,38,0.06)"
                    : "rgba(232,146,13,0.08)",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                color: statusColor,
                fontFamily: fonts.body,
              }}
            >
              {review.alert}
            </div>
          )}
          <SentimentBar score={review.sentiment} />
          <ActionButtons
            primary={isAttention ? "CALL" : "VIEW"}
            secondary={isAttention ? "ASSIGN REP" : "SHARE"}
            primaryDisabled={!isAttention && !canOpenExternal}
            onPrimary={
              canOpenExternal
                ? () =>
                    window.open(
                      review.externalUrl!,
                      "_blank",
                      "noopener,noreferrer"
                    )
                : undefined
            }
          />
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Feedback card
// ---------------------------------------------------------------------------

function FeedbackCard({
  item,
  onOpenContact,
  onViewSurvey,
}: {
  item: FeedbackItem;
  onOpenContact: () => void;
  onViewSurvey: () => void;
}) {
  const sentColor =
    item.sentiment >= 80
      ? colors.green
      : item.sentiment >= 60
        ? colors.amber
        : colors.red;
  const canOpenContact = !!item.leadId;
  return (
    <Card accentColor={sentColor}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <ClickableAvatar
          initials={item.initials}
          onClick={canOpenContact ? onOpenContact : undefined}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <ClickableName
                name={item.name}
                onClick={canOpenContact ? onOpenContact : undefined}
              />
              <div style={bodyRowMeta}>
                {item.job} · {item.time}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 20,
              }}
            >
              <span>{item.emoji}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: colors.muted,
                  fontFamily: fonts.body,
                }}
              >
                {item.label}
              </span>
            </div>
          </div>
          {item.comment && (
            <div style={greyContentBox}>&ldquo;{item.comment}&rdquo;</div>
          )}
          <SentimentBar score={item.sentiment} />
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: item.reviewSent ? colors.green : colors.mutedLight,
              fontWeight: 600,
              fontFamily: fonts.body,
            }}
          >
            {item.reviewSent
              ? "✓ Review link sent"
              : "Review link not sent — sentiment too low"}
          </div>
          <ActionButtons
            primary={item.sentiment < 60 ? "CALL" : "NUDGE REVIEW"}
            secondary={item.sentiment < 60 ? "ASSIGN REP" : "VIEW SURVEY"}
            onSecondary={item.sentiment < 60 ? undefined : onViewSurvey}
          />
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Referral card + Revenue summary
// ---------------------------------------------------------------------------

function RevenueSummary({
  amount,
  conversionPct,
}: {
  amount: string;
  conversionPct: number;
}) {
  return (
    <div
      style={{
        background: colors.white,
        borderRadius: 10,
        border: `1px solid ${colors.border}`,
        padding: "14px 16px",
        marginBottom: 14,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: colors.muted,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontFamily: fonts.body,
          }}
        >
          Advocate Revenue (30d)
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: colors.green,
            marginTop: 2,
            fontFamily: fonts.body,
          }}
        >
          {amount}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: colors.muted,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontFamily: fonts.body,
          }}
        >
          Conversion
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#1C1B18",
            marginTop: 2,
            fontFamily: fonts.body,
          }}
        >
          {conversionPct}%
        </div>
      </div>
    </div>
  );
}

function AdvocatesPanel({
  revenue,
  advocates,
  onOpenContact,
}: {
  revenue: { amount: string; conversionPct: number };
  advocates: AdvocatesData;
  onOpenContact: (leadId: string | null) => void;
}) {
  const hasAny =
    advocates.newAdvocates.length > 0 || advocates.rankedAdvocates.length > 0;

  return (
    <>
      <RevenueSummary
        amount={revenue.amount}
        conversionPct={revenue.conversionPct}
      />

      {!hasAny && (
        <EmptyState
          title="No advocates yet"
          body="When customers enroll via your referral link, they'll show up here."
        />
      )}

      {advocates.newAdvocates.length > 0 && (
        <AdvocateSection
          title="New advocates"
          subtitle="Joined in the last 7 days"
        >
          {advocates.newAdvocates.map((a) => (
            <AdvocateRow
              key={a.id}
              partner={a}
              onClick={() => onOpenContact(a.leadId)}
              trailing={
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: colors.green,
                    fontFamily: fonts.body,
                  }}
                >
                  NEW
                </span>
              }
              subtext={`Joined ${a.joinedLabel}`}
            />
          ))}
        </AdvocateSection>
      )}

      {advocates.rankedAdvocates.length > 0 && (
        <AdvocateSection
          title="Top advocates"
          subtitle="Ranked by successful referrals"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: colors.muted,
              padding: "8px 14px",
              borderBottom: `1px solid ${colors.border}`,
              background: "#F8F8F8",
              fontFamily: fonts.body,
              columnGap: 18,
            }}
          >
            <span>Partner</span>
            <span style={{ textAlign: "right" }}>Submitted</span>
            <span style={{ textAlign: "right" }}>Successful</span>
          </div>
          {advocates.rankedAdvocates.map((a, i) => (
            <AdvocateRow
              key={a.id}
              partner={a}
              onClick={() => onOpenContact(a.leadId)}
              showBorder={i > 0}
              trailing={
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto auto",
                    columnGap: 18,
                    alignItems: "baseline",
                    fontFamily: fonts.body,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: colors.navy,
                      textAlign: "right",
                      minWidth: 28,
                    }}
                  >
                    {a.submitted}
                  </span>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: a.successful > 0 ? colors.green : colors.mutedLight,
                      textAlign: "right",
                      minWidth: 28,
                    }}
                  >
                    {a.successful}
                  </span>
                </div>
              }
              subtext={a.revenueLabel ? `${a.revenueLabel} closed` : null}
            />
          ))}
        </AdvocateSection>
      )}
    </>
  );
}

function AdvocateSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 6,
          padding: "0 2px",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#1C1B18",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontFamily: fonts.body,
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: 10,
            color: colors.muted,
            fontFamily: fonts.body,
          }}
        >
          {subtitle}
        </span>
      </div>
      <div
        style={{
          background: colors.white,
          border: `1px solid ${colors.border}`,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function AdvocateRow({
  partner,
  onClick,
  trailing,
  subtext,
  showBorder,
}: {
  partner: AdvocatePartner;
  onClick: () => void;
  trailing: React.ReactNode;
  subtext: string | null;
  showBorder?: boolean;
}) {
  const clickable = !!partner.leadId;
  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: "transparent",
        border: "none",
        borderTop: showBorder ? `1px solid ${colors.border}` : "none",
        cursor: clickable ? "pointer" : "default",
        textAlign: "left",
        fontFamily: fonts.body,
        color: "inherit",
      }}
    >
      <Avatar initials={partner.initials} size={34} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#1C1B18",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: fonts.body,
          }}
        >
          {partner.name}
        </div>
        {subtext && (
          <div
            style={{
              fontSize: 11,
              color: colors.muted,
              marginTop: 1,
              fontFamily: fonts.body,
            }}
          >
            {subtext}
          </div>
        )}
      </div>
      {trailing}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        background: colors.white,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        padding: "28px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#1C1B18",
          marginBottom: 4,
          fontFamily: fonts.body,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 12,
          color: colors.muted,
          lineHeight: 1.5,
          fontFamily: fonts.body,
        }}
      >
        {body}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Survey modal (VIEW SURVEY button)
// ---------------------------------------------------------------------------

function SurveyModal({
  item,
  onClose,
}: {
  item: FeedbackItem;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 60,
        padding: "40px 16px 16px",
      }}
    >
      <div
        role="dialog"
        aria-label="Survey response"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          background: colors.white,
          borderRadius: 12,
          padding: "18px 20px 22px",
          fontFamily: fonts.body,
          color: colors.navy,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: colors.muted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Survey response
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, marginTop: 2 }}>
              {item.name}
            </div>
            <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
              {item.job} · {item.time}
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 22,
              lineHeight: 1,
              cursor: "pointer",
              color: colors.muted,
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            background: "#F8F8F8",
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 22 }}>{item.emoji}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{item.label}</div>
            <div style={{ fontSize: 11, color: colors.muted }}>
              Rating: {item.survey.rating || "—"} / 5
            </div>
          </div>
        </div>

        <SurveyField label="Feedback" value={item.survey.feedback} />
        <SurveyField label="Technician" value={item.survey.techName} />
        <SurveyField
          label="Professionalism"
          value={item.survey.professionalism}
        />
        <SurveyField label="Communication" value={item.survey.communication} />
      </div>
    </div>
  );
}

function SurveyField({ label, value }: { label: string; value: string | null }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: colors.muted,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: value ? colors.navy : colors.mutedLight,
          fontStyle: value ? "normal" : "italic",
        }}
      >
        {value || "Not answered"}
      </div>
    </div>
  );
}

function ErrorToast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 70,
        padding: "0 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          padding: "10px 14px",
          background: colors.white,
          border: `1px solid ${colors.border}`,
          borderLeft: `3px solid ${colors.red}`,
          borderRadius: 8,
          fontFamily: fonts.body,
          fontSize: 13,
          color: colors.navy,
          boxShadow: "0 4px 16px rgba(15,23,42,0.12)",
        }}
      >
        <span>{message}</span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontSize: 16,
            color: colors.muted,
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stella funnel (sticky bottom)
// ---------------------------------------------------------------------------

function StellaFunnel({ steps }: { steps: FunnelStep[] }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: colors.white,
        borderTop: `1px solid ${colors.border}`,
        padding: "10px 20px 12px",
        zIndex: 40,
      }}
    >
      <div
        style={{
          maxWidth: 420,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 11,
            fontWeight: 600,
            color: colors.muted,
            fontFamily: fonts.body,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: 6,
          }}
        >
          <span>Stella Funnel</span>
          <span
            style={{
              color: colors.mutedLight,
              fontWeight: 500,
              fontSize: 10,
            }}
          >
            Last 30 days
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {steps.map((step, i) => (
            <div
              key={step.label}
              style={{ display: "flex", alignItems: "center", flex: 1 }}
            >
              <div style={{ textAlign: "center", flex: 1 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: FUNNEL_COLOR[step.colorKey],
                    lineHeight: 1,
                    fontFamily: fonts.body,
                  }}
                >
                  {step.value}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: colors.muted,
                    marginTop: 2,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    fontFamily: fonts.body,
                  }}
                >
                  {step.label}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div
                  style={{
                    color: colors.mutedLight,
                    fontSize: 12,
                    fontWeight: 300,
                    padding: "0 2px",
                  }}
                >
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
