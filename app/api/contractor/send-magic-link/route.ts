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
    // Find contractor by email
    const supabase = getSupabaseAdmin();
    // Look up any site for this email
    const { data: sites, error: dbError } = await supabase
      .from("sites_full")
      .select("id, business_email, business_name")
      .ilike("business_email", normalizedEmail)
      .limit(1);

    if (dbError) {
      console.error("[magic-link] DB lookup error:", dbError.message);
      return genericResponse;
    }

    const site = sites?.[0];
    if (!site) {
      console.log("[magic-link] No site found for email:", normalizedEmail);
      return genericResponse;
    }

    console.log("[magic-link] Found site:", site.business_name, "for", normalizedEmail);

    // Rate limit: 1 token per email per minute
    if (await hasRecentToken(normalizedEmail)) {
      console.log("[magic-link] Rate limited:", normalizedEmail);
      return genericResponse;
    }

    // Create token and send email
    const token = await createMagicLinkToken(site.id, normalizedEmail);
    console.log("[magic-link] Token created, sending email to:", site.business_email);

    await sendMagicLinkEmail(site.business_email!, token, site.business_name);
    console.log("[magic-link] Email sent successfully");
  } catch (err) {
    console.error("[magic-link] Error:", err instanceof Error ? err.message : err);
  }

  return genericResponse;
}
