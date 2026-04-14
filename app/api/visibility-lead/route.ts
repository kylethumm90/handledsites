import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, business_name, city, state, trade, score, grade, gaps_missing } = body;

  if (!email || !business_name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("visibility_leads")
    .insert({
      email: email.toLowerCase().trim(),
      business_name,
      city: city || null,
      state: state || null,
      trade: trade || null,
      score: typeof score === "number" ? score : null,
      grade: grade || null,
      gaps_missing: typeof gaps_missing === "number" ? gaps_missing : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id });
}
