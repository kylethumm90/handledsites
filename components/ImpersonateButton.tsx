"use client";

import { useState } from "react";
import { Eye } from "lucide-react";

export default function ImpersonateButton({ siteId }: { siteId: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId }),
      });
      if (!res.ok) throw new Error("Failed");
      window.open("/contractor/dashboard", "_blank");
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
    >
      <Eye className="h-3 w-3" />
      {loading ? "..." : "View as user"}
    </button>
  );
}
