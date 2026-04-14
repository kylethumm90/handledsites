import type { AlertsData, NetworkData, ReputationDashboardData } from "./types";

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

export const MOCK_ALERTS: AlertsData = {
  criticalCount: 3,
  warningCount: 5,
  resolvedCount: 12,
  openAlerts: [
    {
      id: "alert-brian-walsh",
      customerName: "Brian Walsh",
      customerRefId: "BW-0021",
      jobLabel: "Roof Replacement",
      severity: "critical",
      sentimentScore: 24,
      quote:
        "The crew left debris all over my lawn and didn't finish the flashing around the chimney. I've called twice and no one is getting back to me.",
    },
    {
      id: "alert-sarah-jenkins",
      customerName: "Sarah Jenkins",
      customerRefId: "SJ-4420",
      jobLabel: "Window Installation",
      severity: "warning",
      sentimentScore: 41,
      quote:
        "Unresolved delay mentioned in text: delivery, reschedule.",
    },
  ],
  resolvedThisMonth: [
    {
      id: "resolved-mark-thompson",
      customerName: "Mark Thompson",
      actionLabel: "Called — review updated",
    },
    {
      id: "resolved-sarah-jenkins-prev",
      customerName: "Sarah Jenkins",
      actionLabel: "Assigned — issue fixed",
    },
  ],
  resolvedProgress: { resolved: 6, total: 7 },
};

// =============================================================================
// Network tab mock
// =============================================================================
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const MOCK_NETWORK: NetworkData = {
  stats: {
    activeReferrers: 14,
    referralsThisMonth: 23,
    revenueCents: 4_280_000,
    avgValueCents: 186_100,
  },
  leaderboard: [
    {
      id: "ref-jessica-thumm",
      rank: 1,
      name: "Jessica Thumm",
      referralCount: 42,
      revenueCents: 2_440_000,
      sinceLabel: "Since Mar '24",
    },
    {
      id: "ref-marcus-rivera",
      rank: 2,
      name: "Marcus Rivera",
      referralCount: 38,
      revenueCents: 1_820_000,
      sinceLabel: "Since Jun '24",
    },
    {
      id: "ref-linda-park",
      rank: 3,
      name: "Linda Park",
      referralCount: 29,
      revenueCents: 1_460_000,
      sinceLabel: "Since Jan '24",
    },
    {
      id: "ref-david-chen",
      rank: 4,
      name: "David Chen",
      referralCount: 18,
      revenueCents: 810_000,
      sinceLabel: "Since Aug '24",
    },
    {
      id: "ref-rachel-torres",
      rank: 5,
      name: "Rachel Torres",
      referralCount: 12,
      revenueCents: 520_000,
      sinceLabel: "Since Oct '24",
    },
  ],
  leaderboardTotal: 14,
  recentActivity: [
    {
      id: "act-jt-mike",
      referrerName: "Jessica Thumm",
      referredName: "Mike Knoll",
      jobLabel: "Residential Clean",
      status: "closed",
      timestamp: new Date(Date.now() - 2 * HOUR).toISOString(),
    },
    {
      id: "act-mr-amanda",
      referrerName: "Marcus Rivera",
      referredName: "Amanda Shaw",
      jobLabel: "Solar Install",
      status: "booked",
      timestamp: new Date(Date.now() - 9 * HOUR).toISOString(),
    },
    {
      id: "act-lp-tom",
      referrerName: "Linda Park",
      referredName: "Tom Webster",
      jobLabel: "HVAC Repair",
      status: "contacted",
      timestamp: new Date(Date.now() - 1 * DAY).toISOString(),
    },
    {
      id: "act-dc-sarah",
      referrerName: "David Chen",
      referredName: "Sarah Kim",
      jobLabel: "Roof Replacement",
      status: "closed",
      timestamp: new Date(Date.now() - 2 * DAY).toISOString(),
    },
  ],
  stellaQueue: [
    {
      id: "sq-jessica-thumm",
      customerName: "Jessica Thumm",
      sentimentScore: 92,
      scheduledLabel: "Today 4PM",
    },
    {
      id: "sq-patricia-woods",
      customerName: "Patricia Woods",
      sentimentScore: 88,
      scheduledLabel: "Tomorrow",
    },
    {
      id: "sq-brett-jenkins",
      customerName: "Brett Jenkins",
      sentimentScore: 95,
      scheduledLabel: "Tomorrow",
    },
  ],
  stellaScheduledCount: 5,
};
