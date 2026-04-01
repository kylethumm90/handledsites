import { NextRequest, NextResponse } from "next/server";
import { clearSession, CONTRACTOR_COOKIE_NAME } from "@/lib/contractor-auth";

export async function POST(request: NextRequest) {
  await clearSession(request);

  const response = NextResponse.json({ success: true });
  response.cookies.set(CONTRACTOR_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
