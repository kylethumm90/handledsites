import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  // Vercel cron sends GET requests. Also allow manual trigger.
  return handleRollup(request);
}

export async function POST(request: NextRequest) {
  return handleRollup(request);
}

async function handleRollup(request: NextRequest) {
  // Auth: check PULSE_API_KEY or Vercel cron secret
  const authHeader = request.headers.get("authorization") || "";
  const cronSecret = process.env.CRON_SECRET;
  const pulseKey = process.env.PULSE_API_KEY;

  const isAuthorized =
    (pulseKey && authHeader === `Bearer ${pulseKey}`) ||
    (cronSecret && authHeader === `Bearer ${cronSecret}`);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");

  // Default to yesterday
  const targetDate = dateParam || (() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().split("T")[0];
  })();

  const supabase = getSupabaseAdmin();

  // Query site_events for the target date and compute rollups
  const startOfDay = `${targetDate}T00:00:00.000Z`;
  const endOfDay = `${targetDate}T23:59:59.999Z`;

  const { data: events, error: eventsError } = await supabase
    .from("site_events")
    .select("site_id, event_type, visitor_id")
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay);

  if (eventsError) {
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  }

  if (!events || events.length === 0) {
    return NextResponse.json({ success: true, message: "No events for this date", date: targetDate });
  }

  // Group by site_id
  const siteMap = new Map<string, {
    total_views: number;
    visitors: Set<string>;
    phone_clicks: number;
    text_clicks: number;
    form_submits: number;
    review_clicks: number;
    review_completes: number;
    booking_requests: number;
  }>();

  for (const event of events) {
    if (!siteMap.has(event.site_id)) {
      siteMap.set(event.site_id, {
        total_views: 0,
        visitors: new Set(),
        phone_clicks: 0,
        text_clicks: 0,
        form_submits: 0,
        review_clicks: 0,
        review_completes: 0,
        booking_requests: 0,
      });
    }
    const stats = siteMap.get(event.site_id)!;

    switch (event.event_type) {
      case "page_view":
        stats.total_views++;
        stats.visitors.add(event.visitor_id);
        break;
      case "phone_click": stats.phone_clicks++; break;
      case "text_click": stats.text_clicks++; break;
      case "form_submit": stats.form_submits++; break;
      case "review_click": stats.review_clicks++; break;
      case "review_complete": stats.review_completes++; break;
      case "booking_request": stats.booking_requests++; break;
    }
  }

  // Upsert into site_stats_daily
  const rows = Array.from(siteMap.entries()).map(([siteId, stats]) => ({
    site_id: siteId,
    stat_date: targetDate,
    total_views: stats.total_views,
    unique_visitors: stats.visitors.size,
    phone_clicks: stats.phone_clicks,
    text_clicks: stats.text_clicks,
    form_submits: stats.form_submits,
    review_clicks: stats.review_clicks,
    review_completes: stats.review_completes,
    booking_requests: stats.booking_requests,
  }));

  const { error: upsertError } = await supabase
    .from("site_stats_daily")
    .upsert(rows, { onConflict: "site_id,stat_date" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    date: targetDate,
    sites_processed: rows.length,
    total_events: events.length,
  });
}
