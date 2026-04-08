import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAdminToken } from "@/lib/admin-auth";
import { getResend } from "@/lib/email";

function isAuthed(request: NextRequest): boolean {
  const cookie = request.cookies.get("admin_session");
  return cookie?.value === getAdminToken();
}

export async function POST(request: NextRequest) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const resend = getResend();

  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("id, name, owner_name, email, phone, city, state, trade")
    .not("email", "is", null)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let success = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const biz of businesses) {
    if (!biz.email) continue;

    const [firstName, ...rest] = (biz.owner_name || "").split(" ");
    const lastName = rest.join(" ");

    try {
      await resend.contacts.create({
        email: biz.email,
        firstName: firstName || biz.name,
        lastName: lastName || "",
        properties: {
          business_name: biz.name || "",
          phone: biz.phone || "",
          city: biz.city || "",
          state: biz.state || "",
          trade: biz.trade || "",
        },
      });
      success++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already exists")) {
        skipped++;
      } else {
        failed++;
        errors.push(`${biz.email}: ${msg}`);
      }
    }
  }

  return NextResponse.json({
    total: businesses.length,
    success,
    skipped,
    failed,
    errors: errors.slice(0, 10),
  });
}
