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
  type: "business_card" | "quiz_funnel" | "review_funnel" | "website" | "review_wall";
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
  // Social links
  social_facebook: string | null;
  social_instagram: string | null;
  social_google: string | null;
  social_nextdoor: string | null;
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
  google_review_url: string | null;
  about_bio: string | null;
  years_in_business: number | null;
  service_areas: string[] | null;
  license_number: string | null;
  hero_tagline: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_google: string | null;
  social_nextdoor: string | null;
  street_address: string | null;
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  google_reviews: { text: string; author: string; rating: number }[] | null;
  // Custom domain hosting
  custom_domain: string | null;
  domain_status: "none" | "pending" | "active" | "error";
  domain_error: string | null;
  // Referral program + brand
  brand_color: string | null;
  referral_enabled: boolean;
  referral_reward_amount_cents: number | null;
  referral_reward_type: "cash" | "credit" | "gift_card" | null;
  created_at: string;
};

export type Site = {
  id: string;
  business_id: string;
  type: "business_card" | "quiz_funnel" | "review_funnel" | "website" | "review_wall";
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
  status: "lead" | "booked" | "customer";
  tags: string[];
  notes: string | null;
  is_demo: boolean;
  referral_code: string | null;
  employee_id: string | null;
  appointment_at: string | null;
  created_at: string;
  raw_import_data: Record<string, string> | null;
  ai_summary: string | null;
  import_batch_id: string | null;
};

export type ContactImport = {
  id: string;
  business_id: string;
  filename: string;
  total_rows: number;
  imported_rows: number;
  status: "pending" | "processing" | "complete" | "failed";
  column_mappings: Record<string, string | null>;
  ai_context_fields: string[];
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

export type ReviewResponse = {
  id: string;
  created_at: string;
  business_id: string;
  site_id: string | null;
  rating: number;
  feedback: string | null;
  generated_review: string | null;
  is_positive: boolean;
  tech_name: string | null;
  professionalism: string | null;
  communication: string | null;
  rep_id: string | null;
};

export type Review = {
  id: string;
  created_at: string;
  business_id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  review_date: string;
  source: string;
  is_featured: boolean;
};

export type User = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  created_at: string;
};

export type UserBusinessRole = {
  id: string;
  user_id: string;
  business_id: string;
  role: "owner" | "member";
  created_at: string;
};

export type Employee = {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  bio: string | null;
  certifications: string[] | null;
  stats: string[] | null;
  hours_start: number;
  hours_end: number;
  calendar_url: string | null;
  is_active: boolean;
  created_at: string;
};
