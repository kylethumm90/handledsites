"use client";

import { useEffect, useState } from "react";

type Props = {
  hoursStart: number;
  hoursEnd: number;
};

function isWithinBusinessHours(start: number, end: number): boolean {
  // Get current hour in Eastern time
  const now = new Date();
  const etTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const hour = etTime.getHours();
  return hour >= start && hour < end;
}

export default function AvailabilityDot({ hoursStart, hoursEnd }: Props) {
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    setAvailable(isWithinBusinessHours(hoursStart, hoursEnd));
    const interval = setInterval(() => {
      setAvailable(isWithinBusinessHours(hoursStart, hoursEnd));
    }, 60000);
    return () => clearInterval(interval);
  }, [hoursStart, hoursEnd]);

  if (available) {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="h-2.5 w-2.5 animate-pulse-dot rounded-full bg-green-500" />
        <span className="text-sm font-medium text-green-400">
          Available now
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <div className="h-2.5 w-2.5 rounded-full bg-gray-500" />
      <span className="text-sm font-medium text-card-muted">
        After hours — leave a message
      </span>
    </div>
  );
}
