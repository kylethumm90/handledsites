import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

const BUSINESS_FIELDS = new Set([
  "business_name", "owner_name", "phone", "email", "city", "state", "trade", "services", "logo_url",
  "gtm_id", "meta_pixel_id", "zapier_webhook_url",
]);

const SITE_FIELDS = new Set([
  "banner_message", "hours_start", "hours_end",
  "badge_licensed", "badge_free_estimates", "badge_emergency", "badge_family_owned",
]);

const ALLOWED_FIELDS = new Set(
  Array.from(BUSINESS_FIELDS).concat(Array.from(SITE_FIELDS))
);

// Map old field names to new table/field
const FIELD_MAP: Record<string, { table: "business" | "site"; field: string }> = {
  business_name: { table: "business", field: "name" },
};

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { businessId } = auth;

  // Ownership check: verify the target site belongs to the same business
  const supabase = getSupabaseAdmin();
  const { data: targetSite } = await supabase
    .from("sites")
    .select("business_id")
    .eq("id", params.id)
    .single();

  if (!targetSite || targetSite.business_id !== businessId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const bizUpdates: Record<string, unknown> = {};
  const siteUpdates: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_FIELDS.has(key)) continue;

    if (FIELD_MAP[key]) {
      const mapped = FIELD_MAP[key];
      if (mapped.table === "business") bizUpdates[mapped.field] = value;
      else siteUpdates[mapped.field] = value;
    } else if (BUSINESS_FIELDS.has(key)) {
      bizUpdates[key] = value;
    } else if (SITE_FIELDS.has(key)) {
      siteUpdates[key] = value;
    }
  }

  if (Object.keys(bizUpdates).length === 0 && Object.keys(siteUpdates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  if (Object.keys(bizUpdates).length > 0) {
    const { error } = await supabase
      .from("businesses")
      .update(bizUpdates)
      .eq("id", businessId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (Object.keys(siteUpdates).length > 0) {
    const { error } = await supabase
      .from("sites")
      .update(siteUpdates)
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
