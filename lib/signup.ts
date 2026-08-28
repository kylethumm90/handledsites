import { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeSlug, isReservedSlug, containsProfanity } from "./slug";

/**
 * Server-side signup helpers.
 *
 * These run with the service-role client only. They used to run in the browser
 * against the anon key, which required public SELECT/INSERT policies on
 * `businesses` and `sites` — those policies exposed every business record to
 * anyone holding the (publicly shipped) anon key.
 */

export class SignupError extends Error {}

/** Find a free slug, appending -2, -3, ... on collision. */
export async function generateUniqueSlug(
  supabase: SupabaseClient,
  businessName: string
): Promise<string> {
  let slug = sanitizeSlug(businessName);

  if (!slug) slug = "my-business";
  if (isReservedSlug(slug)) slug = `${slug}-pro`;
  if (containsProfanity(slug)) {
    throw new SignupError("Business name contains inappropriate language.");
  }

  const { data } = await supabase
    .from("sites")
    .select("slug")
    .like("slug", `${slug}%`);

  if (!data || data.length === 0) return slug;

  const existing = new Set(data.map((row) => row.slug));
  if (!existing.has(slug)) return slug;

  let counter = 2;
  while (existing.has(`${slug}-${counter}`)) counter++;
  return `${slug}-${counter}`;
}

/** Returns a human-readable message if this phone/email is already signed up. */
export async function checkDuplicateContact(
  supabase: SupabaseClient,
  phone: string,
  email: string | null
): Promise<string | null> {
  const { data: phoneMatch } = await supabase
    .from("businesses")
    .select("id")
    .eq("phone", phone)
    .limit(1);

  if (phoneMatch && phoneMatch.length > 0) {
    return "A business with this phone number already exists.";
  }

  if (email) {
    const { data: emailMatch } = await supabase
      .from("businesses")
      .select("id")
      .ilike("email", email)
      .limit(1);

    if (emailMatch && emailMatch.length > 0) {
      return "A business with this email address already exists.";
    }
  }

  return null;
}

/**
 * A logo URL arrives from the browser, so it can't be trusted. Only accept
 * public URLs inside our own storage bucket.
 */
export function sanitizeLogoUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const prefix = `${base.replace(/\/$/, "")}/storage/v1/object/public/contractor-assets/`;
  return value.startsWith(prefix) ? value : null;
}

/** The five public surfaces every business gets on signup. */
export const SITE_TYPES = [
  "business_card",
  "quiz_funnel",
  "review_funnel",
  "website",
  "review_wall",
] as const;
