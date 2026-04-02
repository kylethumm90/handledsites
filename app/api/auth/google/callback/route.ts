import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const TOOL_PAGE = "/tools/review-link-generator";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");
  const storedState = request.cookies.get("google_oauth_state")?.value;

  // Handle Google errors (user denied, etc.)
  if (errorParam) {
    return NextResponse.redirect(
      `${BASE_URL}${TOOL_PAGE}?error=access_denied`
    );
  }

  // Validate state to prevent CSRF
  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(
      `${BASE_URL}${TOOL_PAGE}?error=invalid_state`
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(
      `${BASE_URL}${TOOL_PAGE}?error=server_error`
    );
  }

  try {
    // 1. Exchange auth code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("Token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(
        `${BASE_URL}${TOOL_PAGE}?error=token_exchange`
      );
    }

    const tokens = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokens;

    if (!access_token || !refresh_token) {
      return NextResponse.redirect(
        `${BASE_URL}${TOOL_PAGE}?error=missing_tokens`
      );
    }

    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // 2. Get Google user profile
    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!profileRes.ok) {
      console.error("Profile fetch failed:", await profileRes.text());
      return NextResponse.redirect(
        `${BASE_URL}${TOOL_PAGE}?error=profile_fetch`
      );
    }

    const profile = await profileRes.json();
    const googleEmail = profile.email as string;
    const googleName = profile.name as string | undefined;

    // 3. Upsert user record
    const supabase = getSupabaseAdmin();

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", googleEmail.toLowerCase())
      .single();

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          email: googleEmail.toLowerCase(),
          name: googleName || null,
        })
        .select("id")
        .single();

      if (insertError || !newUser) {
        console.error("User insert error:", insertError);
        return NextResponse.redirect(
          `${BASE_URL}${TOOL_PAGE}?error=server_error`
        );
      }
      userId = newUser.id;
    }

    // 4. Upsert Google auth tokens
    const { error: authError } = await supabase
      .from("user_google_auth")
      .upsert(
        {
          user_id: userId,
          access_token,
          refresh_token,
          expires_at: expiresAt,
          scope: tokens.scope || null,
          google_email: googleEmail,
          connected_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (authError) {
      console.error("Auth token upsert error:", authError);
      return NextResponse.redirect(
        `${BASE_URL}${TOOL_PAGE}?error=server_error`
      );
    }

    // 5. Fetch GBP accounts and locations (with retry for rate limits)
    async function fetchWithRetry(url: string, opts: RequestInit, retries = 3): Promise<Response> {
      for (let i = 0; i < retries; i++) {
        const res = await fetch(url, opts);
        if (res.status === 429 && i < retries - 1) {
          await new Promise((r) => setTimeout(r, (i + 1) * 2000));
          continue;
        }
        return res;
      }
      return fetch(url, opts);
    }

    const accountsRes = await fetchWithRetry(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!accountsRes.ok) {
      const errBody = await accountsRes.text();
      console.error("GBP accounts fetch failed. Status:", accountsRes.status, "Body:", errBody);
      return NextResponse.redirect(
        `${BASE_URL}${TOOL_PAGE}?error=no_gbp_access&debug=${encodeURIComponent(accountsRes.status + ": " + errBody.slice(0, 500))}`
      );
    }

    const accountsData = await accountsRes.json();
    const accounts = accountsData.accounts;

    if (!accounts || accounts.length === 0) {
      return NextResponse.redirect(
        `${BASE_URL}${TOOL_PAGE}?error=no_gbp_accounts`
      );
    }

    // Try each account until we find one with locations
    let locationFound = false;
    let reviewLink = "";
    let businessName = "";

    for (const account of accounts) {
      const accountName = account.name; // e.g. "accounts/123456"
      const locationsRes = await fetchWithRetry(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,metadata`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      if (!locationsRes.ok) continue;

      const locationsData = await locationsRes.json();
      const locations = locationsData.locations;

      if (!locations || locations.length === 0) continue;

      // Use the first location
      const location = locations[0];
      const locationId = location.name; // e.g. "accounts/123/locations/456"
      const locationTitle = location.title || "";
      const placeId = location.metadata?.placeId;

      if (!placeId) continue;

      reviewLink = `https://search.google.com/local/writereview?placeid=${placeId}`;
      businessName = locationTitle;

      // 6. Store GBP location
      await supabase.from("user_gbp_locations").upsert(
        {
          user_id: userId,
          location_id: locationId,
          location_name: locationTitle,
          place_id: placeId,
          review_link: reviewLink,
          is_primary: true,
        },
        { onConflict: "user_id,location_id" }
      );

      // 7. Mark user as GBP connected
      await supabase
        .from("users")
        .update({ gbp_connected: true })
        .eq("id", userId);

      locationFound = true;
      break;
    }

    if (!locationFound) {
      return NextResponse.redirect(
        `${BASE_URL}${TOOL_PAGE}?error=no_locations`
      );
    }

    // 8. Redirect back to tool page with result
    const resultParams = new URLSearchParams({
      link: reviewLink,
      business: businessName,
    });

    const response = NextResponse.redirect(
      `${BASE_URL}${TOOL_PAGE}?${resultParams.toString()}`
    );

    // Clear OAuth state cookie
    response.cookies.set("google_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      `${BASE_URL}${TOOL_PAGE}?error=server_error`
    );
  }
}
