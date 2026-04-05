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
  business_id: string;
  type: "business_card" | "quiz_funnel";
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
  // Tracking & integrations (business-level)
  gtm_id: string | null;
  meta_pixel_id: string | null;
  zapier_webhook_url: string | null;
};

// New unified types

export type Business = {
  id: string;
  name: string;
  owner_name: string;
  phone: string;
  email: string | null;
  city: string;
  state: string;
  trade: string;
  services: string[];
  logo_url: string | null;
  gtm_id: string | null;
  meta_pixel_id: string | null;
  zapier_webhook_url: string | null;
  created_at: string;
};

export type Site = {
  id: string;
  business_id: string;
  type: "business_card" | "quiz_funnel";
  slug: string;
  is_active: boolean;
  created_at: string;
  // Business card fields
  cover_image_url: string | null;
  qr_redirect_url: string | null;
  banner_message: string | null;
  hours_start: number | null;
  hours_end: number | null;
  badge_licensed: boolean | null;
  badge_free_estimates: boolean | null;
  badge_emergency: boolean | null;
  badge_family_owned: boolean | null;
  review_count: number | null;
  avg_rating: number | null;
  // Quiz funnel fields
  headline: string | null;
  cta_text: string | null;
  accent_color: string | null;
};

export type SiteFull = Site & {
  business_name: string;
  owner_name: string;
  business_phone: string;
  business_email: string | null;
  city: string;
  state: string;
  trade: string;
  services: string[];
  logo_url: string | null;
};

export type Lead = {
  id: string;
  business_id: string;
  site_id: string | null;
  source: string;
  name: string;
  phone: string;
  email: string | null;
  answers: Record<string, string> | null;
  service_needed: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

export type ActivityLogEntry = {
  id: string;
  created_at: string;
  business_id: string;
  lead_id: string | null;
  type: string;
  summary: string;
  agent: string | null;
};
