import { NextRequest, NextResponse } from "next/server";
import {
  verifyMagicLinkToken,
  createSession,
  CONTRACTOR_COOKIE_NAME,
} from "@/lib/contractor-auth";

export async function POST(request: NextRequest) {
  const { token } = await request.json();

  if (!token || typeof token !== "string") {
    return NextResponse.json(
      { error: "Invalid or missing token" },
      { status: 400 }
    );
  }

  const auth = await verifyMagicLinkToken(token);
  if (!auth) {
    return NextResponse.json(
      { error: "Invalid or expired link. Please request a new one." },
      { status: 401 }
    );
  }

  const sessionToken = await createSession(auth);

  const response = NextResponse.json({ success: true, siteId: auth.siteId });
  response.cookies.set(CONTRACTOR_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}
