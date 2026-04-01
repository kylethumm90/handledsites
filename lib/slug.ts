import { getSupabaseClient } from "./supabase";

const RESERVED_PATHS = [
  "api",
  "admin",
  "_next",
  "favicon",
  "sitemap",
  "robots",
  "login",
  "signup",
  "dashboard",
  "settings",
  "profile",
  "about",
  "contact",
  "pricing",
  "terms",
  "privacy",
];

const PROFANITY_LIST = [
  "ass",
  "damn",
  "hell",
  "shit",
  "fuck",
  "bitch",
  "dick",
  "crap",
  "piss",
  "cock",
  "cunt",
  "bastard",
  "slut",
  "whore",
];

export function sanitizeSlug(businessName: string): string {
  return businessName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_PATHS.includes(slug);
}

export function containsProfanity(slug: string): boolean {
  const words = slug.split("-");
  return words.some((word) => PROFANITY_LIST.includes(word));
}

export async function generateUniqueSlug(businessName: string): Promise<string> {
  let slug = sanitizeSlug(businessName);

  if (!slug) {
    slug = "my-business";
  }

  if (isReservedSlug(slug)) {
    slug = `${slug}-pro`;
  }

  if (containsProfanity(slug)) {
    throw new Error("Business name contains inappropriate language.");
  }

  // Check for collision
  const { data } = await getSupabaseClient()
    .from("contractor_sites")
    .select("slug")
    .like("slug", `${slug}%`);

  if (!data || data.length === 0) {
    return slug;
  }

  const existingSlugs = new Set(data.map((row) => row.slug));

  if (!existingSlugs.has(slug)) {
    return slug;
  }

  let counter = 2;
  while (existingSlugs.has(`${slug}-${counter}`)) {
    counter++;
  }
  return `${slug}-${counter}`;
}

export async function checkDuplicateContact(
  phone: string,
  email: string | null
): Promise<string | null> {
  const supabase = getSupabaseClient();

  const { data: phoneMatch } = await supabase
    .from("contractor_sites")
    .select("id")
    .eq("phone", phone)
    .limit(1);

  if (phoneMatch && phoneMatch.length > 0) {
    return "A site with this phone number already exists.";
  }

  if (email) {
    const { data: emailMatch } = await supabase
      .from("contractor_sites")
      .select("id")
      .ilike("email", email)
      .limit(1);

    if (emailMatch && emailMatch.length > 0) {
      return "A site with this email address already exists.";
    }
  }

  return null;
}
