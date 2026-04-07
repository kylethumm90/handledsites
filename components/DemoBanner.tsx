"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DemoBanner() {
  const router = useRouter();
  const [clearing, setClearing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleClear = async () => {
    setClearing(true);
    try {
      const res = await fetch("/api/contractor/demo-leads", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to clear demo data");
      setDismissed(true);
      router.refresh();
    } catch {
      setClearing(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 14px",
        background: "#f0f4ff",
        border: "1px solid #d4defa",
        borderRadius: 10,
        fontSize: 13,
        marginBottom: 16,
      }}
    >
      <p style={{ color: "#444", margin: 0, lineHeight: 1.5 }}>
        <span style={{ fontWeight: 600, color: "#111" }}>Sample data.</span>{" "}
        You&apos;re looking at sample leads to help you explore. They&apos;ll
        hang around until you clear them.
      </p>
      <button
        onClick={handleClear}
        disabled={clearing}
        style={{
          background: "#111",
          color: "#fff",
          border: "none",
          fontSize: 12,
          fontWeight: 600,
          padding: "7px 14px",
          borderRadius: 6,
          cursor: clearing ? "default" : "pointer",
          whiteSpace: "nowrap",
          opacity: clearing ? 0.5 : 1,
        }}
      >
        {clearing ? "Clearing..." : "Clear demo data"}
      </button>
    </div>
  );
}
