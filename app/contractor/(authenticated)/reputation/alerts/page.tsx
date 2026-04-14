import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import AlertsClient from "./AlertsClient";
import { MOCK_ALERTS } from "../mock-data";

// Alerts tab inside the Reputation section. Data is mock-only right now;
// swap the import of `MOCK_ALERTS` for a Supabase fetcher once the alerts
// tables exist. The returned shape must satisfy `AlertsData` in `../types.ts`.

export const dynamic = "force-dynamic";

export default async function ContractorReputationAlertsPage() {
  const auth = await validateSessionFromCookie();
  if (!auth) redirect("/contractor/login");

  return <AlertsClient data={MOCK_ALERTS} />;
}
