import { NextRequest, NextResponse } from "next/server";
import { getAdminToken } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createSession, CONTRACTOR_COOKIE_NAME } from "@/lib/contractor-auth";
import type { AuthContext } from "@/lib/contractor-auth";

export async function POST(request: NextRequest) {
  const cookie = request.cookies.get("admin_session");
  if (cookie?.value !== getAdminToken()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { siteId } = await request.json();
  if (!siteId) {
    return NextResponse.json({ error: "Missing siteId" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Look up business from site
  const { data: site } = await supabase
    .from("sites")
    .select("business_id")
    .eq("id", siteId)
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
      siteId,
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
  } catch (err) {
    console.error("[impersonate] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create session" },
      { status: 500 }
    );
  }
}
