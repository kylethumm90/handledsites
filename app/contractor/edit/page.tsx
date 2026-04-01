import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin, ContractorSite } from "@/lib/supabase";
import ContractorSiteEditor from "@/components/ContractorSiteEditor";

export const dynamic = "force-dynamic";

export default async function ContractorEditPage() {
  const siteId = await validateSessionFromCookie();
  if (!siteId) redirect("/contractor/login");

  const { data, error } = await getSupabaseAdmin()
    .from("contractor_sites")
    .select("*")
    .eq("id", siteId)
    .single();

  if (error || !data) redirect("/contractor/login");

  const site = data as ContractorSite;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span className="text-sm font-bold text-gray-900">
            handled.sites
          </span>
          <form action="/api/contractor/logout" method="POST">
            <button
              type="submit"
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={(e) => {
                e.preventDefault();
                fetch("/api/contractor/logout", { method: "POST" }).then(() => {
                  window.location.href = "/contractor/login";
                });
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      </nav>
      <main className="mx-auto max-w-3xl px-6 py-8">
        <ContractorSiteEditor site={site} />
      </main>
    </div>
  );
}
