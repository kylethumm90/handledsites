// Pulse — lightweight first-party analytics for handled.sites
// Client-side tracker module. Import and call from React components.

const EVENTS_ENDPOINT = "/api/events";

const ALLOWED_EVENTS = new Set([
  "page_view",
  "phone_click",
  "text_click",
  "form_submit",
  "review_click",
  "review_complete",
  "booking_request",
]);

// Simple 30s client-side dedup
const recentEvents = new Map<string, number>();
const DEDUP_MS = 30_000;

function isDuplicate(key: string): boolean {
  const now = Date.now();
  const last = recentEvents.get(key);
  if (last && now - last < DEDUP_MS) return true;
  recentEvents.set(key, now);
  // Clean old entries
  if (recentEvents.size > 50) {
    recentEvents.forEach((t, k) => {
      if (now - t > DEDUP_MS) recentEvents.delete(k);
    });
  }
  return false;
}

/** Get or create a persistent anonymous visitor ID */
export function getVisitorId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const stored = localStorage.getItem("pulse_vid");
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem("pulse_vid", id);
    return id;
  } catch {
    // localStorage unavailable — try sessionStorage
    try {
      const stored = sessionStorage.getItem("pulse_vid");
      if (stored) return stored;
      const id = crypto.randomUUID();
      sessionStorage.setItem("pulse_vid", id);
      return id;
    } catch {
      // Fallback: in-memory random ID (per page load)
      return crypto.randomUUID();
    }
  }
}

/** Core event tracking function */
export function trackEvent(siteId: string, eventType: string, pagePath?: string): void {
  if (typeof window === "undefined") return;
  if (!ALLOWED_EVENTS.has(eventType)) return;

  const path = pagePath || window.location.pathname;
  const dedupKey = `${eventType}:${path}`;
  if (isDuplicate(dedupKey)) return;

  const payload = JSON.stringify({
    site_id: siteId,
    event_type: eventType,
    page_path: path,
    visitor_id: getVisitorId(),
    referrer: document.referrer || null,
    user_agent: navigator.userAgent || null,
  });

  // Prefer sendBeacon for reliability (survives page unload)
  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon(EVENTS_ENDPOINT, blob);
  } else {
    fetch(EVENTS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }
}

// Convenience helpers
export const trackPageView = (siteId: string) => trackEvent(siteId, "page_view");
export const trackPhoneClick = (siteId: string) => trackEvent(siteId, "phone_click");
export const trackTextClick = (siteId: string) => trackEvent(siteId, "text_click");
export const trackFormSubmit = (siteId: string) => trackEvent(siteId, "form_submit");
export const trackReviewClick = (siteId: string) => trackEvent(siteId, "review_click");
export const trackReviewComplete = (siteId: string) => trackEvent(siteId, "review_complete");
export const trackBookingRequest = (siteId: string) => trackEvent(siteId, "booking_request");
