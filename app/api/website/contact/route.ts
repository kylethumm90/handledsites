import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { site_id, name, phone, service_needed, message } = body;

  if (!site_id || !name || !phone) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: site } = await supabase
    .from("sites")
    .select("business_id")
    .eq("id", site_id)
    .single();

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      business_id: site.business_id,
      site_id,
      source: "website_contact",
      name,
      phone: phone.replace(/\D/g, ""),
      service_needed: service_needed || null,
      notes: message || null,
    })
    .select("id")
    .single();

  if (error || !lead) {
    console.error("Website contact insert error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }

  // Log creation + optional message to The Story. Best-effort.
  await supabase
    .from("activity_log")
    .insert({
      business_id: site.business_id,
      lead_id: lead.id,
      type: "lead_created",
      summary: service_needed
        ? `New lead from contact form (${service_needed})`
        : "New lead from contact form",
    })
    .then(() => {}, () => {});

  if (message?.trim()) {
    await supabase
      .from("activity_log")
      .insert({
        business_id: site.business_id,
        lead_id: lead.id,
        type: "note",
        summary: message.trim(),
      })
      .then(() => {}, () => {});
  }

  return NextResponse.json({ success: true });
}
