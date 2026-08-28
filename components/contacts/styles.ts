/**
 * Shared inline-style tokens for the contacts screen.
 *
 * The contractor shell (app/contractor/(authenticated)/layout.tsx) is a soft,
 * light, Apple-ish surface — system font stack, #fbfbfd gradient ground,
 * hairline rgba borders, small radii. These tokens match that, rather than the
 * navy/amber tokens in docs/PRODUCT_SPEC.md, so the page sits in the app it
 * actually lives in. Semantic colors still come from lib/design-system.ts.
 */

import type { CSSProperties } from "react";
import { colors } from "@/lib/design-system";

export const ink = "#1d1d1f";
export const inkSoft = "#86868b";
export const hairline = "rgba(0,0,0,0.06)";
export const hairlineStrong = "rgba(0,0,0,0.1)";

export const card: CSSProperties = {
  background: "#fff",
  border: `1px solid ${hairline}`,
  borderRadius: 12,
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};

export const sectionLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: inkSoft,
  letterSpacing: "0.01em",
};

export const mutedText: CSSProperties = {
  fontSize: 12,
  color: inkSoft,
};

export const tableHeaderCell: CSSProperties = {
  textAlign: "left",
  fontSize: 11,
  fontWeight: 500,
  color: inkSoft,
  padding: "10px 14px",
  borderBottom: `1px solid ${hairline}`,
  whiteSpace: "nowrap",
};

export const tableCell: CSSProperties = {
  padding: "12px 14px",
  borderBottom: `1px solid ${hairline}`,
  verticalAlign: "middle",
  fontSize: 13,
  color: ink,
};

export const badge: CSSProperties = {
  display: "inline-block",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.04em",
  padding: "3px 8px",
  borderRadius: 6,
  whiteSpace: "nowrap",
};

export const buttonSecondary: CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: ink,
  background: "#fff",
  border: `1px solid ${hairlineStrong}`,
  borderRadius: 8,
  padding: "6px 12px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export const buttonPrimary: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#fff",
  background: colors.green,
  border: "none",
  borderRadius: 10,
  padding: "12px 16px",
  cursor: "pointer",
  width: "100%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

/** Avatar circle. Photos aren't on the schema; we render initials. */
export function avatarStyle(size: number, hue: number): CSSProperties {
  return {
    width: size,
    height: size,
    borderRadius: "50%",
    background: `hsl(${hue}, 60%, 92%)`,
    color: `hsl(${hue}, 55%, 32%)`,
    fontSize: size <= 32 ? 11 : 15,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    letterSpacing: "0.01em",
  };
}
