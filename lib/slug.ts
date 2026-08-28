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
