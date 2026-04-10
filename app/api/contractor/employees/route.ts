import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";
import { addEmployeeToResend } from "@/lib/resend-contacts";

export async function GET(request: NextRequest) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("business_id", auth.businessId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, title, phone, email, photo_url, bio, certifications, stats, calendar_url } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("employees")
    .insert({
      business_id: auth.businessId,
      name,
      slug,
      title: title || null,
      phone: phone || null,
      email: email || null,
      photo_url: photo_url || null,
      bio: bio || null,
      certifications: certifications || null,
      stats: stats || null,
      calendar_url: calendar_url || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sync to Resend if employee has email
  if (data.email) {
    try {
      const { data: biz } = await supabase
        .from("businesses")
        .select("name, trade")
        .eq("id", auth.businessId)
        .single();

      await addEmployeeToResend({
        email: data.email,
        name: data.name,
        phone: data.phone || undefined,
        businessName: biz?.name || "",
        trade: biz?.trade || undefined,
      });
    } catch {
      // Non-critical
    }
  }

  return NextResponse.json(data);
}
