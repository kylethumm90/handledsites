import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  SignupError,
  SITE_TYPES,
  checkDuplicateContact,
  generateUniqueSlug,
  sanitizeLogoUrl,
} from "@/lib/signup";

/**
 * Public signup. Creates a business plus its five sites.
 *
 * Runs server-side with the service-role key so that `businesses` and `sites`
 * need no public RLS policies. Everything in the body is untrusted.
 */

type Badges = {
  licensed?: boolean;
  freeEstimates?: boolean;
  emergency?: boolean;
  familyOwned?: boolean;
};

type GoogleProfile = {
  placeId?: string | null;
  streetAddress?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  reviews?: unknown;
  reviewUrl?: string | null;
};

function str(value: unknown, max = 200): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Honeypot — a filled hidden field means a bot. Look successful, do nothing.
  if (str(body.honeypot)) {
    return NextResponse.json({ ok: true });
  }

  const businessName = str(body.businessName);
  const ownerName = str(body.ownerName);
  const phone = str(body.phone).replace(/\D/g, "");
  const email = str(body.email).toLowerCase() || null;
  const city = str(body.city);
  const state = str(body.state, 2).toUpperCase();
  const trade = str(body.trade, 60);
  const services = Array.isArray(body.services)
    ? body.services.filter((s): s is string => typeof s === "string").slice(0, 20)
    : [];

  if (!businessName || !city || !state || !trade) {
    return NextResponse.json(
      { error: "Business name, city, state and trade are required." },
      { status: 400 }
    );
  }
  if (phone.length !== 10) {
    return NextResponse.json(
      { error: "Enter a valid 10-digit US phone number." },
      { status: 400 }
    );
  }
  if (state.length !== 2) {
    return NextResponse.json({ error: "Enter a valid state." }, { status: 400 });
  }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const badges = (body.badges || {}) as Badges;
  const google = (body.google || null) as GoogleProfile | null;
  const logoUrl = sanitizeLogoUrl(body.logoUrl);

  const supabase = getSupabaseAdmin();

  try {
    const duplicate = await checkDuplicateContact(supabase, phone, email);
    if (duplicate) {
      return NextResponse.json({ error: duplicate }, { status: 409 });
    }

    const slug = await generateUniqueSlug(supabase, businessName);

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .insert({
        name: businessName,
        owner_name: ownerName || businessName,
        phone,
        email,
        city,
        state,
        trade,
        services,
        logo_url: logoUrl,
        google_place_id: google?.placeId || null,
        street_address: google?.streetAddress || null,
        google_rating: google?.rating ?? null,
        google_review_count: google?.reviewCount ?? null,
        google_reviews: google?.reviews ?? null,
        google_review_url: google?.reviewUrl || null,
      })
      .select("id")
      .single();

    if (businessError || !business) {
      console.error("Signup: business insert failed", businessError);
      return NextResponse.json(
        { error: "Could not create your account. Please try again." },
        { status: 500 }
      );
    }

    const { error: sitesError } = await supabase.from("sites").insert(
      SITE_TYPES.map((type) =>
        type === "business_card"
          ? {
              business_id: business.id,
              type,
              slug,
              badge_licensed: !!badges.licensed,
              badge_free_estimates: !!badges.freeEstimates,
              badge_emergency: !!badges.emergency,
              badge_family_owned: !!badges.familyOwned,
            }
          : { business_id: business.id, type, slug }
      )
    );

    if (sitesError) {
      // Don't leave a business with no sites behind.
      await supabase.from("businesses").delete().eq("id", business.id);
      console.error("Signup: sites insert failed", sitesError);
      return NextResponse.json(
        { error: "Could not create your sites. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ slug, businessId: business.id });
  } catch (err) {
    if (err instanceof SignupError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Signup failed", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
