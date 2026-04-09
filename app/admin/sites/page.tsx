import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { TRADES } from "@/lib/constants";
import AdminShell from "@/components/AdminShell";
import AdminCreateSiteButton from "@/components/AdminCreateSiteButton";
import SitesGrouped, { type BusinessGroup } from "./SitesGrouped";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: { q?: string; trade?: string };
};

export default async function AdminSitesPage({ searchParams }: Props) {
  if (!isAdminAuthenticated()) redirect("/admin/login");

  const supabase = getSupabaseAdmin();

  // Fetch all sites with business info
  let query = supabase
    .from("sites_full")
    .select("id, business_id, business_name, owner_name, trade, city, state, type, slug, created_at")
    .order("business_name", { ascending: true });

  if (searchParams.q) {
    query = query.ilike("business_name", `%${searchParams.q}%`);
  }
  if (searchParams.trade) {
    query = query.eq("trade", searchParams.trade);
  }

  const { data: sites } = await query;

  // Group by business
  const bizMap = new Map<string, BusinessGroup>();
  let totalSites = 0;

  for (const site of sites || []) {
    totalSites++;
    const existing = bizMap.get(site.business_id);
    if (existing) {
      existing.sites.push({
        id: site.id,
        type: site.type,
        slug: site.slug,
        created_at: site.created_at,
      });
    } else {
      bizMap.set(site.business_id, {
        business_id: site.business_id,
        business_name: site.business_name,
        owner_name: site.owner_name,
        trade: site.trade,
        city: site.city,
        state: site.state,
        sites: [{
          id: site.id,
          type: site.type,
          slug: site.slug,
          created_at: site.created_at,
        }],
      });
    }
  }

  const businesses = Array.from(bizMap.values());

  return (
    <AdminShell active="sites">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          All sites{" "}
          <span className="text-sm font-normal text-gray-400">
            ({totalSites} sites across {businesses.length} businesses)
          </span>
        </h1>
        <AdminCreateSiteButton />
      </div>

      {/* Filters */}
      <form className="mb-6 flex gap-3" method="GET" action="/admin/sites">
        <input
          type="text"
          name="q"
          defaultValue={searchParams.q || ""}
          placeholder="Search business name..."
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
        />
        <select
          name="trade"
          defaultValue={searchParams.trade || ""}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
        >
          <option value="">All trades</option>
          {TRADES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Filter
        </button>
      </form>

      <SitesGrouped businesses={businesses} />
    </AdminShell>
  );
}
