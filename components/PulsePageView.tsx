"use client";

import { useEffect } from "react";
import { trackPageView } from "@/lib/pulse";

export default function PulsePageView({ siteId }: { siteId: string }) {
  useEffect(() => {
    trackPageView(siteId);
  }, [siteId]);

  return null;
}
