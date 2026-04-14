// Shape of the reputation dashboard data. Future Supabase queries should
// project their results into this type so `page.tsx` can swap mock for real
// data in a single line.

export type ReputationMetrics = {
  // NLP-derived sentiment over recent funnel feedback text (see
  // app/api/review/submit/route.ts). NOT the star rating rescaled —
  // a glowing-text 3-star should score high, an angry 4-star low.
  sentimentScore: number; // 0-100
  sentimentTrend: "up" | "down" | "flat";
  reviewsReceived: number; // numerator of review rate
  reviewsRequested: number; // denominator
  // Public Google Places rating sourced from `businesses.google_rating`
  // (populated by app/api/places/search/route.ts during onboarding).
  // Distinct from sentiment — this is the headline number the outside
  // world sees, not our internal feedback read.
  avgRating: number; // 0-5
  referralRevenueCents: number;
  recoveryAlertCount: number;
};

export type RecoveryAlert = {
  id: string;
  customerName: string;
  projectLabel: string;
  quote: string;
  sentimentScore: number; // 0-100, shown as "SNT"
  severity: "immediate" | "warning";
};

export type ActivityItem = {
  id: string;
  customerName: string;
  avatarUrl: string | null;
  status: "reviewed" | "pending" | "declined";
  timestamp: string; // ISO
  rating?: number;
  sentimentScore?: number;
  predictedSentiment?: number;
  requestSent?: boolean;
};

export type FunnelStage = {
  key: "jobs" | "feedback" | "reviews" | "partners" | "referrals";
  label: string;
  index: number; // 01..05
  count: number;
  conversionPct?: number; // vs previous stage
};

export type ReputationDashboardData = {
  metrics: ReputationMetrics;
  criticalRecovery: RecoveryAlert[];
  recentActivity: ActivityItem[];
  funnel: FunnelStage[];
  overallConversionPct: number;
};

// =============================================================================
// Alerts tab
// =============================================================================

export type AlertSeverity = "critical" | "warning";

export type OpenAlert = {
  id: string;
  customerName: string;
  customerRefId: string; // e.g. "BW-0021"
  jobLabel: string; // e.g. "Roof Replacement"
  severity: AlertSeverity;
  sentimentScore: number; // 0-100
  quote: string;
};

export type ResolvedAlertItem = {
  id: string;
  customerName: string;
  actionLabel: string; // e.g. "Called — review updated"
};

export type AlertsData = {
  criticalCount: number;
  warningCount: number;
  resolvedCount: number;
  openAlerts: OpenAlert[];
  resolvedThisMonth: ResolvedAlertItem[];
  resolvedProgress: { resolved: number; total: number };
};

// =============================================================================
// Network tab
// =============================================================================

export type NetworkStats = {
  activeReferrers: number;
  referralsThisMonth: number;
  revenueCents: number; // emphasized stat
  avgValueCents: number;
};

export type NetworkReferrer = {
  id: string;
  rank: number; // 1-based
  name: string;
  referralCount: number;
  revenueCents: number;
  sinceLabel: string; // e.g. "Since Mar '24"
};

export type ReferralActivityStatus = "closed" | "booked" | "contacted";

export type ReferralActivity = {
  id: string;
  referrerName: string;
  referredName: string;
  jobLabel: string;
  status: ReferralActivityStatus;
  timestamp: string; // ISO
};

export type StellaQueueItem = {
  id: string;
  customerName: string;
  sentimentScore: number; // 0-100
  scheduledLabel: string; // e.g. "Today 4PM"
};

// =============================================================================
// Funnel tab
// =============================================================================

export type FunnelPeriod = "7d" | "30d" | "90d" | "all";

export type FunnelStageKey =
  | "jobs"
  | "feedback"
  | "reviews"
  | "partners"
  | "referrals";

export type FunnelStageSnapshot = {
  key: FunnelStageKey;
  label: string;
  index: number; // 1..5
  count: number;
  conversionPct?: number; // vs previous stage
  dropOff?: number; // loss vs previous stage
};

export type ConversionTrendPoint = {
  label: string; // e.g. "W1"
  pct: number;
  isCurrent?: boolean;
};

export type FunnelPeriodData = {
  stages: FunnelStageSnapshot[];
  totalConversionPct: number;
  deltaFromPrevPct: number; // can be negative
  trendPoints: ConversionTrendPoint[];
  trendInsight: string;
};

export type StageBreakdownCustomer = {
  id: string;
  name: string;
  jobLabel: string;
  daysAtStage: number;
  nextAction: string;
};

export type StageBreakdownGroup = {
  label: string;
  count: number;
  customers: StageBreakdownCustomer[];
};

export type StageBreakdownEntry = {
  key: FunnelStageKey;
  label: string;
  count: number;
  groups: StageBreakdownGroup[];
};

export type FunnelData = {
  periods: Record<FunnelPeriod, FunnelPeriodData>;
  breakdown: StageBreakdownEntry[];
};

export type NetworkData = {
  stats: NetworkStats;
  leaderboard: NetworkReferrer[];
  leaderboardTotal: number;
  recentActivity: ReferralActivity[];
  stellaQueue: StellaQueueItem[];
  stellaScheduledCount: number;
};
