import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    has_resend_key: !!process.env.RESEND_API_KEY,
    resend_key_prefix: process.env.RESEND_API_KEY?.slice(0, 6) || "NOT SET",
    has_base_url: !!process.env.NEXT_PUBLIC_BASE_URL,
    base_url: process.env.NEXT_PUBLIC_BASE_URL || "NOT SET",
    has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    email_from: process.env.EMAIL_FROM || "onboarding@resend.dev (default)",
  });
}
