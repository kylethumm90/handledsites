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
    .from("sites")
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

    const cleanPhone = phone.replace(/\D/g, "");

    // Create business first
    const { data: biz, error: bizError } = await supabase
      .from("businesses")
      .insert({
        name: business_name,
        owner_name,
        phone: cleanPhone,
        email: email || null,
        city,
        state,
        trade,
        services: [],
      })
      .select("id")
      .single();

    if (bizError) {
      if (bizError.message.includes("idx_businesses_phone")) {
        return NextResponse.json({ error: "A business with this phone number already exists" }, { status: 409 });
      }
      if (bizError.message.includes("idx_businesses_email")) {
        return NextResponse.json({ error: "A business with this email already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: bizError.message }, { status: 400 });
    }

    // Create all three site types
    const { data: sites, error: siteError } = await supabase
      .from("sites")
      .insert([
        { business_id: biz.id, type: "business_card", slug },
        { business_id: biz.id, type: "quiz_funnel", slug },
        { business_id: biz.id, type: "review_funnel", slug },
        { business_id: biz.id, type: "website", slug },
        { business_id: biz.id, type: "review_wall", slug },
      ])
      .select("id, type");

    if (siteError) {
      return NextResponse.json({ error: siteError.message }, { status: 400 });
    }

    const cardSite = sites?.find((s) => s.type === "business_card");
    return NextResponse.json({ id: cardSite?.id || sites?.[0]?.id, slug });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create site" },
      { status: 400 }
    );
  }
}
