// Shape of the reputation dashboard data. Future Supabase queries should
// project their results into this type so `page.tsx` can swap mock for real
// data in a single line.

export type ReputationMetrics = {
  sentimentScore: number; // 0-100
  sentimentTrend: "up" | "down" | "flat";
  reviewsReceived: number; // numerator of review rate
  reviewsRequested: number; // denominator
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
