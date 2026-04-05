import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

export async function POST(request: NextRequest) {
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

  const body = await request.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      business_id: site.business_id,
      name: body.name.trim(),
      phone: body.phone?.replace(/\D/g, "") || "",
      email: body.email?.trim() || null,
      service_needed: body.service_needed || null,
      notes: body.notes?.trim() || null,
      source: "manual",
      status: "new",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Create activity log entry
  await supabase.from("activity_log").insert({
    business_id: site.business_id,
    lead_id: lead.id,
    type: "lead_created",
    summary: "Added manually",
  });

  return NextResponse.json(lead);
}
