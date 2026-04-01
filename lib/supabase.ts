import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Client-side Supabase client (for inserts only)
export function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(url, key);
}

// Server-side Supabase client (bypasses RLS for reads)
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase server environment variables");
  }
  return createClient(url, key);
}

export type ContractorSite = {
  id: string;
  business_name: string;
  owner_name: string;
  phone: string;
  email: string | null;
  city: string;
  state: string;
  trade: string;
  services: string[];
  slug: string;
  badge_licensed: boolean;
  badge_free_estimates: boolean;
  badge_emergency: boolean;
  badge_family_owned: boolean;
  logo_url: string | null;
  cover_image_url: string | null;
  qr_redirect_url: string | null;
  banner_message: string;
  hours_start: number;
  hours_end: number;
  review_count: number | null;
  avg_rating: number | null;
  created_at: string;
};
