/**
 * handled. primitive UI components.
 *
 * Square corners, no shadows, no gradients. See docs/PRODUCT_SPEC.md.
 */

import type { CSSProperties, ReactNode } from "react";
import { colors, fonts } from "@/lib/design-system";

// ---------------------------------------------------------------------------
// Dot — small colored circle indicator
// ---------------------------------------------------------------------------

type DotProps = {
  color?: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
};

export function Dot({
  color = colors.green,
  size = 8,
  className,
  style,
}: DotProps) {
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: "50%",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// StageBadge — monospace uppercase badge with colored background
// ---------------------------------------------------------------------------

type StageBadgeProps = {
  label: string;
  /** Foreground (text) color. Defaults to navy. */
  color?: string;
  /** Background color. Defaults to a muted bg. */
  bg?: string;
  className?: string;
  style?: CSSProperties;
};

export function StageBadge({
  label,
  color = colors.navy,
  bg = colors.borderLight,
  className,
  style,
}: StageBadgeProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        fontFamily: fonts.mono,
        fontSize: 9,
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color,
        backgroundColor: bg,
        padding: "4px 6px",
        borderRadius: 0,
        ...style,
      }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// AiHint — amber background banner with left border for AI context
// ---------------------------------------------------------------------------

type AiHintProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function AiHint({ children, className, style }: AiHintProps) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: colors.amberBg,
        borderLeft: `2px solid ${colors.amber}`,
        color: colors.navy,
        fontFamily: fonts.body,
        fontSize: 13,
        lineHeight: 1.4,
        padding: "8px 10px",
        borderRadius: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// UpsellHint — dashed border with ⚡ icon (Base tier nudges)
// ---------------------------------------------------------------------------

type UpsellHintProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function UpsellHint({ children, className, style }: UpsellHintProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        border: `1px dashed ${colors.amber}`,
        backgroundColor: "transparent",
        color: colors.navy,
        fontFamily: fonts.body,
        fontSize: 12,
        lineHeight: 1.4,
        padding: "10px 12px",
        borderRadius: 0,
        ...style,
      }}
    >
      <span
        aria-hidden
        style={{
          color: colors.amber,
          fontSize: 14,
          lineHeight: 1.2,
          flexShrink: 0,
        }}
      >
        ⚡
      </span>
      <span>{children}</span>
    </div>
  );
}
