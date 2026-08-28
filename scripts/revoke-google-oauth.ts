/**
 * One-time script: revoke the stored Google OAuth grant.
 *
 * Usage:
 *   npx tsx scripts/revoke-google-oauth.ts          # report only
 *   npx tsx scripts/revoke-google-oauth.ts --revoke # actually revoke
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
 * environment (loaded automatically from .env.local via tsx).
 *
 * Why this exists
 * ---------------
 * `user_google_auth` stores an access_token and refresh_token in plaintext for
 * an abandoned Google Business Profile integration. The grant carries scope
 * `https://www.googleapis.com/auth/business.manage` -- full read/write on the
 * Google Business Profile, including posting and replying to reviews. The
 * access token has expired, but refresh tokens do not expire on their own and
 * can keep minting new access tokens until the grant is revoked.
 *
 * The usual way to revoke is to sign into the Google account and remove the
 * app at https://myaccount.google.com/permissions. That is not available here:
 * the account (kthumm@rooftoppowerco.com) is no longer accessible.
 *
 * Google's revocation endpoint accepts the token itself as the credential --
 * possession is sufficient, no session or password required. Since the token
 * is in our database, we can revoke the grant without the account. Revoking a
 * refresh token also revokes every access token derived from it.
 *
 * Reference: https://developers.google.com/identity/protocols/oauth2/web-server#tokenrevoke
 *
 * The token is never printed. After a successful revoke, run
 * supabase/migrations/20260828_drop_google_oauth_tables.sql to remove the
 * tables.
 */

import { createClient } from "@supabase/supabase-js";

const REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";

async function revoke(token: string): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch(REVOKE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }).toString(),
  });
  return { ok: res.ok, status: res.status, body: (await res.text()).slice(0, 300) };
}

async function main() {
  const apply = process.argv.includes("--revoke");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const { data: rows, error } = await supabase
    .from("user_google_auth")
    .select("id, google_email, scope, expires_at, connected_at, access_token, refresh_token");

  if (error) {
    console.error("Failed to read user_google_auth:", error.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log("No rows in user_google_auth -- nothing to revoke.");
    return;
  }

  console.log(`Found ${rows.length} stored Google grant(s).\n`);

  for (const row of rows) {
    console.log(`  id............ ${row.id}`);
    console.log(`  google_email.. ${row.google_email}`);
    console.log(`  scope......... ${row.scope}`);
    console.log(`  connected_at.. ${row.connected_at}`);
    console.log(`  access token.. ${row.access_token ? "present" : "absent"} (expires ${row.expires_at})`);
    console.log(`  refresh token. ${row.refresh_token ? "present" : "absent"}`);

    if (!apply) {
      console.log("\n  Dry run. Re-run with --revoke to revoke this grant.\n");
      continue;
    }

    // Revoking the refresh token revokes the whole grant, including any
    // access tokens derived from it.
    const target = row.refresh_token || row.access_token;
    if (!target) {
      console.log("  No token stored -- nothing to revoke.\n");
      continue;
    }

    const result = await revoke(target);

    if (result.ok) {
      console.log("\n  REVOKED. The grant no longer works.\n");
    } else if (result.status === 400) {
      // Google returns 400 invalid_token for a token that is already dead --
      // revoked previously, or expired through inactivity. Same end state.
      console.log(`\n  Google returned 400 (${result.body})`);
      console.log("  The token was already invalid. Nothing more to revoke.\n");
    } else {
      console.log(`\n  Unexpected response ${result.status}: ${result.body}`);
      console.log("  The grant may still be live. Do not drop the table yet.\n");
      process.exitCode = 1;
    }
  }

  if (apply && !process.exitCode) {
    console.log("Next: run supabase/migrations/20260828_drop_google_oauth_tables.sql");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
