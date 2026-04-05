import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import AdminShell from "@/components/AdminShell";
import PreviewGenerator from "./PreviewGenerator";

export const dynamic = "force-dynamic";

export default function AdminPreviewPage() {
  if (!isAdminAuthenticated()) redirect("/admin/login");

  return (
    <AdminShell active="dashboard">
      <PreviewGenerator />
    </AdminShell>
  );
}
