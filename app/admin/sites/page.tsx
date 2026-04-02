import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabaseAdmin, ContractorSite } from "@/lib/supabase";
import { TRADES } from "@/lib/constants";
import AdminShell from "@/components/AdminShell";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import AdminCreateSiteButton from "@/components/AdminCreateSiteButton";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: { q?: string; trade?: string; page?: string };
};

const PAGE_SIZE = 20;

async function getSites(searchParams: Props["searchParams"]) {
  const supabase = getSupabaseAdmin();
  const page = parseInt(searchParams.page || "1", 10);
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("contractor_sites")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (searchParams.q) {
    query = query.ilike("business_name", `%${searchParams.q}%`);
  }
  if (searchParams.trade) {
    query = query.eq("trade", searchParams.trade);
  }

  const { data, count } = await query;
  return {
    sites: (data || []) as ContractorSite[],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / PAGE_SIZE),
  };
}

export default async function AdminSitesPage({ searchParams }: Props) {
  if (!isAdminAuthenticated()) redirect("/admin/login");

  const { sites, total, page, totalPages } = await getSites(searchParams);

  return (
    <AdminShell active="sites">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          All sites{" "}
          <span className="text-sm font-normal text-gray-400">({total})</span>
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
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Filter
        </button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Trade</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Card</th>
            </tr>
          </thead>
          <tbody>
            {sites.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-gray-400"
                >
                  No sites found
                </td>
              </tr>
            ) : (
              sites.map((site) => (
                <tr
                  key={site.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/sites/${site.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {site.business_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {site.owner_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{site.trade}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {site.city}, {site.state}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(site.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/${site.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/sites?page=${page - 1}${searchParams.q ? `&q=${searchParams.q}` : ""}${searchParams.trade ? `&trade=${searchParams.trade}` : ""}`}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/sites?page=${page + 1}${searchParams.q ? `&q=${searchParams.q}` : ""}${searchParams.trade ? `&trade=${searchParams.trade}` : ""}`}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
