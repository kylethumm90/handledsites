/**
 * handled. design system
 *
 * Single source of truth for colors and typography used across the
 * handled. app (Pipeline, Pulse, Dashboard). See docs/PRODUCT_SPEC.md
 * for the full brand & design system rules.
 *
 * Rules:
 * - NO rounded corners anywhere (square / sharp edges)
 * - NO gradients, NO shadows
 * - Warm off-white page backgrounds (never pure white)
 * - Body/UI uses DM Sans; numbers and data use IBM Plex Mono
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const colors = {
  // Primary brand
  navy: "#1E2A3A",
  amber: "#E8922A",

  // Surfaces
  bg: "#F7F7F5", // warm off-white page background
  white: "#FFFFFF", // card surface

  // Borders
  border: "#E8E8E4", // default card border
  borderLight: "#F0F0EC", // subtle dividers / light borders

  // Status / semantic
  green: "#16A34A", // success, positive, reviewed, confirmed
  red: "#DC2626", // error, recovery, needs attention
  blue: "#2563EB", // contacted / info
  purple: "#7C3AED", // referrer / referral

  // Light "bg" variants used for hint banners, badge backgrounds, etc.
  amberBg: "#FFF8EF", // AI context hint background
  amberBgSoft: "#FEFCF8", // softer "barely warm" variant used in detail panels
  greenBg: "#F0FDF4",
  redBg: "#FEF2F2", // recovery / negative background
  blueBg: "#EFF6FF",
  purpleBg: "#F5F3FF",
  navyBg: "#F3F4F6",

  // Muted text
  muted: "#6B7280",
  mutedLight: "#9CA3AF",
  // Desaturated red used for alert copy that should whisper, not yell
  // (e.g. "No response — waiting 14 hours" in the timeline).
  alertMuted: "#B48A8A",
} as const;

export type ColorToken = keyof typeof colors;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

/**
 * CSS font-family stacks. These reference the CSS variables exposed by
 * next/font/google in app/layout.tsx (DM Sans and IBM Plex Mono), with
 * system fallbacks. Use `fonts.body` for body/UI copy and `fonts.mono`
 * for numbers, counts, stage badges, timestamps, etc.
 */
export const fonts = {
  body: "var(--font-dm-sans), 'DM Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  mono: "var(--font-ibm-plex-mono), 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// ---------------------------------------------------------------------------
// Stage color map — used by StageBadge and stage boxes
// ---------------------------------------------------------------------------

export const stageColors = {
  // Pipeline
  new: { fg: colors.amber, bg: colors.amberBg },
  contacted: { fg: colors.blue, bg: colors.blueBg },
  appt_set: { fg: colors.navy, bg: colors.navyBg },
  job_done: { fg: colors.green, bg: colors.greenBg },
  // Post-sale
  recovery: { fg: colors.red, bg: colors.redBg },
  feedback: { fg: colors.amber, bg: colors.amberBg },
  reviewed: { fg: colors.green, bg: colors.greenBg },
  referrer: { fg: colors.purple, bg: colors.purpleBg },
} as const;

export type StageKey = keyof typeof stageColors;
