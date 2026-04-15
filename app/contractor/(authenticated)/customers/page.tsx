import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Lead } from "@/lib/supabase";
import PipelineClient from "@/components/PipelineClient";
import DemoBanner from "@/components/DemoBanner";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const auth = await validateSessionFromCookie();
  if (!auth) redirect("/contractor/login");

  const { businessId, siteId } = auth;
  const supabase = getSupabaseAdmin();

  // Fetch trade (for the add-contact service dropdown), the business's
  // per-account ava_enabled flag, and the lead list in parallel. The
  // Ava plan feature gate is checked client-side via useCurrentPlan —
  // both flags must be true for the Pipeline UI to flip into live mode.
  const [{ data: site }, { data: business }, { data: leads }, { count: demoLeadCount }] =
    await Promise.all([
      supabase
        .from("sites_full")
        .select("trade")
        .eq("id", siteId)
        .single(),
      supabase
        .from("businesses")
        .select("ava_enabled")
        .eq("id", businessId)
        .single(),
      supabase
        .from("leads")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false }),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("is_demo", true),
    ]);

  if (!site) redirect("/contractor/login");

  const hasDemoLeads = (demoLeadCount ?? 0) > 0;

  return (
    <>
      <PipelineClient
        leads={(leads || []) as Lead[]}
        trade={site.trade}
        avaEnabled={business?.ava_enabled ?? false}
      />
      {hasDemoLeads && <DemoBanner />}
    </>
  );
}
