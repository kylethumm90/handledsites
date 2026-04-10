"use client";

import { useState } from "react";
import { useCurrentPlan, minimumPlanFor, PLAN_NAMES, type PlanFeatures } from "@/lib/plans";
import PlanChangeModal from "./PlanChangeModal";

type Props = {
  feature: keyof PlanFeatures;
  featureLabel: string;
};

export default function UpgradeBanner({ feature, featureLabel }: Props) {
  const { plan, features, loading } = useCurrentPlan();
  const [upgrading, setUpgrading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  if (loading || features[feature]) return null;

  const requiredPlan = minimumPlanFor(feature);
  const planName = PLAN_NAMES[requiredPlan] || requiredPlan;

  const handleConfirm = async () => {
    setUpgrading(true);
    setShowModal(false);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: requiredPlan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        window.location.href = "/contractor/settings?upgraded=true";
      }
    } catch {
      setUpgrading(false);
    }
  };

  return (
    <>
      {showModal && (
        <PlanChangeModal
          currentPlan={plan}
          targetPlan={requiredPlan}
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(false)}
        />
      )}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "14px 16px",
        background: "#f9f9fb",
        border: "1px solid #e5e5ea",
        borderRadius: 12,
        marginBottom: 16,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1c1c1e" }}>
            Unlock {featureLabel}
          </div>
          <div style={{ fontSize: 13, color: "#8e8e93", marginTop: 2 }}>
            Available on the {planName} plan.
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={upgrading}
          style={{
            background: "#007aff",
            color: "#fff",
            border: "none",
            fontSize: 13,
            fontWeight: 600,
            padding: "8px 16px",
            borderRadius: 8,
            cursor: upgrading ? "default" : "pointer",
            opacity: upgrading ? 0.5 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {upgrading ? "Loading..." : `Upgrade to ${planName}`}
        </button>
      </div>
    </>
  );
}
