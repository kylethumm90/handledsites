import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

export async function POST(
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
    .select("id")
    .eq("id", params.id)
    .eq("business_id", site.business_id)
    .single();

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const body = await request.json();

  if (!body.summary?.trim()) {
    return NextResponse.json({ error: "Note text is required" }, { status: 400 });
  }

  const { data: entry, error } = await supabase
    .from("activity_log")
    .insert({
      business_id: site.business_id,
      lead_id: params.id,
      type: "note",
      summary: body.summary.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(entry);
}
