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
    const { data: site } = await supabase
      .from("contractor_sites")
      .select("id, email, business_name")
      .ilike("email", normalizedEmail)
      .single();

    if (!site) return genericResponse;

    // Rate limit: 1 token per email per minute
    if (await hasRecentToken(normalizedEmail)) {
      return genericResponse;
    }

    // Create token and send email
    const token = await createMagicLinkToken(site.id, normalizedEmail);
    await sendMagicLinkEmail(site.email!, token, site.business_name);
  } catch {
    // Swallow errors — don't reveal whether email exists
  }

  return genericResponse;
}
