import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "./supabase";

const COOKIE_NAME = "contractor_session";
const MAGIC_LINK_EXPIRY_MINUTES = 15;
const SESSION_EXPIRY_HOURS = 24;

export type AuthContext = {
  userId: string;
  businessId: string;
  siteId: string;
};

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createMagicLinkToken(
  userId: string,
  email: string
): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000
  ).toISOString();

  const supabase = getSupabaseAdmin();

  // Look up a site_id for backward compat (tokens table still has site_id column)
  const { data: role } = await supabase
    .from("user_business_roles")
    .select("business_id")
    .eq("user_id", userId)
    .limit(1)
    .single();

  let siteId: string | null = null;
  if (role) {
    const { data: site } = await supabase
      .from("sites")
      .select("id")
      .eq("business_id", role.business_id)
      .limit(1)
      .single();
    siteId = site?.id || null;
  }

  const { error } = await supabase.from("contractor_auth_tokens").insert({
    site_id: siteId,
    user_id: userId,
    token_hash: tokenHash,
    email,
    expires_at: expiresAt,
  });

  if (error) throw new Error("Failed to create magic link token");
  return token;
}

export async function verifyMagicLinkToken(
  token: string
): Promise<AuthContext | null> {
  const tokenHash = hashToken(token);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("contractor_auth_tokens")
    .select("id, site_id, user_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .single();

  if (error || !data) return null;
  if (data.used_at) return null;
  if (new Date(data.expires_at) < new Date()) return null;

  // Mark as used
  await supabase
    .from("contractor_auth_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", data.id);

  // New path: user_id is set
  if (data.user_id) {
    return resolveAuthContext(data.user_id, data.site_id);
  }

  // Legacy fallback: only site_id is set (pre-migration token)
  if (data.site_id) {
    return resolveAuthContextFromSiteId(data.site_id);
  }

  return null;
}

/** Resolve full AuthContext from a user_id (and optional site_id hint) */
async function resolveAuthContext(
  userId: string,
  siteIdHint?: string | null
): Promise<AuthContext | null> {
  const supabase = getSupabaseAdmin();

  // Get the user's first business
  const { data: role } = await supabase
    .from("user_business_roles")
    .select("business_id")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (!role) return null;

  // Use the hint site_id if it belongs to this business, otherwise pick one
  let siteId = siteIdHint;
  if (siteId) {
    const { data: check } = await supabase
      .from("sites")
      .select("id")
      .eq("id", siteId)
      .eq("business_id", role.business_id)
      .single();
    if (!check) siteId = null;
  }

  if (!siteId) {
    const { data: site } = await supabase
      .from("sites")
      .select("id")
      .eq("business_id", role.business_id)
      .eq("is_active", true)
      .limit(1)
      .single();
    siteId = site?.id || null;
  }

  if (!siteId) return null;

  return { userId, businessId: role.business_id, siteId };
}

/** Legacy fallback: resolve AuthContext from just a site_id */
async function resolveAuthContextFromSiteId(
  siteId: string
): Promise<AuthContext | null> {
  const supabase = getSupabaseAdmin();

  const { data: site } = await supabase
    .from("sites")
    .select("business_id")
    .eq("id", siteId)
    .single();

  if (!site) return null;

  const { data: biz } = await supabase
    .from("businesses")
    .select("email")
    .eq("id", site.business_id)
    .single();

  if (!biz?.email) return null;

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .ilike("email", biz.email)
    .single();

  if (!user) return null;

  return { userId: user.id, businessId: site.business_id, siteId };
}

export async function createSession(ctx: AuthContext): Promise<string> {
  const sessionToken = generateToken();
  const sessionHash = hashToken(sessionToken);
  const expiresAt = new Date(
    Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000
  ).toISOString();

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("contractor_sessions").insert({
    site_id: ctx.siteId,
    user_id: ctx.userId,
    business_id: ctx.businessId,
    session_hash: sessionHash,
    expires_at: expiresAt,
  });

  if (error) throw new Error("Failed to create session");
  return sessionToken;
}

export async function validateSessionFromCookie(): Promise<AuthContext | null> {
  const cookieStore = cookies();
  const session = cookieStore.get(COOKIE_NAME);
  if (!session) return null;
  return validateSessionToken(session.value);
}

export async function validateSessionFromRequest(
  request: NextRequest
): Promise<AuthContext | null> {
  const session = request.cookies.get(COOKIE_NAME);
  if (!session) return null;
  return validateSessionToken(session.value);
}

async function validateSessionToken(
  token: string
): Promise<AuthContext | null> {
  const sessionHash = hashToken(token);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("contractor_sessions")
    .select("site_id, user_id, business_id, expires_at")
    .eq("session_hash", sessionHash)
    .single();

  if (error || !data) return null;
  if (new Date(data.expires_at) < new Date()) return null;

  // New path: session has user_id and business_id
  if (data.user_id && data.business_id) {
    return {
      userId: data.user_id,
      businessId: data.business_id,
      siteId: data.site_id,
    };
  }

  // Legacy fallback: session only has site_id
  if (data.site_id) {
    return resolveAuthContextFromSiteId(data.site_id);
  }

  return null;
}

export async function clearSession(request: NextRequest): Promise<void> {
  const session = request.cookies.get(COOKIE_NAME);
  if (!session) return;

  const sessionHash = hashToken(session.value);
  const supabase = getSupabaseAdmin();
  await supabase
    .from("contractor_sessions")
    .delete()
    .eq("session_hash", sessionHash);
}

export async function hasRecentToken(email: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

  const { data } = await supabase
    .from("contractor_auth_tokens")
    .select("id")
    .eq("email", email)
    .is("used_at", null)
    .gte("created_at", oneMinuteAgo)
    .limit(1);

  return (data?.length ?? 0) > 0;
}

export const CONTRACTOR_COOKIE_NAME = COOKIE_NAME;
