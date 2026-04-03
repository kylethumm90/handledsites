import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import AdminShell from "@/components/AdminShell";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

async function getStats() {
  const supabase = getSupabaseAdmin();

  const { data: all, count: totalCount } = await supabase
    .from("sites_full")
    .select("*", { count: "exact" });

  const sites = all || [];
  const total = totalCount || 0;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

  const today = sites.filter((s) => s.created_at >= todayStart).length;
  const thisWeek = sites.filter((s) => s.created_at >= weekStart).length;

  // Trade breakdown
  const byTrade: Record<string, number> = {};
  sites.forEach((s) => {
    byTrade[s.trade] = (byTrade[s.trade] || 0) + 1;
  });
  const tradeBreakdown = Object.entries(byTrade)
    .sort((a, b) => b[1] - a[1]);

  // State breakdown (top 10)
  const byState: Record<string, number> = {};
  sites.forEach((s) => {
    byState[s.state] = (byState[s.state] || 0) + 1;
  });
  const stateBreakdown = Object.entries(byState)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Recent signups
  const recent = [...sites]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return { total, today, thisWeek, tradeBreakdown, stateBreakdown, recent };
}

export default async function AdminDashboard() {
  if (!isAdminAuthenticated()) redirect("/admin/login");

  const stats = await getStats();

  return (
    <AdminShell active="dashboard">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Dashboard</h1>

      {/* Stats cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium text-gray-500">Total sites</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium text-gray-500">Created today</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{stats.today}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium text-gray-500">This week</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{stats.thisWeek}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* By trade */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">By trade</h2>
          {stats.tradeBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet</p>
          ) : (
            <div className="space-y-2">
              {stats.tradeBreakdown.map(([trade, count]) => (
                <div key={trade} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{trade}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 rounded-full bg-gray-900"
                      style={{
                        width: `${Math.max(16, (count / stats.total) * 160)}px`,
                      }}
                    />
                    <span className="text-xs font-medium text-gray-500 w-6 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By state */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Top states
          </h2>
          {stats.stateBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet</p>
          ) : (
            <div className="space-y-2">
              {stats.stateBreakdown.map(([state, count]) => (
                <div key={state} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{state}</span>
                  <span className="text-xs font-medium text-gray-500">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent signups */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Recent signups
        </h2>
        {stats.recent.length === 0 ? (
          <p className="text-sm text-gray-400">No sites yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Business</th>
                  <th className="pb-2 pr-4 font-medium">Owner</th>
                  <th className="pb-2 pr-4 font-medium">Trade</th>
                  <th className="pb-2 pr-4 font-medium">Location</th>
                  <th className="pb-2 pr-4 font-medium">Created</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((site) => (
                  <tr
                    key={site.id}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/admin/sites/${site.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {site.business_name}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600">
                      {site.owner_name}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600">{site.trade}</td>
                    <td className="py-2.5 pr-4 text-gray-600">
                      {site.city}, {site.state}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-400">
                      {new Date(site.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5">
                      <a
                        href={site.type === "quiz_funnel" ? `/q/${site.slug}` : `/${site.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
