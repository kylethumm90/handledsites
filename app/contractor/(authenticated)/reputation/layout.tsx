"use client";

import { TOKENS } from "./tokens";

// Nested layout for the Reputation section. Wraps every reputation page
// (/contractor/reputation, /contractor/reputation/alerts, ...) with the
// Command Console token scope + max-420 column.

export default function ReputationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        ...TOKENS,
        fontFamily: "var(--font-body)",
        color: "var(--on-surface)",
      }}
    >
      <div style={{ maxWidth: 420, margin: "0 auto" }}>{children}</div>
    </div>
  );
}
