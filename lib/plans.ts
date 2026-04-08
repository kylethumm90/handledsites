"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ── Feature map ──────────────────────────────────────────────

export type PlanFeatures = {
  site: boolean;
  customDomain: boolean;
  extraPages: boolean;
  quizFunnels: boolean;
  removeBranding: boolean;
  pulseBasic: boolean;
  pulseFull: boolean;
  manualReviewLink: boolean;
  phoneNumber: boolean;
  textBack: boolean;
  manualReferralLink: boolean;
  textTemplates: boolean;
  reactivationList: boolean;
  ava: boolean;
  stella: boolean;
  voiceAI: boolean;
};

const FREE: PlanFeatures = {
  site: true,
  customDomain: false,
  extraPages: false,
  quizFunnels: false,
  removeBranding: false,
  pulseBasic: true,
  pulseFull: false,
  manualReviewLink: false,
  phoneNumber: false,
  textBack: false,
  manualReferralLink: false,
  textTemplates: false,
  reactivationList: false,
  ava: false,
  stella: false,
  voiceAI: false,
};

const SITES_PRO: PlanFeatures = {
  ...FREE,
  customDomain: true,
  extraPages: true,
  quizFunnels: true,
  removeBranding: true,
  pulseFull: true,
  manualReviewLink: true,
};

const TOOLS: PlanFeatures = {
  ...SITES_PRO,
  phoneNumber: true,
  textBack: true,
  manualReferralLink: true,
  textTemplates: true,
  reactivationList: true,
};

const AI: PlanFeatures = {
  ...TOOLS,
  ava: true,
  stella: true,
  voiceAI: true,
};

const FEATURES_BY_PLAN: Record<string, PlanFeatures> = {
  free: FREE,
  sites_pro: SITES_PRO,
  tools: TOOLS,
  ai: AI,
};

export function getPlanFeatures(plan: string): PlanFeatures {
  return FEATURES_BY_PLAN[plan] || FREE;
}

// ── Plan metadata ────────────────────────────────────────────

export const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  sites_pro: "Sites Pro",
  tools: "Tools",
  ai: "AI",
};

export const PLAN_PRICES: Record<string, number> = {
  free: 0,
  sites_pro: 29,
  tools: 79,
  ai: 149,
};

/** Ordered from lowest to highest */
export const PLAN_ORDER = ["free", "sites_pro", "tools", "ai"];

export function planRank(plan: string): number {
  return PLAN_ORDER.indexOf(plan);
}

/** Returns the minimum plan needed to unlock a given feature */
export function minimumPlanFor(feature: keyof PlanFeatures): string {
  for (const plan of PLAN_ORDER) {
    if (FEATURES_BY_PLAN[plan][feature]) return plan;
  }
  return "ai";
}

// ── React context + hook ─────────────────────────────────────

type PlanState = {
  plan: string;
  status: string;
  features: PlanFeatures;
  loading: boolean;
  refresh: () => void;
};

const PlanContext = createContext<PlanState>({
  plan: "free",
  status: "active",
  features: FREE,
  loading: true,
  refresh: () => {},
});

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState("free");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(true);

  const fetchPlan = () => {
    setLoading(true);
    fetch("/api/contractor/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setPlan(data.plan || "free");
          setStatus(data.status || "active");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  return (
    <PlanContext.Provider
      value={{
        plan,
        status,
        features: getPlanFeatures(plan),
        loading,
        refresh: fetchPlan,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function useCurrentPlan(): PlanState {
  return useContext(PlanContext);
}
