import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  let body: {
    funnel_id: string;
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

  const { funnel_id, name, phone, email, answers } = body;

  if (!funnel_id || !name || !phone) {
    return NextResponse.json(
      { error: "Name and phone are required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("quiz_leads").insert({
    funnel_id,
    name,
    phone,
    email: email || null,
    answers,
  });

  if (error) {
    console.error("Quiz lead insert error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
