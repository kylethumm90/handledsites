import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabaseAdmin, Business } from "@/lib/supabase";
import { TRADES } from "@/lib/constants";
import AdminShell from "@/components/AdminShell";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: { q?: string; trade?: string; page?: string };
};

const PAGE_SIZE = 20;

async function getBusinesses(searchParams: Props["searchParams"]) {
  const supabase = getSupabaseAdmin();
  const page = parseInt(searchParams.page || "1", 10);
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("businesses")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (searchParams.q) {
    query = query.ilike("name", `%${searchParams.q}%`);
  }
  if (searchParams.trade) {
    query = query.eq("trade", searchParams.trade);
  }

  const { data, count } = await query;
  const businesses = (data || []) as Business[];

  // Get site counts for each business
  const siteCountMap: Record<string, number> = {};
  if (businesses.length > 0) {
    const bizIds = businesses.map((b) => b.id);
    const { data: sites } = await supabase
      .from("sites")
      .select("business_id")
      .in("business_id", bizIds);

    if (sites) {
      for (const site of sites) {
        siteCountMap[site.business_id] = (siteCountMap[site.business_id] || 0) + 1;
      }
    }
  }

  return {
    businesses,
    siteCountMap,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / PAGE_SIZE),
  };
}

export default async function AdminBusinessesPage({ searchParams }: Props) {
  if (!isAdminAuthenticated()) redirect("/admin/login");

  const { businesses, siteCountMap, total, page, totalPages } =
    await getBusinesses(searchParams);

  return (
    <AdminShell active="businesses">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          All businesses{" "}
          <span className="text-sm font-normal text-gray-400">({total})</span>
        </h1>
      </div>

      {/* Filters */}
      <form className="mb-6 flex gap-3" method="GET" action="/admin/businesses">
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
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Trade</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Sites</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {businesses.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-gray-400"
                >
                  No businesses found
                </td>
              </tr>
            ) : (
              businesses.map((biz) => (
                <tr
                  key={biz.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/businesses/${biz.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {biz.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{biz.owner_name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {biz.email || (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{biz.trade}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {biz.city}, {biz.state}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {siteCountMap[biz.id] || 0}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(biz.created_at).toLocaleDateString()}
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
                href={`/admin/businesses?page=${page - 1}${searchParams.q ? `&q=${searchParams.q}` : ""}${searchParams.trade ? `&trade=${searchParams.trade}` : ""}`}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/businesses?page=${page + 1}${searchParams.q ? `&q=${searchParams.q}` : ""}${searchParams.trade ? `&trade=${searchParams.trade}` : ""}`}
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
