import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import ReputationDashboardClient from "./ReputationDashboardClient";
import { MOCK_REPUTATION } from "./mock-data";

// Reputation dashboard lives OUTSIDE the (authenticated) route group because
// that group's layout injects a light-mode top nav that clashes with the
// Command Console chrome. We duplicate the auth check here.
//
// Data is currently mock-only: swap the import of `MOCK_REPUTATION` for a
// Supabase fetcher once the reputation/sentiment tables exist. The returned
// shape must satisfy `ReputationDashboardData` in `./types.ts`.

export const dynamic = "force-dynamic";

export default async function ContractorReputationPage() {
  const auth = await validateSessionFromCookie();
  if (!auth) redirect("/contractor/login");

  const data = MOCK_REPUTATION;

  return <ReputationDashboardClient data={data} />;
}
