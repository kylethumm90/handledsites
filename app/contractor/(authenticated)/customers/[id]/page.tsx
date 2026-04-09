import { redirect, notFound } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Lead, ActivityLogEntry } from "@/lib/supabase";
import CustomerDetailClient from "@/components/CustomerDetailClient";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const auth = await validateSessionFromCookie();
  if (!auth) redirect("/contractor/login");

  const { businessId } = auth;
  const supabase = getSupabaseAdmin();

  // Fetch lead, verify ownership
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", params.id)
    .eq("business_id", businessId)
    .single();

  if (!lead) notFound();

  // Fetch activity log
  const { data: timeline } = await supabase
    .from("activity_log")
    .select("*")
    .eq("lead_id", params.id)
    .order("created_at", { ascending: false });

  return (
    <CustomerDetailClient
      lead={lead as Lead}
      timeline={(timeline || []) as ActivityLogEntry[]}
    />
  );
}
