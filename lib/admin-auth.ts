import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";

export function getAdminToken(): string {
  // Simple hash of the password to use as session token
  const password = process.env.ADMIN_PASSWORD || "";
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `admin_${Math.abs(hash).toString(36)}`;
}

export function isAdminAuthenticated(): boolean {
  const cookieStore = cookies();
  const session = cookieStore.get(COOKIE_NAME);
  if (!session) return false;
  return session.value === getAdminToken();
}
