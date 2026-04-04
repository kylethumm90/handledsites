import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAdminToken } from "@/lib/admin-auth";

function isAuthed(request: NextRequest): boolean {
  const cookie = request.cookies.get("admin_session");
  return cookie?.value === getAdminToken();
}

const ALLOWED_FIELDS = new Set([
  "name", "owner_name", "phone", "email", "city", "state", "trade", "services", "logo_url",
  "gtm_id", "meta_pixel_id", "zapier_webhook_url",
]);

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = getSupabaseAdmin();

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
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
