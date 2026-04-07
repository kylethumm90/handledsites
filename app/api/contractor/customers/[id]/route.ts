import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const siteId = await validateSessionFromRequest(request);
  if (!siteId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: site } = await supabase
    .from("sites")
    .select("business_id")
    .eq("id", siteId)
    .single();

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  // Verify lead belongs to this business
  const { data: lead } = await supabase
    .from("leads")
    .select("id, status, business_id")
    .eq("id", params.id)
    .eq("business_id", site.business_id)
    .single();

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const body = await request.json();

  const ALLOWED = new Set(["status", "service_needed", "notes", "tags"]);
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED.has(key)) updates[key] = value;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { error } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Log status change
  if (updates.status && updates.status !== lead.status) {
    await supabase.from("activity_log").insert({
      business_id: site.business_id,
      lead_id: params.id,
      type: "status_change",
      summary: `Status changed to ${updates.status}`,
    });
  }

  return NextResponse.json({ success: true });
}
