// Vercel Domains API client for custom domain management

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

function getHeaders() {
  if (!VERCEL_TOKEN) throw new Error("Missing VERCEL_TOKEN environment variable");
  return {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    "Content-Type": "application/json",
  };
}

function teamQuery(): string {
  return VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "";
}

export type DomainConfig = {
  configured: boolean;
  misconfigured: boolean;
  cnames: string[];
  aValues: string[];
};

export type AddDomainResult = {
  success: boolean;
  error?: string;
};

export type DomainVerification = {
  verified: boolean;
  configured: boolean;
  error?: string;
};

/** Add a custom domain to the Vercel project */
export async function addDomain(domain: string): Promise<AddDomainResult> {
  if (!VERCEL_PROJECT_ID) throw new Error("Missing VERCEL_PROJECT_ID environment variable");

  const res = await fetch(
    `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains${teamQuery()}`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ name: domain }),
    }
  );

  if (res.ok) {
    return { success: true };
  }

  const body = await res.json();
  return {
    success: false,
    error: body.error?.message || `Failed to add domain (${res.status})`,
  };
}

/** Remove a custom domain from the Vercel project */
export async function removeDomain(domain: string): Promise<{ success: boolean; error?: string }> {
  if (!VERCEL_PROJECT_ID) throw new Error("Missing VERCEL_PROJECT_ID environment variable");

  const res = await fetch(
    `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}${teamQuery()}`,
    {
      method: "DELETE",
      headers: getHeaders(),
    }
  );

  if (res.ok) {
    return { success: true };
  }

  const body = await res.json();
  return {
    success: false,
    error: body.error?.message || `Failed to remove domain (${res.status})`,
  };
}

/** Check DNS configuration for a domain via Vercel */
export async function getDomainConfig(domain: string): Promise<DomainConfig> {
  const res = await fetch(
    `https://api.vercel.com/v6/domains/${domain}/config${teamQuery()}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  if (!res.ok) {
    return { configured: false, misconfigured: false, cnames: [], aValues: [] };
  }

  const body = await res.json();
  return {
    configured: !body.misconfigured,
    misconfigured: body.misconfigured ?? false,
    cnames: body.cnames || [],
    aValues: body.aValues || [],
  };
}

/** Verify a domain is properly configured and pointing to Vercel */
export async function verifyDomain(domain: string): Promise<DomainVerification> {
  if (!VERCEL_PROJECT_ID) throw new Error("Missing VERCEL_PROJECT_ID environment variable");

  // Check if domain is added to project
  const domainRes = await fetch(
    `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}${teamQuery()}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  if (!domainRes.ok) {
    return { verified: false, configured: false, error: "Domain not found on project" };
  }

  const domainData = await domainRes.json();

  // Check DNS configuration
  const config = await getDomainConfig(domain);

  return {
    verified: domainData.verified ?? false,
    configured: config.configured,
    error: config.misconfigured
      ? "DNS is misconfigured. Please check your DNS records."
      : undefined,
  };
}

/** Validate domain format */
export function isValidDomain(domain: string): boolean {
  // Basic domain validation: allows apex and subdomains, no protocol, no path
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
  return domainRegex.test(domain);
}

/** Sanitize domain input */
export function sanitizeDomain(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .replace(/^www\./, "");
}

/** Domains that cannot be used as custom domains */
const BLOCKED_DOMAINS = [
  "handledsites.com",
  "www.handledsites.com",
  "vercel.app",
  "localhost",
];

export function isBlockedDomain(domain: string): boolean {
  return BLOCKED_DOMAINS.some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`));
}
