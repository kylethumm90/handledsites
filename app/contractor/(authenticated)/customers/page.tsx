import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Lead } from "@/lib/supabase";
import PipelineV2 from "@/components/PipelineV2";
import DemoBanner from "@/components/DemoBanner";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const auth = await validateSessionFromCookie();
  if (!auth) redirect("/contractor/login");

  const { businessId } = auth;
  const supabase = getSupabaseAdmin();

  // Parallel fetch: business name + ava_enabled flag, the full lead list,
  // and the demo-lead count for the "you're looking at seed data" banner.
  const [{ data: business }, { data: leads }, { count: demoLeadCount }] =
    await Promise.all([
      supabase
        .from("businesses")
        .select("name, ava_enabled")
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

  if (!business) redirect("/contractor/login");

  const hasDemoLeads = (demoLeadCount ?? 0) > 0;

  return (
    <>
      <PipelineV2
        leads={(leads || []) as Lead[]}
        businessName={business.name || "Your Business"}
        avaEnabled={business.ava_enabled ?? false}
      />
      {hasDemoLeads && <DemoBanner />}
    </>
  );
}
