import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// In-memory cache for domain lookups (TTL: 60 seconds)
const domainCache = new Map<string, { data: DomainLookup | null; ts: number }>();
const CACHE_TTL = 60_000;

type DomainLookup = {
  business_id: string;
  sites: { slug: string; type: string }[];
};

// Map custom domain paths to internal site type routes
const PATH_TO_TYPE: Record<string, string> = {
  "/": "business_card",
  "/reviews": "review_wall",
  "/quiz": "quiz_funnel",
  "/site": "website",
  "/review": "review_funnel",
};

function getInternalPath(siteType: string, slug: string): string {
  switch (siteType) {
    case "business_card": return `/${slug}`;
    case "review_wall": return `/reviews/${slug}`;
    case "quiz_funnel": return `/q/${slug}`;
    case "website": return `/s/${slug}`;
    case "review_funnel": return `/r/${slug}`;
    default: return `/${slug}`;
  }
}

async function lookupDomain(hostname: string): Promise<DomainLookup | null> {
  const cached = domainCache.get(hostname);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key);

  // Find business by custom domain
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("custom_domain", hostname)
    .eq("domain_status", "active")
    .single();

  if (!business) {
    domainCache.set(hostname, { data: null, ts: Date.now() });
    return null;
  }

  // Find all active sites for this business
  const { data: sites } = await supabase
    .from("sites")
    .select("slug, type")
    .eq("business_id", business.id)
    .eq("is_active", true);

  const result: DomainLookup = {
    business_id: business.id,
    sites: sites || [],
  };

  domainCache.set(hostname, { data: result, ts: Date.now() });
  return result;
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host")?.replace(/:\d+$/, "") || "";

  // Allow normal routing for the main domain and localhost
  const mainDomains = ["handledsites.com", "www.handledsites.com", "localhost"];
  if (mainDomains.some((d) => hostname === d) || hostname.endsWith(".vercel.app")) {
    return NextResponse.next();
  }

  // Custom domain detected - look up business
  const lookup = await lookupDomain(hostname);
  if (!lookup || lookup.sites.length === 0) {
    return NextResponse.next(); // Fall through to 404
  }

  const pathname = request.nextUrl.pathname;

  // Determine which site type the path maps to
  let targetType = PATH_TO_TYPE[pathname];

  // For the root path, default to business_card
  if (!targetType && pathname === "/") {
    targetType = "business_card";
  }

  // If no matching path type, pass through (could be _next, api, etc.)
  if (!targetType) {
    return NextResponse.next();
  }

  // Find the site of the matching type
  const site = lookup.sites.find((s) => s.type === targetType);
  if (!site) {
    return NextResponse.next(); // No site of that type, 404
  }

  // Rewrite to the internal slug-based route
  const internalPath = getInternalPath(site.type, site.slug);
  const url = request.nextUrl.clone();
  url.pathname = internalPath;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next (Next.js internals)
     * - favicon.ico, robots.txt, sitemap.xml
     * - static files (public folder)
     * - contractor/admin dashboard routes
     */
    "/((?!api|_next|favicon\\.ico|robots\\.txt|sitemap\\.xml|public|contractor|admin).*)",
  ],
};
