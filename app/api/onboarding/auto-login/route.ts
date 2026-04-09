import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createSession, CONTRACTOR_COOKIE_NAME } from "@/lib/contractor-auth";
import type { AuthContext } from "@/lib/contractor-auth";

export async function POST(request: NextRequest) {
  const { slug } = await request.json();
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Find a site for this slug to create a session
  const { data: site } = await supabase
    .from("sites")
    .select("id, business_id")
    .eq("slug", slug)
    .limit(1)
    .single();

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  // Look up the business email to find the user
  const { data: business } = await supabase
    .from("businesses")
    .select("email")
    .eq("id", site.business_id)
    .single();

  if (!business?.email) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .ilike("email", business.email)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const authCtx: AuthContext = {
      userId: user.id,
      businessId: site.business_id,
      siteId: site.id,
    };
    const sessionToken = await createSession(authCtx);

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
