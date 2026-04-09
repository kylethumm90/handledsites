import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import AdminShell from "@/components/AdminShell";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getStats() {
  const supabase = getSupabaseAdmin();

  const { data: all, count: totalCount } = await supabase
    .from("businesses")
    .select("*", { count: "exact" });

  const businesses = all || [];
  const total = totalCount || 0;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

  const today = businesses.filter((b) => b.created_at >= todayStart).length;
  const thisWeek = businesses.filter((b) => b.created_at >= weekStart).length;

  // Trade breakdown
  const byTrade: Record<string, number> = {};
  businesses.forEach((b) => {
    byTrade[b.trade] = (byTrade[b.trade] || 0) + 1;
  });
  const tradeBreakdown = Object.entries(byTrade)
    .sort((a, b) => b[1] - a[1]);

  // State breakdown (all states)
  const byState: Record<string, number> = {};
  businesses.forEach((b) => {
    byState[b.state] = (byState[b.state] || 0) + 1;
  });
  const stateBreakdown = Object.entries(byState)
    .sort((a, b) => b[1] - a[1]);

  // Recent signups
  const recent = [...businesses]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return { total, today, thisWeek, tradeBreakdown, stateBreakdown, recent, todayStart };
}

export default async function AdminDashboard() {
  if (!isAdminAuthenticated()) redirect("/admin/login");

  const stats = await getStats();
  const maxTradeCount = stats.tradeBreakdown.length > 0 ? stats.tradeBreakdown[0][1] : 1;
  const maxStateCount = stats.stateBreakdown.length > 0 ? stats.stateBreakdown[0][1] : 1;
  const topState = stats.stateBreakdown.length > 0 ? stats.stateBreakdown[0] : null;
  const uniqueStates = stats.stateBreakdown.length;
  const uniqueTrades = stats.tradeBreakdown.length;

  return (
    <AdminShell active="dashboard">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        {[
          { label: "Total businesses", value: stats.total },
          { label: "Created today", value: stats.today },
          { label: "This week", value: stats.thisWeek },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white px-5 py-5">
            <p className="text-xs font-medium text-gray-500">{s.label}</p>
            <p className="mt-1 text-4xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* By Trade & Geography */}
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* By Trade */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">By Trade</h2>
          {stats.tradeBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet</p>
          ) : (
            <div className="space-y-2.5">
              {stats.tradeBreakdown.map(([trade, count]) => (
                <div key={trade} className="flex items-center gap-3">
                  <span className="w-[130px] shrink-0 text-sm font-medium text-gray-900">
                    {trade}
                  </span>
                  <div className="relative flex-1 h-2.5 rounded-full bg-gray-100">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gray-900 transition-all duration-500"
                      style={{ width: `${Math.max(3, (count / maxTradeCount) * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm text-gray-400">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Geography */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Geography</h2>
          {stats.stateBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet</p>
          ) : (
            <>
              <div className="grid grid-cols-5 gap-1.5">
                {stats.stateBreakdown.map(([state, count]) => {
                  const opacity = Math.max(0.08, count / maxStateCount);
                  return (
                    <div
                      key={state}
                      className="flex aspect-square flex-col items-center justify-center rounded-lg"
                      style={{ backgroundColor: `rgba(17, 24, 39, ${opacity * 0.12})` }}
                    >
                      <span className="text-xs font-semibold text-gray-700">{state}</span>
                      <span className="text-lg font-bold text-gray-900">{count}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-4 border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-400">{uniqueStates} states</span>
                <span className="text-xs text-gray-400">{uniqueTrades} trades</span>
                {topState && (
                  <span className="text-xs text-gray-400">Top: {topState[0]} ({topState[1]})</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent signups */}
      <h2 className="mb-3 text-sm font-semibold text-gray-900">Recent Signups</h2>
      {stats.recent.length === 0 ? (
        <p className="text-sm text-gray-400">No businesses yet</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Trade</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((biz) => {
                const isToday = biz.created_at >= stats.todayStart;
                return (
                  <tr key={biz.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/businesses/${biz.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {biz.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{biz.owner_name}</td>
                    <td className="px-4 py-3 text-gray-600">{biz.trade}</td>
                    <td className="px-4 py-3 text-gray-600">{biz.city}, {biz.state}</td>
                    <td className="px-4 py-3 text-gray-400">
                      <span className="flex items-center gap-2">
                        {new Date(biz.created_at).toLocaleDateString()}
                        {isToday && (
                          <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                            Today
                          </span>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
