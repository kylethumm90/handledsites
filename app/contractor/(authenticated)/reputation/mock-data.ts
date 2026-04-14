import type {
  AlertsData,
  FunnelData,
  NetworkData,
  ReputationDashboardData,
} from "./types";

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

// =============================================================================
// Funnel tab mock
// =============================================================================

function buildStages(
  jobs: number,
  feedback: number,
  reviews: number,
  partners: number,
  referrals: number,
) {
  return [
    { key: "jobs" as const, label: "Jobs Done", index: 1, count: jobs },
    {
      key: "feedback" as const,
      label: "Feedback",
      index: 2,
      count: feedback,
      conversionPct: Math.round((feedback / jobs) * 100),
      dropOff: jobs - feedback,
    },
    {
      key: "reviews" as const,
      label: "Reviews",
      index: 3,
      count: reviews,
      conversionPct: Math.round((reviews / feedback) * 100),
      dropOff: feedback - reviews,
    },
    {
      key: "partners" as const,
      label: "Referral Partners",
      index: 4,
      count: partners,
      conversionPct: Math.round((partners / reviews) * 100),
      dropOff: reviews - partners,
    },
    {
      key: "referrals" as const,
      label: "Referrals",
      index: 5,
      count: referrals,
      conversionPct: Math.round((referrals / partners) * 100),
      dropOff: partners - referrals,
    },
  ];
}

export const MOCK_FUNNEL: FunnelData = {
  periods: {
    "7d": {
      stages: buildStages(35, 22, 13, 4, 3),
      totalConversionPct: 8.6,
      deltaFromPrevPct: 0.4,
      trendPoints: [
        { label: "M", pct: 6.2 },
        { label: "T", pct: 7.0 },
        { label: "W", pct: 8.1 },
        { label: "T", pct: 7.4 },
        { label: "F", pct: 9.0 },
        { label: "S", pct: 8.8 },
        { label: "S", pct: 8.6, isCurrent: true },
      ],
      trendInsight:
        "Feedback response rate dropped mid-week. Stella is adjusting follow-up timing.",
    },
    "30d": {
      stages: buildStages(142, 88, 52, 14, 11),
      totalConversionPct: 7.7,
      deltaFromPrevPct: 1.2,
      trendPoints: [
        { label: "W1", pct: 6.5 },
        { label: "W2", pct: 7.0 },
        { label: "W3", pct: 7.4 },
        { label: "W4", pct: 7.7, isCurrent: true },
      ],
      trendInsight:
        "Your review conversion has improved 12% over the last 30 days.",
    },
    "90d": {
      stages: buildStages(412, 258, 151, 39, 29),
      totalConversionPct: 7.0,
      deltaFromPrevPct: 0.8,
      trendPoints: [
        { label: "Jan", pct: 5.8 },
        { label: "Feb", pct: 6.4 },
        { label: "Mar", pct: 7.0, isCurrent: true },
      ],
      trendInsight:
        "Your review conversion has improved 12% over the last 90 days.",
    },
    all: {
      stages: buildStages(1840, 1102, 612, 158, 124),
      totalConversionPct: 6.7,
      deltaFromPrevPct: 0.3,
      trendPoints: [
        { label: "Q1", pct: 5.2 },
        { label: "Q2", pct: 5.9 },
        { label: "Q3", pct: 6.3 },
        { label: "Q4", pct: 6.7, isCurrent: true },
      ],
      trendInsight:
        "Lifetime review conversion trending up quarter over quarter.",
    },
  },
  breakdown: [
    {
      key: "jobs",
      label: "Jobs Done",
      count: 142,
      groups: [
        {
          label: "Completed",
          count: 142,
          customers: [
            {
              id: "jd-alex-kim",
              name: "Alex Kim",
              jobLabel: "Kitchen Remodel",
              daysAtStage: 1,
              nextAction: "Feedback request sending tonight",
            },
            {
              id: "jd-nina-ross",
              name: "Nina Ross",
              jobLabel: "Deck Build",
              daysAtStage: 0,
              nextAction: "Feedback request sending tomorrow",
            },
          ],
        },
      ],
    },
    {
      key: "feedback",
      label: "Feedback",
      count: 88,
      groups: [
        {
          label: "Responded",
          count: 22,
          customers: [
            {
              id: "fb-jessica-thumm",
              name: "Jessica Thumm",
              jobLabel: "Bathroom Reno",
              daysAtStage: 2,
              nextAction: "Review request queued",
            },
          ],
        },
        {
          label: "Waiting",
          count: 12,
          customers: [
            {
              id: "fb-marcus-rivera",
              name: "Marcus Rivera",
              jobLabel: "Solar Install",
              daysAtStage: 3,
              nextAction: "Follow-up scheduled tomorrow",
            },
          ],
        },
        {
          label: "No Response",
          count: 8,
          customers: [
            {
              id: "fb-brian-walsh",
              name: "Brian Walsh",
              jobLabel: "Roof Replacement",
              daysAtStage: 9,
              nextAction: "Re-engagement in 3 days",
            },
          ],
        },
      ],
    },
    {
      key: "reviews",
      label: "Reviews",
      count: 52,
      groups: [
        {
          label: "Reviewed",
          count: 12,
          customers: [
            {
              id: "rv-linda-park",
              name: "Linda Park",
              jobLabel: "Window Replace",
              daysAtStage: 4,
              nextAction: "Thank-you sent",
            },
          ],
        },
        {
          label: "Requested",
          count: 8,
          customers: [
            {
              id: "rv-sarah-jenkins",
              name: "Sarah Jenkins",
              jobLabel: "Window Installation",
              daysAtStage: 5,
              nextAction: "Reminder in 2 days",
            },
          ],
        },
        {
          label: "Not Yet Asked",
          count: 2,
          customers: [
            {
              id: "rv-tom-webster",
              name: "Tom Webster",
              jobLabel: "HVAC Repair",
              daysAtStage: 1,
              nextAction: "Review request sending tomorrow",
            },
          ],
        },
      ],
    },
    {
      key: "partners",
      label: "Referral Partners",
      count: 14,
      groups: [
        {
          label: "Opted In",
          count: 14,
          customers: [
            {
              id: "rp-jessica-thumm",
              name: "Jessica Thumm",
              jobLabel: "Bathroom Reno",
              daysAtStage: 11,
              nextAction: "Referral ask scheduled",
            },
            {
              id: "rp-marcus-rivera",
              name: "Marcus Rivera",
              jobLabel: "Solar Install",
              daysAtStage: 8,
              nextAction: "Referral ask tomorrow",
            },
          ],
        },
      ],
    },
    {
      key: "referrals",
      label: "Referrals",
      count: 11,
      groups: [
        {
          label: "Closed",
          count: 6,
          customers: [
            {
              id: "rf-mike-knoll",
              name: "Mike Knoll",
              jobLabel: "Residential Clean",
              daysAtStage: 0,
              nextAction: "Job scheduled",
            },
          ],
        },
        {
          label: "In Progress",
          count: 5,
          customers: [
            {
              id: "rf-amanda-shaw",
              name: "Amanda Shaw",
              jobLabel: "Solar Install",
              daysAtStage: 2,
              nextAction: "Quote in review",
            },
          ],
        },
      ],
    },
  ],
};
