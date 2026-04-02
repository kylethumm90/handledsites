import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  let body: { name: string; email: string; phone: string; source: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, phone, source } = body;

  if (!name || !email || !phone || !source) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const supabase = createClient(url, key);

  const { error } = await supabase.from("waitlist").insert({
    name,
    email,
    phone,
    source,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Waitlist insert error:", error);
    return NextResponse.json(
      { error: "Something went wrong -- please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
