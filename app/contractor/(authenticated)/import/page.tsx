import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import ImportWizardClient from "@/components/ImportWizardClient";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const auth = await validateSessionFromCookie();
  if (!auth) redirect("/contractor/login");

  return <ImportWizardClient />;
}
