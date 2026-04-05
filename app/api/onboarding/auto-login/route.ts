import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createSession, CONTRACTOR_COOKIE_NAME } from "@/lib/contractor-auth";

export async function POST(request: NextRequest) {
  const { slug } = await request.json();
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Find a site for this slug to create a session
  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("slug", slug)
    .limit(1)
    .single();

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  try {
    const sessionToken = await createSession(site.id);

    const response = NextResponse.json({ success: true });
    response.cookies.set(CONTRACTOR_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
