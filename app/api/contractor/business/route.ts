import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

const ALLOWED_FIELDS = new Set([
  "name", "owner_name", "phone", "email", "city", "state", "trade", "services", "logo_url",
  "about_bio", "years_in_business", "service_areas", "license_number", "hero_tagline",
  "social_facebook", "social_instagram", "social_google", "social_nextdoor",
  "street_address", "google_place_id", "google_rating", "google_review_count", "google_reviews",
  "gtm_id", "meta_pixel_id", "zapier_webhook_url", "google_review_url",
]);

export async function PUT(request: NextRequest) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { businessId } = auth;

  const body = await request.json();

  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(key)) {
      updates[key] = value;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("id", businessId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
