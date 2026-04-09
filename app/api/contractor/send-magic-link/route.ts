import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createMagicLinkToken, hasRecentToken } from "@/lib/contractor-auth";
import { sendMagicLinkEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { message: "Check your email for a login link." },
      { status: 200 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Always return same response to prevent email enumeration
  const genericResponse = NextResponse.json({
    message: "If an account exists with that email, we sent a login link.",
  });

  try {
    const supabase = getSupabaseAdmin();

    // Look up user by email
    let userId: string | null = null;
    let businessName: string | null = null;

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .ilike("email", normalizedEmail)
      .single();

    if (user) {
      userId = user.id;
      // Get business name for the email
      const { data: role } = await supabase
        .from("user_business_roles")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      if (role) {
        const { data: biz } = await supabase
          .from("businesses")
          .select("name")
          .eq("id", role.business_id)
          .single();
        businessName = biz?.name || null;
      }
    } else {
      // Legacy fallback: lookup business by email and auto-create user
      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name, owner_name, email")
        .ilike("email", normalizedEmail)
        .limit(1)
        .single();

      if (!biz) return genericResponse;

      businessName = biz.name;

      // Auto-create user + role link
      const { data: newUser } = await supabase
        .from("users")
        .upsert({ email: normalizedEmail, name: biz.owner_name }, { onConflict: "email" })
        .select("id")
        .single();

      if (!newUser) return genericResponse;
      userId = newUser.id;

      await supabase
        .from("user_business_roles")
        .upsert({ user_id: newUser.id, business_id: biz.id, role: "owner" }, { onConflict: "user_id,business_id" });
    }

    if (!userId || !businessName) return genericResponse;

    // Rate limit: 1 token per email per minute
    if (await hasRecentToken(normalizedEmail)) return genericResponse;

    // Create token and send email
    const token = await createMagicLinkToken(userId, normalizedEmail);
    await sendMagicLinkEmail(normalizedEmail, token, businessName);
  } catch (err) {
    console.error("[magic-link] Error:", err instanceof Error ? err.message : err);
  }

  return genericResponse;
}
