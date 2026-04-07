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
      {/* Stat columns */}
      <div
        className="animate-newsroom-in mb-10 grid grid-cols-3"
        style={{ animationDelay: "0.05s" }}
      >
        <div className="py-4 pr-6">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
            Total businesses
          </p>
          <p className="mt-1 font-display text-[64px] leading-none text-ink">
            {stats.total}
          </p>
        </div>
        <div className="border-l border-border-dark py-4 px-6">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
            Created today
          </p>
          <p className="mt-1 font-display text-[64px] leading-none text-ink">
            {stats.today}
          </p>
        </div>
        <div className="border-l border-border-dark py-4 pl-6">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
            This week
          </p>
          <p className="mt-1 font-display text-[64px] leading-none text-ink">
            {stats.thisWeek}
          </p>
        </div>
      </div>

      {/* By Trade & Geography */}
      <div className="mb-10 grid grid-cols-1 lg:grid-cols-2">
        {/* By Trade */}
        <div
          className="animate-newsroom-in pr-8 pb-8 lg:pb-0"
          style={{ animationDelay: "0.1s" }}
        >
          <h2 className="mb-5 font-display text-lg italic text-ink">By Trade</h2>
          {stats.tradeBreakdown.length === 0 ? (
            <p className="font-body text-sm text-muted">No data yet</p>
          ) : (
            <div className="space-y-2.5">
              {stats.tradeBreakdown.map(([trade, count], i) => (
                <div key={trade} className="flex items-center gap-3">
                  <span className="w-[140px] shrink-0 font-body text-[13px] font-medium text-ink">
                    {trade}
                  </span>
                  <div className="relative flex-1 h-3 bg-border-light">
                    <div
                      className="animate-bar-in absolute inset-y-0 left-0 bg-ink"
                      style={{
                        width: `${Math.max(3, (count / maxTradeCount) * 100)}%`,
                        animationDelay: `${0.15 + i * 0.05}s`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-[13px] text-muted">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Geography */}
        <div
          className="animate-newsroom-in border-t border-border-dark pt-8 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0"
          style={{ animationDelay: "0.15s" }}
        >
          <h2 className="mb-5 font-display text-lg italic text-ink">Geography</h2>
          {stats.stateBreakdown.length === 0 ? (
            <p className="font-body text-sm text-muted">No data yet</p>
          ) : (
            <>
              <div className="grid grid-cols-5 gap-px bg-border-light">
                {stats.stateBreakdown.map(([state, count]) => {
                  const opacity = Math.max(0.15, count / maxStateCount);
                  return (
                    <div
                      key={state}
                      className="flex aspect-square flex-col items-center justify-center bg-paper"
                      style={{ backgroundColor: `rgba(26, 26, 26, ${opacity * 0.12})` }}
                    >
                      <span className="font-mono text-sm font-semibold text-ink">
                        {state}
                      </span>
                      <span className="font-display text-[22px] leading-tight text-ink">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-6 border-t border-border-light pt-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                  {uniqueStates} states
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                  {uniqueTrades} trades
                </span>
                {topState && (
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                    Top: {topState[0]} ({topState[1]})
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent signups */}
      <div
        className="animate-newsroom-in"
        style={{ animationDelay: "0.2s" }}
      >
        <h2 className="mb-5 font-display text-lg italic text-ink">Recent Signups</h2>
        {stats.recent.length === 0 ? (
          <p className="font-body text-sm text-muted">No businesses yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-t-2 border-ink border-b border-b-border-dark">
                  <th className="py-2 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                    Business
                  </th>
                  <th className="py-2 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                    Owner
                  </th>
                  <th className="py-2 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                    Trade
                  </th>
                  <th className="py-2 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                    Location
                  </th>
                  <th className="py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((biz, i) => {
                  const isToday = biz.created_at >= stats.todayStart;
                  return (
                    <tr
                      key={biz.id}
                      className="animate-row-in border-b border-border-light last:border-0"
                      style={{ animationDelay: `${0.25 + i * 0.03}s` }}
                    >
                      <td className="py-2.5 pr-4">
                        <Link
                          href={`/admin/businesses/${biz.id}`}
                          className="font-body text-sm font-medium text-ink hover:underline"
                        >
                          {biz.name}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 font-body text-sm text-muted">
                        {biz.owner_name}
                      </td>
                      <td className="py-2.5 pr-4 font-body text-sm text-ink">
                        {biz.trade}
                      </td>
                      <td className="py-2.5 pr-4 font-body text-sm text-muted">
                        {biz.city}, {biz.state}
                      </td>
                      <td className="py-2.5 font-mono text-xs text-muted">
                        <span className="flex items-center gap-2">
                          {new Date(biz.created_at).toLocaleDateString()}
                          {isToday && (
                            <span className="inline-block bg-ink px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-paper">
                              today
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
      </div>
    </AdminShell>
  );
}
