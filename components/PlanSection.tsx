"use client";

import { useState } from "react";
import {
  PLAN_NAMES,
  PLAN_PRICES,
  PLAN_ORDER,
  getPlanFeatures,
  planRank,
  type PlanFeatures,
} from "@/lib/plans";

type Props = {
  plan: string;
  status: string;
  hasStripeCustomer: boolean;
};

const FEATURE_LABELS: { key: keyof PlanFeatures; label: string }[] = [
  { key: "site", label: "Business site" },
  { key: "pulseBasic", label: "Basic analytics" },
  { key: "customDomain", label: "Custom domain" },
  { key: "extraPages", label: "Additional pages" },
  { key: "quizFunnels", label: "Quiz funnels" },
  { key: "removeBranding", label: "Remove branding" },
  { key: "pulseFull", label: "Full analytics" },
  { key: "manualReviewLink", label: "Review link" },
  { key: "phoneNumber", label: "Business phone number" },
  { key: "textBack", label: "Text back" },
  { key: "textTemplates", label: "Text templates" },
  { key: "reactivationList", label: "Reactivation list" },
  { key: "manualReferralLink", label: "Referral link" },
  { key: "ava", label: "Ava AI assistant" },
  { key: "stella", label: "Stella AI onboarding" },
  { key: "voiceAI", label: "Voice AI" },
];

export default function PlanSection({ plan, status, hasStripeCustomer }: Props) {
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [managing, setManaging] = useState(false);
  const features = getPlanFeatures(plan);
  const currentRank = planRank(plan);
  const price = PLAN_PRICES[plan] || 0;

  const handleUpgrade = async (targetPlan: string) => {
    setUpgrading(targetPlan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setUpgrading(null);
    }
  };

  const handleManage = async () => {
    setManaging(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setManaging(false);
    }
  };

  return (
    <div>
      {/* Current plan */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px",
        background: "#fff",
        border: "1px solid #e5e5ea",
        borderRadius: 12,
        marginBottom: 12,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            Current plan
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1c1c1e", marginTop: 4, letterSpacing: "-0.02em" }}>
            {PLAN_NAMES[plan] || "Free"}
            {price > 0 && (
              <span style={{ fontSize: 14, fontWeight: 500, color: "#8e8e93", marginLeft: 8 }}>
                ${price}/mo
              </span>
            )}
          </div>
          {status === "past_due" && (
            <div style={{ fontSize: 12, color: "#ff3b30", fontWeight: 600, marginTop: 4 }}>
              Payment past due
            </div>
          )}
          {status === "canceled" && (
            <div style={{ fontSize: 12, color: "#ff9500", fontWeight: 600, marginTop: 4 }}>
              Cancels at period end
            </div>
          )}
        </div>
        {hasStripeCustomer && (
          <button
            onClick={handleManage}
            disabled={managing}
            style={{
              background: "#f2f2f7",
              color: "#1c1c1e",
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 14px",
              borderRadius: 8,
              cursor: managing ? "default" : "pointer",
              opacity: managing ? 0.5 : 1,
            }}
          >
            {managing ? "Loading..." : "Manage billing"}
          </button>
        )}
      </div>

      {/* Feature list */}
      <div style={{
        padding: "12px 16px",
        background: "#fff",
        border: "1px solid #e5e5ea",
        borderRadius: 12,
        marginBottom: 12,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 10 }}>
          Included features
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
          {FEATURE_LABELS.map(({ key, label }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <span style={{ color: features[key] ? "#34c759" : "#d1d1d6" }}>
                {features[key] ? "\u2713" : "\u2013"}
              </span>
              <span style={{ color: features[key] ? "#1c1c1e" : "#c7c7cc" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade options */}
      {currentRank < PLAN_ORDER.length - 1 && (
        <div style={{
          display: "flex",
          gap: 8,
        }}>
          {PLAN_ORDER.slice(currentRank + 1).map((p) => (
            <button
              key={p}
              onClick={() => handleUpgrade(p)}
              disabled={upgrading !== null}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 10,
                background: p === PLAN_ORDER[currentRank + 1] ? "#007aff" : "#f2f2f7",
                color: p === PLAN_ORDER[currentRank + 1] ? "#fff" : "#1c1c1e",
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                cursor: upgrading ? "default" : "pointer",
                opacity: upgrading === p ? 0.5 : 1,
              }}
            >
              {upgrading === p ? "Loading..." : `${PLAN_NAMES[p]} · $${PLAN_PRICES[p]}/mo`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
