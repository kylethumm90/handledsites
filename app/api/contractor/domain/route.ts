import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";
import {
  addDomain,
  removeDomain,
  verifyDomain,
  sanitizeDomain,
  isValidDomain,
  isBlockedDomain,
} from "@/lib/domains";

/** Helper: get business_id from contractor session */
async function getBusinessId(request: NextRequest): Promise<{ businessId: string } | NextResponse> {
  const siteId = await validateSessionFromRequest(request);
  if (!siteId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: site } = await supabase
    .from("sites")
    .select("business_id")
    .eq("id", siteId)
    .single();

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  return { businessId: site.business_id };
}

/** POST - Add a custom domain to the business */
export async function POST(request: NextRequest) {
  const result = await getBusinessId(request);
  if (result instanceof NextResponse) return result;
  const { businessId } = result;

  const body = await request.json();
  const rawDomain = body.domain;
  if (!rawDomain || typeof rawDomain !== "string") {
    return NextResponse.json({ error: "Domain is required" }, { status: 400 });
  }

  const domain = sanitizeDomain(rawDomain);

  if (!isValidDomain(domain)) {
    return NextResponse.json(
      { error: "Invalid domain format. Enter a domain like example.com" },
      { status: 400 }
    );
  }

  if (isBlockedDomain(domain)) {
    return NextResponse.json(
      { error: "This domain cannot be used" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Check if domain is already claimed by another business
  const { data: existing } = await supabase
    .from("businesses")
    .select("id")
    .eq("custom_domain", domain)
    .neq("id", businessId)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "This domain is already in use by another business" },
      { status: 409 }
    );
  }

  // Add domain to Vercel project
  const vercelResult = await addDomain(domain);
  if (!vercelResult.success) {
    return NextResponse.json(
      { error: vercelResult.error || "Failed to add domain to hosting provider" },
      { status: 502 }
    );
  }

  // Save to database
  const { error: dbError } = await supabase
    .from("businesses")
    .update({
      custom_domain: domain,
      domain_status: "pending",
      domain_error: null,
    })
    .eq("id", businessId);

  if (dbError) {
    // Rollback: remove from Vercel
    await removeDomain(domain);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Determine if apex or subdomain for DNS instructions
  const isApex = domain.split(".").length === 2;

  return NextResponse.json({
    success: true,
    domain,
    status: "pending",
    dns: isApex
      ? { type: "A", name: "@", value: "76.76.21.21" }
      : { type: "CNAME", name: domain.split(".")[0], value: "cname.vercel-dns.com" },
  });
}

/** GET - Check domain verification status */
export async function GET(request: NextRequest) {
  const result = await getBusinessId(request);
  if (result instanceof NextResponse) return result;
  const { businessId } = result;

  const supabase = getSupabaseAdmin();
  const { data: business } = await supabase
    .from("businesses")
    .select("custom_domain, domain_status, domain_error")
    .eq("id", businessId)
    .single();

  if (!business?.custom_domain) {
    return NextResponse.json({ domain: null, status: "none" });
  }

  // Check verification with Vercel
  const verification = await verifyDomain(business.custom_domain);

  let newStatus = business.domain_status;
  let newError: string | null = business.domain_error;

  if (verification.verified && verification.configured) {
    newStatus = "active";
    newError = null;
  } else if (verification.error) {
    newStatus = "error";
    newError = verification.error;
  } else if (!verification.configured) {
    newStatus = "pending";
    newError = "DNS not yet configured. Please add the required DNS records.";
  }

  // Update status in DB if changed
  if (newStatus !== business.domain_status || newError !== business.domain_error) {
    await supabase
      .from("businesses")
      .update({ domain_status: newStatus, domain_error: newError })
      .eq("id", businessId);
  }

  const isApex = business.custom_domain.split(".").length === 2;

  return NextResponse.json({
    domain: business.custom_domain,
    status: newStatus,
    error: newError,
    dns: isApex
      ? { type: "A", name: "@", value: "76.76.21.21" }
      : { type: "CNAME", name: business.custom_domain.split(".")[0], value: "cname.vercel-dns.com" },
  });
}

/** DELETE - Remove custom domain from the business */
export async function DELETE(request: NextRequest) {
  const result = await getBusinessId(request);
  if (result instanceof NextResponse) return result;
  const { businessId } = result;

  const supabase = getSupabaseAdmin();
  const { data: business } = await supabase
    .from("businesses")
    .select("custom_domain")
    .eq("id", businessId)
    .single();

  if (!business?.custom_domain) {
    return NextResponse.json({ error: "No custom domain configured" }, { status: 400 });
  }

  // Remove from Vercel
  await removeDomain(business.custom_domain);

  // Clear from database
  const { error: dbError } = await supabase
    .from("businesses")
    .update({
      custom_domain: null,
      domain_status: "none",
      domain_error: null,
    })
    .eq("id", businessId);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
