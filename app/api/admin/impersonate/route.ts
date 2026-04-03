import { NextRequest, NextResponse } from "next/server";
import { getAdminToken } from "@/lib/admin-auth";
import { createSession, CONTRACTOR_COOKIE_NAME } from "@/lib/contractor-auth";

export async function POST(request: NextRequest) {
  const cookie = request.cookies.get("admin_session");
  if (cookie?.value !== getAdminToken()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { siteId } = await request.json();
  if (!siteId) {
    return NextResponse.json({ error: "Missing siteId" }, { status: 400 });
  }

  try {
    const sessionToken = await createSession(siteId);

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
