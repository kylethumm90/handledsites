import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

const ALLOWED_FIELDS = new Set([
  "name", "owner_name", "phone", "email", "city", "state", "trade", "services", "logo_url",
  "gtm_id", "meta_pixel_id", "zapier_webhook_url",
]);

export async function PUT(request: NextRequest) {
  const siteId = await validateSessionFromRequest(request);
  if (!siteId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // Look up business_id from the contractor's site
  const { data: site } = await supabase
    .from("sites")
    .select("business_id")
    .eq("id", siteId)
    .single();

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

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

  const { error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("id", site.business_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
