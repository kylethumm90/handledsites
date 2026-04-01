import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "./supabase";

const COOKIE_NAME = "contractor_session";
const MAGIC_LINK_EXPIRY_MINUTES = 15;
const SESSION_EXPIRY_HOURS = 24;

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createMagicLinkToken(
  siteId: string,
  email: string
): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000
  ).toISOString();

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("contractor_auth_tokens").insert({
    site_id: siteId,
    token_hash: tokenHash,
    email,
    expires_at: expiresAt,
  });

  if (error) throw new Error("Failed to create magic link token");
  return token;
}

export async function verifyMagicLinkToken(
  token: string
): Promise<string | null> {
  const tokenHash = hashToken(token);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("contractor_auth_tokens")
    .select("id, site_id, expires_at, used_at")
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

  return data.site_id;
}

export async function createSession(siteId: string): Promise<string> {
  const sessionToken = generateToken();
  const sessionHash = hashToken(sessionToken);
  const expiresAt = new Date(
    Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000
  ).toISOString();

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("contractor_sessions").insert({
    site_id: siteId,
    session_hash: sessionHash,
    expires_at: expiresAt,
  });

  if (error) throw new Error("Failed to create session");
  return sessionToken;
}

export async function validateSessionFromCookie(): Promise<string | null> {
  const cookieStore = cookies();
  const session = cookieStore.get(COOKIE_NAME);
  if (!session) return null;
  return validateSessionToken(session.value);
}

export async function validateSessionFromRequest(
  request: NextRequest
): Promise<string | null> {
  const session = request.cookies.get(COOKIE_NAME);
  if (!session) return null;
  return validateSessionToken(session.value);
}

async function validateSessionToken(token: string): Promise<string | null> {
  const sessionHash = hashToken(token);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("contractor_sessions")
    .select("site_id, expires_at")
    .eq("session_hash", sessionHash)
    .single();

  if (error || !data) return null;
  if (new Date(data.expires_at) < new Date()) return null;

  return data.site_id;
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
