import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin, Business } from "@/lib/supabase";
import ContractorSettingsEditor from "@/components/ContractorSettingsEditor";
import PlanSection from "@/components/PlanSection";

export const dynamic = "force-dynamic";

export default async function ContractorSettingsPage() {
  const siteId = await validateSessionFromCookie();
  if (!siteId) redirect("/contractor/login");

  const supabase = getSupabaseAdmin();

  const { data: site } = await supabase
    .from("sites")
    .select("business_id")
    .eq("id", siteId)
    .single();

  if (!site) redirect("/contractor/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", site.business_id)
    .single();

  if (!business) redirect("/contractor/login");

  // Fetch subscription
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status, stripe_customer_id")
    .eq("business_id", site.business_id)
    .single();

  const plan = sub?.plan || "free";
  const status = sub?.status || "active";
  const hasStripeCustomer = !!sub?.stripe_customer_id;

  return (
    <div className="space-y-6">
      <ContractorSettingsEditor business={business as Business} />
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1c1c1e", letterSpacing: "-0.02em", marginBottom: 12 }}>
          Plan &amp; Billing
        </h2>
        <PlanSection plan={plan} status={status} hasStripeCustomer={hasStripeCustomer} />
      </div>
    </div>
  );
}
