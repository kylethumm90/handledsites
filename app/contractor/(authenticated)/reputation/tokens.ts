import type { CSSProperties } from "react";

// Shared Command Console tokens for the Reputation section.
// Imported by the reputation layout, dashboard page, alerts page, and any
// other nested client components so they all draw from the same vocabulary.

export const TOKENS: CSSProperties = {
  // Colors
  ["--primary" as string]: "#012D1D",
  ["--primary-container" as string]: "#1B4332",
  ["--primary-fixed-dim" as string]: "#2D5A3D",
  ["--surface" as string]: "#F9F9F8",
  ["--surface-low" as string]: "#F3F4F3",
  ["--surface-lowest" as string]: "#FFFFFF",
  ["--surface-high" as string]: "#E7E8E7",
  ["--outline" as string]: "#8A918C",
  ["--outline-variant" as string]: "#C1C8C2",
  ["--on-surface" as string]: "#1A1A1A",
  ["--on-surface-variant" as string]: "#414844",
  ["--alert" as string]: "#B3261E",
  ["--alert-soft" as string]: "#FDF2F2",
  ["--warning" as string]: "#B45309",
  ["--warning-soft" as string]: "#FEF3C7",
  ["--success" as string]: "#15803D",
  ["--success-soft" as string]: "#E4F1E4",
  ["--cta-coral" as string]: "#E8603A",
  ["--cta-coral-dark" as string]: "#C74A24",
  ["--coral-soft" as string]: "#FDF0EB",
  ["--rust" as string]: "#9A4A28",
  ["--rust-soft" as string]: "#F5E6DD",
  // Fonts
  ["--font-display" as string]: "'Space Grotesk', system-ui, sans-serif",
  ["--font-body" as string]: "'Inter', system-ui, sans-serif",
};

export const HAIRLINE = "0.5px solid var(--outline-variant)";

export const DISPLAY: CSSProperties = {
  fontFamily: "var(--font-display)",
  letterSpacing: "-0.02em",
};

export const LABEL: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--on-surface-variant)",
};

export const METRIC_VALUE: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 28,
  fontWeight: 600,
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "-0.03em",
  color: "var(--on-surface)",
  lineHeight: 1,
};
