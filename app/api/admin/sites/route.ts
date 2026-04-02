import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAdminToken } from "@/lib/admin-auth";
import { sanitizeSlug, isReservedSlug, containsProfanity } from "@/lib/slug";

function isAuthed(request: NextRequest): boolean {
  const cookie = request.cookies.get("admin_session");
  return cookie?.value === getAdminToken();
}

async function generateUniqueSlugServer(businessName: string): Promise<string> {
  let slug = sanitizeSlug(businessName);
  if (!slug) slug = "my-business";
  if (isReservedSlug(slug)) slug = `${slug}-pro`;
  if (containsProfanity(slug)) {
    throw new Error("Business name contains inappropriate language.");
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("contractor_sites")
    .select("slug")
    .like("slug", `${slug}%`);

  if (!data || data.length === 0) return slug;
  const existingSlugs = new Set(data.map((row) => row.slug));
  if (!existingSlugs.has(slug)) return slug;

  let counter = 2;
  while (existingSlugs.has(`${slug}-${counter}`)) counter++;
  return `${slug}-${counter}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { business_name, owner_name, phone, email, city, state, trade } = body;

  if (!business_name || !owner_name || !phone || !city || !state || !trade) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (phone.replace(/\D/g, "").length !== 10) {
    return NextResponse.json({ error: "Phone must be 10 digits" }, { status: 400 });
  }

  try {
    const slug = await generateUniqueSlugServer(business_name);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("contractor_sites")
      .insert({
        business_name,
        owner_name,
        phone: phone.replace(/\D/g, ""),
        email: email || null,
        city,
        state,
        trade,
        slug,
        services: [],
      })
      .select("id")
      .single();

    if (error) {
      if (error.message.includes("idx_contractor_sites_phone")) {
        return NextResponse.json({ error: "A site with this phone number already exists" }, { status: 409 });
      }
      if (error.message.includes("idx_contractor_sites_email")) {
        return NextResponse.json({ error: "A site with this email already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ id: data.id, slug });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create site" },
      { status: 400 }
    );
  }
}
