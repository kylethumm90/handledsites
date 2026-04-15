/**
 * Sample contacts for the Pipeline screen. These will be replaced with
 * Supabase-backed data later. Kept in one place so the page stays clean.
 */

import type { Contact } from "./contact-card";

export const PIPELINE_CONTACTS: Contact[] = [
  {
    id: "p1",
    name: "Dave Rodriguez",
    stage: "new",
    jobType: "Roofing estimate",
    source: "Website form",
    time: "8:42 am",
    aiHint:
      "Wants a roofing estimate. Came through quiz funnel — has storm damage.",
    waitHours: 1,
    agentAction: { agent: "ava", text: "texted back in 8 seconds" },
    contextualCta: "CALL DAVE",
  },
  {
    id: "p2",
    name: "Maria Gonzalez",
    stage: "new",
    jobType: "Solar install",
    source: "Missed call",
    time: "Yesterday",
    aiHint:
      "Called after hours. No voicemail left. Likely shopping around — follow up fast.",
    waitHours: 14,
    agentAction: {
      agent: "ava",
      text: "sent a follow-up text after the missed call",
    },
    contextualCta: "CALL MARIA",
  },
  {
    id: "p3",
    name: "Carlos Mendez",
    stage: "contacted",
    jobType: "Gutter replacement",
    source: "Website form",
    time: "2 days ago",
    aiHint:
      "Submitted from this morning. Mentioned a quote from another company — price sensitive.",
    waitHours: 4,
    agentAction: { agent: "ava", text: "booked a 10am estimate for Thursday" },
    contextualCta: "VIEW CONVERSATION",
  },
  {
    id: "p4",
    name: "Tom Bradley",
    stage: "appt_set",
    jobType: "Roof inspection",
    source: "Referral",
    time: "Thu 10:00 am",
    aiHint:
      "Neighbor of Dave Rodriguez. Inspection scheduled Thursday — confirm 24 hrs ahead.",
    agentAction: { agent: "ava", text: "confirmed the appointment at 7:02 am" },
    contextualCta: "CALL TOM",
  },
  {
    id: "p5",
    name: "Jessica Thumm",
    stage: "job_done",
    jobType: "Gutter clean + repair",
    source: "Website form",
    time: "Completed Apr 12",
    aiHint:
      "Job completed 3 days ago. Feedback window open — a quick call could land a 5-star review.",
    agentAction: {
      agent: "stella",
      text: "queued a review request for 9 am tomorrow",
    },
    contextualCta: "SEND REVIEW REQUEST",
  },
];

export const POST_SALE_CONTACTS: Contact[] = [
  {
    id: "ps1",
    name: "Brian Walsh",
    stage: "feedback",
    jobType: "Roof replacement",
    source: "Completed Apr 2",
    time: "13 days ago",
    aiHint:
      "Job completed 13 days ago. Feedback window closing — send soon to stay in front of them.",
    agentAction: {
      agent: "stella",
      text: "will send feedback request at 6pm",
    },
    contextualCta: "SEND FEEDBACK REQUEST",
  },
  {
    id: "ps2",
    name: "Sarah Chen",
    stage: "recovery",
    recovery: true,
    jobType: "Solar install",
    source: "Completed Apr 9",
    time: "6 days ago",
    aiHint:
      "\u201CCrew left a mess in the driveway. Panels are fine but cleanup was rough.\u201D",
    sentiment: 2.1,
    agentAction: {
      agent: "stella",
      text: "holding review request until you call",
    },
    contextualCta: "CALL SARAH",
  },
  {
    id: "ps3",
    name: "Mike DiPalma",
    stage: "referrer",
    jobType: "Solar install",
    source: "Completed Mar 28",
    time: "18 days ago",
    aiHint:
      "Mentioned his neighbor Dave wants a quote. This is a warm referral — act fast.",
    referralName: "Dave Rodriguez",
    agentAction: {
      agent: "stella",
      text: "flagged this referral for follow-up",
    },
    contextualCta: "FOLLOW UP ON REFERRAL",
  },
  {
    id: "ps4",
    name: "Jessica Thumm",
    stage: "reviewed",
    jobType: "Gutter clean + repair",
    source: "Completed Apr 12",
    time: "3 days ago",
    aiHint:
      "Left a 5-star Google review this morning. Good candidate for a neighborhood referral ask.",
    reviewBadge: { stars: 5, platform: "Google" },
    agentAction: { agent: "stella", text: "thanked her and logged the review" },
    contextualCta: "ASK FOR REFERRAL",
  },
  {
    id: "ps5",
    name: "Amanda Price",
    stage: "recovery",
    recovery: true,
    jobType: "Roof repair",
    source: "Completed Apr 5",
    time: "10 days ago",
    aiHint:
      "\u201CLeak is back two weeks later. Crew was nice but work didn\u2019t hold. Frustrated.\u201D",
    sentiment: 1.7,
    agentAction: {
      agent: "stella",
      text: "holding review request until you call",
    },
    contextualCta: "CALL AMANDA",
  },
  {
    id: "ps6",
    name: "Victor Ramos",
    stage: "feedback",
    jobType: "HVAC tune-up",
    source: "Completed Apr 8",
    time: "7 days ago",
    aiHint:
      "Job completed a week ago. No feedback yet — Stella will send the request tonight.",
    agentAction: {
      agent: "stella",
      text: "will send feedback request tonight at 6pm",
    },
    contextualCta: "SEND FEEDBACK REQUEST",
  },
];
