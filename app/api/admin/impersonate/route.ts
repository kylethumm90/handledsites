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

  // Look up the business to find or create a user
  const { data: business } = await supabase
    .from("businesses")
    .select("email, owner_name")
    .eq("id", site.business_id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  let userId: string;

  if (business.email) {
    // Try to find existing user
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .ilike("email", business.email)
      .single();

    if (user) {
      userId = user.id;
    } else {
      // Auto-create user for this business
      const { data: newUser } = await supabase
        .from("users")
        .upsert({ email: business.email.toLowerCase(), name: business.owner_name || null }, { onConflict: "email" })
        .select("id")
        .single();

      if (!newUser) {
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
      }
      userId = newUser.id;

      await supabase
        .from("user_business_roles")
        .upsert({ user_id: userId, business_id: site.business_id, role: "owner" }, { onConflict: "user_id,business_id" });
    }
  } else {
    // No email — create a placeholder user for impersonation
    const placeholderEmail = `admin-impersonate-${site.business_id}@handled.internal`;
    const { data: placeholder } = await supabase
      .from("users")
      .upsert({ email: placeholderEmail, name: business.owner_name || "Admin View" }, { onConflict: "email" })
      .select("id")
      .single();

    if (!placeholder) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }
    userId = placeholder.id;

    await supabase
      .from("user_business_roles")
      .upsert({ user_id: userId, business_id: site.business_id, role: "owner" }, { onConflict: "user_id,business_id" });
  }

  try {
    const authCtx: AuthContext = {
      userId,
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
