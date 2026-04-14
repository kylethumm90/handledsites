"use client";

import BottomTabBar from "./BottomTabBar";
import { MOCK_REPUTATION } from "./mock-data";
import { TOKENS } from "./tokens";

// Nested layout for the Reputation section. Wraps every reputation page
// (/contractor/reputation, /contractor/reputation/alerts, ...) with the
// Command Console token scope + max-420 column + fixed bottom tab bar so
// the bar persists across route changes within this section.

export default function ReputationLayout({ children }: { children: React.ReactNode }) {
  const hasAlert = MOCK_REPUTATION.metrics.recoveryAlertCount > 0;

  return (
    <div
      style={{
        ...TOKENS,
        fontFamily: "var(--font-body)",
        color: "var(--on-surface)",
        paddingBottom: 84,
      }}
    >
      <div style={{ maxWidth: 420, margin: "0 auto" }}>{children}</div>
      <BottomTabBar hasAlert={hasAlert} />
    </div>
  );
}
