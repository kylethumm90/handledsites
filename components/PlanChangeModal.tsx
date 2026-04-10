"use client";

import { useState, useEffect } from "react";
import { PLAN_NAMES, PLAN_PRICES } from "@/lib/plans";

type Props = {
  currentPlan: string;
  targetPlan: string;
  onConfirm: () => void;
  onCancel: () => void;
};

type Preview = {
  type: "new_subscription" | "plan_change";
  amount_due_today?: number;
  next_billing_date?: number;
  next_amount?: number;
  currency?: string;
  message?: string;
};

function formatCents(cents: number): string {
  const abs = Math.abs(cents);
  return `$${(abs / 100).toFixed(2)}`;
}

function formatDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function PlanChangeModal({ currentPlan, targetPlan, onConfirm, onCancel }: Props) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  const fromName = PLAN_NAMES[currentPlan] || "Free";
  const toName = PLAN_NAMES[targetPlan] || targetPlan;
  const fromPrice = PLAN_PRICES[currentPlan] || 0;
  const toPrice = PLAN_PRICES[targetPlan] || 0;
  const isUpgrade = toPrice > fromPrice;

  useEffect(() => {
    async function fetchPreview() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/stripe/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: targetPlan }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load preview");
        }
        const data = await res.json();
        setPreview(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
      setLoading(false);
    }
    fetchPreview();
  }, [targetPlan]);

  const handleConfirm = async () => {
    setConfirming(true);
    onConfirm();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      {/* Backdrop */}
      <div onClick={onCancel} style={{
        position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
      }} />

      {/* Modal */}
      <div style={{
        position: "relative", width: "100%", maxWidth: 400,
        background: "#fff", borderRadius: 16, padding: "28px 24px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1c1c1e", marginBottom: 4 }}>
          Confirm plan change
        </h2>
        <p style={{ fontSize: 13, color: "#8e8e93", marginBottom: 20 }}>
          Review the details before confirming.
        </p>

        {/* From → To */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
          padding: "14px 16px", background: "#f9f9fb", borderRadius: 10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.03em" }}>From</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1c1c1e", marginTop: 2 }}>{fromName}</div>
            <div style={{ fontSize: 13, color: "#8e8e93" }}>${fromPrice}/mo</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          <div style={{ flex: 1, textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.03em" }}>To</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1c1c1e", marginTop: 2 }}>{toName}</div>
            <div style={{ fontSize: 13, color: "#8e8e93" }}>${toPrice}/mo</div>
          </div>
        </div>

        {/* Preview details */}
        {loading && (
          <div style={{ textAlign: "center", padding: "20px 0", fontSize: 14, color: "#8e8e93" }}>
            Calculating changes...
          </div>
        )}

        {error && (
          <div style={{
            padding: "12px 14px", background: "#fff5f5", border: "1px solid #fed7d7",
            borderRadius: 8, fontSize: 13, color: "#e53e3e", marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {preview && !loading && !error && (
          <div style={{ marginBottom: 20 }}>
            {preview.type === "new_subscription" ? (
              <div style={{ fontSize: 14, color: "#3c3c43", lineHeight: 1.5 }}>
                You&#39;ll be redirected to checkout to start your <strong>{toName}</strong> subscription at <strong>${toPrice}/mo</strong>.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Amount due today */}
                {preview.amount_due_today !== undefined && preview.amount_due_today !== 0 && (
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 14px", background: isUpgrade ? "#f0fdf4" : "#eff6ff",
                    borderRadius: 8,
                  }}>
                    <span style={{ fontSize: 14, color: "#3c3c43" }}>
                      {isUpgrade ? "Prorated charge today" : "Credit applied"}
                    </span>
                    <span style={{
                      fontSize: 16, fontWeight: 700,
                      color: isUpgrade ? "#16a34a" : "#2563eb",
                    }}>
                      {preview.amount_due_today > 0 ? "" : "-"}{formatCents(preview.amount_due_today)}
                    </span>
                  </div>
                )}

                {preview.amount_due_today === 0 && (
                  <div style={{
                    padding: "12px 14px", background: "#f9f9fb", borderRadius: 8,
                    fontSize: 14, color: "#3c3c43",
                  }}>
                    No charge today — changes take effect at next billing cycle.
                  </div>
                )}

                {/* Next billing */}
                {preview.next_billing_date && (
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "12px 14px", background: "#f9f9fb", borderRadius: 8,
                  }}>
                    <span style={{ fontSize: 14, color: "#3c3c43" }}>
                      Next bill on {formatDate(preview.next_billing_date)}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1c1c1e" }}>
                      {preview.next_amount !== undefined ? formatCents(preview.next_amount) : `$${toPrice}`}/mo
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "12px", borderRadius: 10,
              background: "#f2f2f7", color: "#1c1c1e", border: "none",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !!error || confirming}
            style={{
              flex: 1, padding: "12px", borderRadius: 10,
              background: loading || error || confirming ? "#d1d1d6" : "#007aff",
              color: "#fff", border: "none",
              fontSize: 14, fontWeight: 600,
              cursor: loading || error || confirming ? "default" : "pointer",
            }}
          >
            {confirming ? "Confirming..." : "Confirm change"}
          </button>
        </div>
      </div>
    </div>
  );
}
