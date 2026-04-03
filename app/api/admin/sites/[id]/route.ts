import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAdminToken } from "@/lib/admin-auth";

function isAuthed(request: NextRequest): boolean {
  const cookie = request.cookies.get("admin_session");
  return cookie?.value === getAdminToken();
}

const BUSINESS_FIELDS = new Set([
  "name", "owner_name", "phone", "email", "city", "state", "trade", "services", "logo_url",
  "gtm_id", "meta_pixel_id", "zapier_webhook_url",
]);

const SITE_FIELDS = new Set([
  "slug", "is_active", "type",
  "cover_image_url", "qr_redirect_url", "banner_message", "hours_start", "hours_end",
  "badge_licensed", "badge_free_estimates", "badge_emergency", "badge_family_owned",
  "review_count", "avg_rating",
  "headline", "cta_text", "accent_color",
]);

// Legacy field mapping: old contractor_sites field names -> new table/field
const LEGACY_MAP: Record<string, { table: "business" | "site"; field: string }> = {
  business_name: { table: "business", field: "name" },
};

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = getSupabaseAdmin();

  // Look up site to get business_id
  const { data: site } = await supabase
    .from("sites")
    .select("business_id")
    .eq("id", params.id)
    .single();

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  // Split updates into business vs site fields
  const bizUpdates: Record<string, unknown> = {};
  const siteUpdates: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (LEGACY_MAP[key]) {
      const mapped = LEGACY_MAP[key];
      if (mapped.table === "business") bizUpdates[mapped.field] = value;
      else siteUpdates[mapped.field] = value;
    } else if (BUSINESS_FIELDS.has(key)) {
      bizUpdates[key] = value;
    } else if (SITE_FIELDS.has(key)) {
      siteUpdates[key] = value;
    }
  }

  if (Object.keys(bizUpdates).length > 0) {
    const { error } = await supabase
      .from("businesses")
      .update(bizUpdates)
      .eq("id", site.business_id);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // Get business_id before deleting site
  const { data: site } = await supabase
    .from("sites")
    .select("business_id")
    .eq("id", params.id)
    .single();

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  // Delete the site
  const { error: siteErr } = await supabase
    .from("sites")
    .delete()
    .eq("id", params.id);

  if (siteErr) {
    return NextResponse.json({ error: siteErr.message }, { status: 400 });
  }

  // If no other sites reference this business, delete the business too
  const { count } = await supabase
    .from("sites")
    .select("id", { count: "exact", head: true })
    .eq("business_id", site.business_id);

  if (count === 0) {
    await supabase.from("businesses").delete().eq("id", site.business_id);
  }

  return NextResponse.json({ success: true });
}
