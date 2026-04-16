/**
 * handled. — Reputation sample data
 *
 * Mock data for the /reputation screen. Replace with Supabase-backed
 * queries (see hooks/useReputationData.ts) once the post-sale / Stella
 * pipeline is writing real feedback, reviews, and referrals.
 */

export type FeedbackItem = {
  id: number;
  name: string;
  initials: string;
  job: string;
  time: string;
  emoji: string;
  label: string;
  comment: string;
  sentiment: number;
  reviewSent: boolean;
};

export type ReviewStatus = "posted" | "awaiting review" | "needs attention";

export type ReviewItem = {
  id: number;
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
};

export type ReferralStatus = "booked" | "contacted" | "new lead";

export type ReferralItem = {
  id: number;
  name: string;
  initials: string;
  referredName: string;
  referredJob: string;
  time: string;
  status: ReferralStatus;
  value: string | null;
};

export type FunnelStep = {
  label: string;
  value: number;
  colorKey: "navy" | "blue" | "amber" | "green";
};

export type ReputationData = {
  companyName: string;
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
  referrals: ReferralItem[];
};

export const REPUTATION_SAMPLE: ReputationData = {
  companyName: "Rooftop Power",
  stats: {
    feedback: 12,
    reviews: 8,
    avgRating: 4.8,
    advocates: 3,
  },
  advocateRevenue: {
    amount: "$18,500",
    conversionPct: 33,
  },
  funnel: [
    { label: "Jobs", value: 18, colorKey: "navy" },
    { label: "Feedback", value: 12, colorKey: "blue" },
    { label: "Reviews", value: 8, colorKey: "amber" },
    { label: "Advocates", value: 3, colorKey: "green" },
  ],
  feedback: [
    {
      id: 1,
      name: "Kevin Park",
      initials: "KP",
      job: "HVAC repair",
      time: "1d ago",
      emoji: "😊",
      label: "Really good",
      comment:
        "Tech was knowledgeable and fixed the issue fast. Only complaint was arriving 20 min late.",
      sentiment: 82,
      reviewSent: true,
    },
    {
      id: 2,
      name: "Rachel Gomez",
      initials: "RG",
      job: "Solar panel cleaning",
      time: "1d ago",
      emoji: "😕",
      label: "Not great",
      comment:
        "Technician didn't explain what he was doing. Was late. Panels look the same to me.",
      sentiment: 35,
      reviewSent: false,
    },
    {
      id: 3,
      name: "Laura Stein",
      initials: "LS",
      job: "Solar installation",
      time: "2d ago",
      emoji: "😍",
      label: "Loved it",
      comment:
        "Best home improvement experience we've ever had. Mike was a rockstar.",
      sentiment: 97,
      reviewSent: true,
    },
    {
      id: 4,
      name: "Derek Huang",
      initials: "DH",
      job: "Roof repair",
      time: "3d ago",
      emoji: "😊",
      label: "Really good",
      comment: "Solid work. Clean crew. Would use again.",
      sentiment: 80,
      reviewSent: true,
    },
  ],
  reviews: [
    {
      id: 1,
      name: "Marcus Thompson",
      initials: "MT",
      job: "Solar installation",
      source: "Google",
      time: "2h ago",
      rating: 5,
      status: "posted",
      text: "Incredible work from start to finish. The crew was professional, cleaned up everything, and my electric bill is already down 40%. Highly recommend.",
      sentiment: 95,
    },
    {
      id: 2,
      name: "Diana Welch",
      initials: "DW",
      job: "Roof replacement",
      source: "Google",
      time: "6h ago",
      rating: 4,
      status: "posted",
      text: "Good job overall. Crew was on time and work looks great. Only reason for 4 stars is some debris left in the gutters, but they came back to fix it.",
      sentiment: 78,
    },
    {
      id: 3,
      name: "Kevin Park",
      initials: "KP",
      job: "HVAC repair",
      source: "Pending",
      time: "1d ago",
      rating: null,
      status: "awaiting review",
      text: "Feedback collected: 😊 Really good. Stella sent review link, waiting for submission.",
      sentiment: 82,
      alert: "Review link sent 18 hours ago",
    },
    {
      id: 4,
      name: "Rachel Gomez",
      initials: "RG",
      job: "Solar panel cleaning",
      source: "Feedback",
      time: "1d ago",
      rating: null,
      status: "needs attention",
      text: "Feedback collected: 😕 Not great. Customer mentioned technician was late and didn't explain the process.",
      sentiment: 35,
      alert: "Low sentiment — recovery recommended",
    },
  ],
  referrals: [
    {
      id: 1,
      name: "Marcus Thompson",
      initials: "MT",
      referredName: "James Liu",
      referredJob: "Solar installation",
      time: "3d ago",
      status: "booked",
      value: "$18,500",
    },
    {
      id: 2,
      name: "Angela Foster",
      initials: "AF",
      referredName: "Carla Reeves",
      referredJob: "Roof inspection",
      time: "5d ago",
      status: "contacted",
      value: null,
    },
    {
      id: 3,
      name: "Tom Wilder",
      initials: "TW",
      referredName: "Nate Brooks",
      referredJob: "HVAC install",
      time: "1w ago",
      status: "new lead",
      value: null,
    },
  ],
};
