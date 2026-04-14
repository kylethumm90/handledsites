import type { ReputationDashboardData } from "./types";

// Mock data mirrors the provided mockup exactly. Swap this import in
// `page.tsx` for a Supabase fetcher once reputation tables exist.
export const MOCK_REPUTATION: ReputationDashboardData = {
  metrics: {
    sentimentScore: 82,
    sentimentTrend: "up",
    reviewsReceived: 12,
    reviewsRequested: 40,
    avgRating: 4.8,
    referralRevenueCents: 1_245_000,
    recoveryAlertCount: 3,
  },
  criticalRecovery: [
    {
      id: "rec-brian-walsh",
      customerName: "Brian Walsh",
      projectLabel: "Project: Roof Replacement",
      quote:
        "The crew left debris all over my lawn and didn't finish the flashing around the chimney. I've called twice and no one is getting back to me.",
      sentimentScore: 24,
      severity: "immediate",
    },
  ],
  recentActivity: [
    {
      id: "act-jessica-thumm",
      customerName: "Jessica Thumm",
      avatarUrl: null,
      status: "reviewed",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      rating: 5.0,
      sentimentScore: 92,
    },
    {
      id: "act-marcus-rivera",
      customerName: "Marcus Rivera",
      avatarUrl: null,
      status: "pending",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      requestSent: true,
      predictedSentiment: 78,
    },
  ],
  funnel: [
    { key: "jobs", label: "Jobs Done", index: 1, count: 40 },
    { key: "feedback", label: "Feedback", index: 2, count: 22, conversionPct: 55 },
    { key: "reviews", label: "Reviews", index: 3, count: 12, conversionPct: 54 },
    { key: "partners", label: "Referral Partners", index: 4, count: 6, conversionPct: 50 },
    { key: "referrals", label: "Referrals", index: 5, count: 3, conversionPct: 50 },
  ],
  overallConversionPct: 7.5,
};
