import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

export async function POST(request: NextRequest) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { businessId } = auth;

  const body = await request.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      business_id: businessId,
      name: body.name.trim(),
      phone: body.phone?.replace(/\D/g, "") || "",
      email: body.email?.trim() || null,
      service_needed: body.service_needed || null,
      notes: body.notes?.trim() || null,
      source: "manual",
      status: "lead",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Create activity log entry
  await supabase.from("activity_log").insert({
    business_id: businessId,
    lead_id: lead.id,
    type: "lead_created",
    summary: "Added manually",
  });

  return NextResponse.json(lead);
}
