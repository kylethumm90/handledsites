import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, name, phone, business_name, place_id, rating, review_count, grade, score } = body;

  if (!email || !business_name || !place_id || !grade) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("grader_leads")
    .insert({
      email: email.toLowerCase().trim(),
      name: name || null,
      phone: phone || null,
      business_name,
      place_id,
      rating: rating || null,
      review_count: review_count || null,
      grade,
      score: score || 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id });
}
