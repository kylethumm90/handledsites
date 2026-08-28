import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const COOKIE_NAME = "admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Key used to sign admin session tokens.
 *
 * Prefer ADMIN_SESSION_SECRET (a long random value). We fall back to deriving
 * from ADMIN_PASSWORD so existing deployments keep working without a config
 * change, but that ties session validity to the password: rotating the
 * password invalidates every outstanding session. Set ADMIN_SESSION_SECRET in
 * production.
 */
function getSigningSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret) return secret;

  const password = process.env.ADMIN_PASSWORD;
  if (password) return `derived-from-password:${password}`;

  return null;
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Constant-time string comparison. Both sides are hashed first so the compared
 * buffers are always the same length and no length information leaks.
 */
function safeEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Mint a session token that carries its own expiry, signed so the expiry
 * can't be edited client-side. Cookie maxAge alone is not a security control.
 */
export function createAdminToken(now: number = Date.now()): string {
  const secret = getSigningSecret();
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET or ADMIN_PASSWORD must be set");
  }
  const expiresAt = String(now + SESSION_TTL_MS);
  return `${expiresAt}.${sign(expiresAt, secret)}`;
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;

  const secret = getSigningSecret();
  if (!secret) return false;

  const sep = token.indexOf(".");
  if (sep === -1) return false;

  const expiresAtRaw = token.slice(0, sep);
  const signature = token.slice(sep + 1);
  if (!expiresAtRaw || !signature) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  return safeEqual(signature, sign(expiresAtRaw, secret));
}

/** Constant-time check of a submitted admin password. */
export function verifyAdminPassword(submitted: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof submitted !== "string" || !submitted) return false;
  return safeEqual(submitted, expected);
}

/** Session check for server components. */
export function isAdminAuthenticated(): boolean {
  return verifyAdminToken(cookies().get(COOKIE_NAME)?.value);
}

/** Session check for route handlers. */
export function isAdminRequest(request: NextRequest): boolean {
  return verifyAdminToken(request.cookies.get(COOKIE_NAME)?.value);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
export const ADMIN_SESSION_TTL_MS = SESSION_TTL_MS;
