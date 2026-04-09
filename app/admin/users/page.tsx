import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import AdminShell from "@/components/AdminShell";
import ImpersonateButton from "@/components/ImpersonateButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

type User = {
  email: string;
  site_id: string;
  business_id: string;
  business_name: string;
  owner_name: string;
  trade: string;
  login_count: number;
  last_login: string;
  has_active_session: boolean;
};

export default async function AdminUsersPage() {
  if (!isAdminAuthenticated()) redirect("/admin/login");

  const supabase = getSupabaseAdmin();

  // Get all users who have requested a magic link (auth tokens)
  const { data: tokens } = await supabase
    .from("contractor_auth_tokens")
    .select("email, site_id, created_at")
    .order("created_at", { ascending: false });

  if (!tokens || tokens.length === 0) {
    return (
      <AdminShell active="users">
        <h1 className="mb-6 text-xl font-semibold text-gray-900">Users</h1>
        <p className="text-sm text-gray-400">No users have logged in yet.</p>
      </AdminShell>
    );
  }

  // Aggregate per email+site_id
  const userMap = new Map<string, { email: string; site_id: string; login_count: number; last_login: string }>();
  for (const t of tokens) {
    const key = `${t.email}:${t.site_id}`;
    const existing = userMap.get(key);
    if (!existing) {
      userMap.set(key, { email: t.email, site_id: t.site_id, login_count: 1, last_login: t.created_at });
    } else {
      existing.login_count++;
      if (t.created_at > existing.last_login) existing.last_login = t.created_at;
    }
  }

  // Get site + business info for each unique site_id
  const siteIds = Array.from(new Set(Array.from(userMap.values()).map((u) => u.site_id)));
  const { data: sites } = await supabase
    .from("sites")
    .select("id, business_id")
    .in("id", siteIds);

  const siteBusinessMap: Record<string, string> = {};
  const businessIds = new Set<string>();
  for (const s of sites || []) {
    siteBusinessMap[s.id] = s.business_id;
    businessIds.add(s.business_id);
  }

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, owner_name, trade")
    .in("id", Array.from(businessIds));

  const bizMap: Record<string, { name: string; owner_name: string; trade: string }> = {};
  for (const b of businesses || []) {
    bizMap[b.id] = { name: b.name, owner_name: b.owner_name, trade: b.trade };
  }

  // Get active sessions
  const { data: sessions } = await supabase
    .from("contractor_sessions")
    .select("site_id")
    .gt("expires_at", new Date().toISOString());

  const activeSiteIds = new Set((sessions || []).map((s) => s.site_id));

  // Build user list
  const users: User[] = Array.from(userMap.values())
    .map((u) => {
      const bizId = siteBusinessMap[u.site_id] || "";
      const biz = bizMap[bizId] || { name: "Unknown", owner_name: "", trade: "" };
      return {
        email: u.email,
        site_id: u.site_id,
        business_id: bizId,
        business_name: biz.name,
        owner_name: biz.owner_name,
        trade: biz.trade,
        login_count: u.login_count,
        last_login: u.last_login,
        has_active_session: activeSiteIds.has(u.site_id),
      };
    })
    .sort((a, b) => new Date(b.last_login).getTime() - new Date(a.last_login).getTime());

  const activeCount = users.filter((u) => u.has_active_session).length;

  return (
    <AdminShell active="users">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          Users{" "}
          <span className="text-sm font-normal text-gray-400">({users.length})</span>
        </h1>
        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
          {activeCount} active now
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Trade</th>
              <th className="px-4 py-3 font-medium">Logins</th>
              <th className="px-4 py-3 font-medium">Last Login</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={`${user.email}:${user.site_id}`}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
              >
                <td className="px-4 py-3 font-medium text-gray-900">{user.email}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/businesses/${user.business_id}`}
                    className="text-gray-600 hover:text-blue-600"
                  >
                    {user.business_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{user.owner_name}</td>
                <td className="px-4 py-3 text-gray-600">{user.trade}</td>
                <td className="px-4 py-3 text-gray-600">{user.login_count}</td>
                <td className="px-4 py-3 text-gray-400">
                  {new Date(user.last_login).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  {new Date(user.last_login).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3">
                  {user.has_active_session ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Active
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">Offline</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <ImpersonateButton siteId={user.site_id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
