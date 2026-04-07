"use client";

import { useState, useEffect, useCallback } from "react";

type Props = {
  siteId: string;
  siteName: string;
  siteType: string;
  slug: string;
  trade: string;
  hasPhone: boolean;
};

type StatsRow = {
  total_views: number;
  unique_visitors: number;
  phone_clicks: number;
  text_clicks: number;
  form_submits: number;
  review_clicks: number;
  review_completes: number;
  booking_requests: number;
};

type DailyRow = StatsRow & { date: string };

type StatsResponse = {
  current: StatsRow;
  previous: StatsRow;
  daily: DailyRow[];
};

const PERIODS = ["7d", "30d", "90d"] as const;

function pctChange(current: number, previous: number): number | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

function SparkLine({ data, width = 200, height = 40 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="#007aff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChangeIndicator({ value }: { value: number | null }) {
  if (value === null) return <span style={{ fontSize: 12, color: "#999" }}>—</span>;
  const color = value >= 0 ? "#22c55e" : "#ef4444";
  const arrow = value >= 0 ? "↑" : "↓";
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color }}>
      {arrow} {Math.abs(value)}%
    </span>
  );
}

function MetricCard({ label, value, change }: { label: string; value: number; change: number | null }) {
  return (
    <div style={{
      padding: "16px 20px",
      background: "#fff",
      border: "1px solid #eee",
      borderRadius: 12,
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#999" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: "#111", letterSpacing: "-0.02em" }}>{value}</span>
        <ChangeIndicator value={change} />
      </div>
    </div>
  );
}

export default function PulseDashboard({ siteId, siteName, siteType, slug, trade, hasPhone }: Props) {
  const [period, setPeriod] = useState<typeof PERIODS[number]>("30d");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats/${siteId}?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [siteId, period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const c = stats?.current;
  const p = stats?.previous;

  // Determine which metrics to show based on site type and config
  const showPhone = hasPhone;
  const showText = hasPhone;
  const showForms = siteType === "website" || siteType === "quiz_funnel";
  const showReviews = siteType === "review_funnel";

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#007aff", marginBottom: 4 }}>
          Pulse
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: 0, letterSpacing: "-0.02em" }}>
          {siteName}
        </h1>
        <p style={{ fontSize: 13, color: "#999", margin: "4px 0 0" }}>
          {trade} &middot; /{slug} &middot; {siteType.replace("_", " ")}
        </p>
      </div>

      {/* Period pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              border: period === p ? "1.5px solid #007aff" : "1.5px solid #eee",
              background: period === p ? "#007aff" : "#fff",
              color: period === p ? "#fff" : "#666",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999" }}>Loading...</div>
      ) : !c ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999" }}>No data yet</div>
      ) : (
        <>
          {/* Hero stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <MetricCard label="Total Views" value={c.total_views} change={pctChange(c.total_views, p?.total_views || 0)} />
            <MetricCard label="Unique Visitors" value={c.unique_visitors} change={pctChange(c.unique_visitors, p?.unique_visitors || 0)} />
          </div>

          {/* Conditional metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            {showPhone && (c.phone_clicks > 0 || (p && p.phone_clicks > 0)) && (
              <MetricCard label="Phone Clicks" value={c.phone_clicks} change={pctChange(c.phone_clicks, p?.phone_clicks || 0)} />
            )}
            {showText && (c.text_clicks > 0 || (p && p.text_clicks > 0)) && (
              <MetricCard label="Text Clicks" value={c.text_clicks} change={pctChange(c.text_clicks, p?.text_clicks || 0)} />
            )}
            {showForms && (c.form_submits > 0 || (p && p.form_submits > 0)) && (
              <MetricCard label="Form Submits" value={c.form_submits} change={pctChange(c.form_submits, p?.form_submits || 0)} />
            )}
            {showReviews && (c.review_clicks > 0 || (p && p.review_clicks > 0)) && (
              <MetricCard label="Review Clicks" value={c.review_clicks} change={pctChange(c.review_clicks, p?.review_clicks || 0)} />
            )}
            {showReviews && (c.review_completes > 0 || (p && p.review_completes > 0)) && (
              <MetricCard label="Reviews Completed" value={c.review_completes} change={pctChange(c.review_completes, p?.review_completes || 0)} />
            )}
            {(c.booking_requests > 0 || (p && p.booking_requests > 0)) && (
              <MetricCard label="Booking Requests" value={c.booking_requests} change={pctChange(c.booking_requests, p?.booking_requests || 0)} />
            )}
          </div>

          {/* Daily trend */}
          {stats?.daily && stats.daily.length > 1 && (
            <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "20px 24px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#999", marginBottom: 12 }}>
                Daily Views
              </div>
              <SparkLine
                data={stats.daily.map((d) => d.total_views)}
                width={Math.min(580, typeof window !== "undefined" ? window.innerWidth - 80 : 580)}
                height={60}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#ccc" }}>
                <span>{stats.daily[0]?.date}</span>
                <span>{stats.daily[stats.daily.length - 1]?.date}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <p style={{ textAlign: "center", fontSize: 11, color: "#ddd", marginTop: 32 }}>
        Pulse by handled.
      </p>
    </div>
  );
}
