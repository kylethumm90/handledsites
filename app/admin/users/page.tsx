import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import AdminShell from "@/components/AdminShell";
import ImpersonateButton from "@/components/ImpersonateButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  if (!isAdminAuthenticated()) redirect("/admin/login");

  const supabase = getSupabaseAdmin();

  // Get all users with their business roles
  const { data: users } = await supabase
    .from("users")
    .select("id, email, name, created_at")
    .order("created_at", { ascending: false });

  if (!users || users.length === 0) {
    return (
      <AdminShell active="users">
        <h1 className="mb-6 text-xl font-semibold text-gray-900">Users</h1>
        <p className="text-sm text-gray-400">No users yet.</p>
      </AdminShell>
    );
  }

  // Get role links for all users
  const userIds = users.map((u) => u.id);
  const { data: roles } = await supabase
    .from("user_business_roles")
    .select("user_id, business_id, role")
    .in("user_id", userIds);

  const businessIds = Array.from(new Set((roles || []).map((r) => r.business_id)));
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, owner_name, trade")
    .in("id", businessIds);

  const bizMap: Record<string, { name: string; owner_name: string; trade: string }> = {};
  for (const b of businesses || []) {
    bizMap[b.id] = { name: b.name, owner_name: b.owner_name, trade: b.trade };
  }

  // Get a site_id per business for impersonation
  const { data: sites } = await supabase
    .from("sites")
    .select("id, business_id")
    .in("business_id", businessIds);

  const siteMap: Record<string, string> = {};
  for (const s of sites || []) {
    if (!siteMap[s.business_id]) siteMap[s.business_id] = s.id;
  }

  // Get active sessions
  const { data: sessions } = await supabase
    .from("contractor_sessions")
    .select("user_id")
    .gt("expires_at", new Date().toISOString());

  const activeUserIds = new Set((sessions || []).map((s) => s.user_id).filter(Boolean));

  // Build user rows with business info
  const rolesByUser: Record<string, { business_id: string; role: string }[]> = {};
  for (const r of roles || []) {
    if (!rolesByUser[r.user_id]) rolesByUser[r.user_id] = [];
    rolesByUser[r.user_id].push({ business_id: r.business_id, role: r.role });
  }

  const activeCount = users.filter((u) => activeUserIds.has(u.id)).length;

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
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Trade</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const userRoles = rolesByUser[user.id] || [];
              const firstRole = userRoles[0];
              const biz = firstRole ? bizMap[firstRole.business_id] : null;
              const siteId = firstRole ? siteMap[firstRole.business_id] : null;
              const isActive = activeUserIds.has(user.id);

              return (
                <tr
                  key={user.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{user.email}</td>
                  <td className="px-4 py-3 text-gray-600">{user.name || "—"}</td>
                  <td className="px-4 py-3">
                    {firstRole ? (
                      <Link
                        href={`/admin/businesses/${firstRole.business_id}`}
                        className="text-gray-600 hover:text-blue-600"
                      >
                        {biz?.name || "Unknown"}
                      </Link>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {firstRole ? (
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        firstRole.role === "owner" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {firstRole.role}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{biz?.trade || "—"}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Active
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">Offline</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {siteId && <ImpersonateButton siteId={siteId} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
