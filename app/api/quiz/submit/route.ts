import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { addressFromLead } from "@/lib/leads";

export async function POST(request: NextRequest) {
  let body: {
    site_id: string;
    name: string;
    phone: string;
    email: string;
    answers: Record<string, string>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { site_id, name, phone, email, answers } = body;

  if (!site_id || !name || !phone) {
    return NextResponse.json(
      { error: "Name and phone are required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Look up business_id from the site
  const { data: site } = await supabase
    .from("sites")
    .select("business_id")
    .eq("id", site_id)
    .single();

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  // Quiz funnels collect an address in `answers` under whatever field key
  // the quiz builder chose (full_address, street_address, etc.). Derive a
  // canonical single-line address now and write it to the real column so
  // the detail card, search, and downstream flows don't have to re-parse
  // it from JSON every time.
  const derivedAddress = addressFromLead({
    answers,
    raw_import_data: null,
  });

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      business_id: site.business_id,
      site_id,
      source: "quiz_funnel",
      name,
      phone,
      email: email || null,
      answers,
      address: derivedAddress,
    })
    .select("id")
    .single();

  if (error || !lead) {
    console.error("Quiz lead insert error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }

  // Log creation to The Story. Best-effort — never fail the submission.
  await supabase
    .from("activity_log")
    .insert({
      business_id: site.business_id,
      lead_id: lead.id,
      type: "lead_created",
      summary: "New lead from quiz funnel",
    })
    .then(() => {}, () => {});

  return NextResponse.json({ success: true });
}
