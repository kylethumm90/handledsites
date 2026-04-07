import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const ALLOWED_EVENTS = new Set([
  "page_view",
  "phone_click",
  "text_click",
  "form_submit",
  "review_click",
  "review_complete",
  "booking_request",
]);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS_HEADERS });
  }

  const { site_id, event_type, page_path, visitor_id, referrer, user_agent } = body as {
    site_id?: string;
    event_type?: string;
    page_path?: string;
    visitor_id?: string;
    referrer?: string;
    user_agent?: string;
  };

  if (!site_id || !event_type || !visitor_id) {
    return NextResponse.json(
      { error: "site_id, event_type, and visitor_id are required" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (!ALLOWED_EVENTS.has(event_type)) {
    return NextResponse.json(
      { error: `Invalid event_type. Allowed: ${Array.from(ALLOWED_EVENTS).join(", ")}` },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const supabase = getSupabaseAdmin();

  // Server-side 30s dedup
  const { data: existing } = await supabase
    .from("site_events")
    .select("id")
    .eq("visitor_id", visitor_id)
    .eq("event_type", event_type)
    .eq("site_id", site_id)
    .gte("created_at", new Date(Date.now() - 30_000).toISOString())
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ success: true, deduplicated: true }, { headers: CORS_HEADERS });
  }

  const { error } = await supabase.from("site_events").insert({
    site_id,
    event_type,
    page_path: page_path || null,
    visitor_id,
    referrer: referrer || null,
    user_agent: user_agent || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }

  return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
}
