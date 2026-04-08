import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import AdminShell from "@/components/AdminShell";
import EmailAdmin from "@/components/EmailAdmin";

export const dynamic = "force-dynamic";

export default async function AdminEmailsPage() {
  if (!isAdminAuthenticated()) redirect("/admin/login");

  const supabase = getSupabaseAdmin();

  const [{ data: templates }, { data: logs }] = await Promise.all([
    supabase
      .from("email_templates")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("email_logs")
      .select("*, email_templates(name)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <AdminShell active="emails">
      <EmailAdmin templates={templates || []} logs={logs || []} />
    </AdminShell>
  );
}
