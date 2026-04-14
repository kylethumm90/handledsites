import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import FunnelClient from "./FunnelClient";
import { MOCK_FUNNEL } from "../mock-data";

// Funnel tab inside the Reputation section. Data is mock-only right now;
// swap the import of `MOCK_FUNNEL` for a Supabase fetcher once the funnel
// tables exist. The returned shape must satisfy `FunnelData` in `../types.ts`.

export const dynamic = "force-dynamic";

export default async function ContractorReputationFunnelPage() {
  const auth = await validateSessionFromCookie();
  if (!auth) redirect("/contractor/login");

  return <FunnelClient data={MOCK_FUNNEL} />;
}
