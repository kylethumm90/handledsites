import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

const PERIOD_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
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

function emptyStats(): StatsRow {
  return {
    total_views: 0, unique_visitors: 0, phone_clicks: 0, text_clicks: 0,
    form_submits: 0, review_clicks: 0, review_completes: 0, booking_requests: 0,
  };
}

function sumStats(rows: StatsRow[]): StatsRow {
  return rows.reduce((acc, row) => ({
    total_views: acc.total_views + (row.total_views || 0),
    unique_visitors: acc.unique_visitors + (row.unique_visitors || 0),
    phone_clicks: acc.phone_clicks + (row.phone_clicks || 0),
    text_clicks: acc.text_clicks + (row.text_clicks || 0),
    form_submits: acc.form_submits + (row.form_submits || 0),
    review_clicks: acc.review_clicks + (row.review_clicks || 0),
    review_completes: acc.review_completes + (row.review_completes || 0),
    booking_requests: acc.booking_requests + (row.booking_requests || 0),
  }), emptyStats());
}

export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  // Auth: contractor session or admin
  const auth = await validateSessionFromRequest(request);
  const supabase = getSupabaseAdmin();

  if (auth) {
    // Verify contractor owns the target site
    const { data: targetSite } = await supabase
      .from("sites")
      .select("business_id")
      .eq("id", params.siteId)
      .single();

    if (!targetSite || targetSite.business_id !== auth.businessId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    // Check admin auth
    const adminCookie = request.cookies.get("admin_session")?.value;
    if (!adminCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const period = request.nextUrl.searchParams.get("period") || "30d";
  const days = PERIOD_DAYS[period] || 30;

  const now = new Date();
  const currentStart = new Date(now);
  currentStart.setUTCDate(currentStart.getUTCDate() - days);
  const previousStart = new Date(currentStart);
  previousStart.setUTCDate(previousStart.getUTCDate() - days);

  // Fetch current period
  const { data: currentRows } = await supabase
    .from("site_stats_daily")
    .select("*")
    .eq("site_id", params.siteId)
    .gte("stat_date", currentStart.toISOString().split("T")[0])
    .order("stat_date", { ascending: true });

  // Fetch previous period
  const { data: previousRows } = await supabase
    .from("site_stats_daily")
    .select("*")
    .eq("site_id", params.siteId)
    .gte("stat_date", previousStart.toISOString().split("T")[0])
    .lt("stat_date", currentStart.toISOString().split("T")[0])
    .order("stat_date", { ascending: true });

  // Also fetch today's live events (not yet rolled up)
  const todayStr = now.toISOString().split("T")[0];
  const { data: todayEvents } = await supabase
    .from("site_events")
    .select("event_type, visitor_id")
    .eq("site_id", params.siteId)
    .gte("created_at", `${todayStr}T00:00:00.000Z`);

  // Compute today's stats
  const todayStats = emptyStats();
  const todayVisitors = new Set<string>();
  if (todayEvents) {
    for (const e of todayEvents) {
      switch (e.event_type) {
        case "page_view":
          todayStats.total_views++;
          todayVisitors.add(e.visitor_id);
          break;
        case "phone_click": todayStats.phone_clicks++; break;
        case "text_click": todayStats.text_clicks++; break;
        case "form_submit": todayStats.form_submits++; break;
        case "review_click": todayStats.review_clicks++; break;
        case "review_complete": todayStats.review_completes++; break;
        case "booking_request": todayStats.booking_requests++; break;
      }
    }
    todayStats.unique_visitors = todayVisitors.size;
  }

  const current = sumStats([...(currentRows || []), todayStats]);
  const previous = sumStats(previousRows || []);

  // Daily breakdown (include today)
  const daily = [
    ...(currentRows || []).map((r: StatsRow & { stat_date: string }) => ({
      date: r.stat_date,
      ...r,
    })),
    { date: todayStr, ...todayStats },
  ];

  return NextResponse.json({ current, previous, daily });
}
