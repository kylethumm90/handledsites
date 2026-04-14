import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import NetworkClient from "./NetworkClient";
import { MOCK_NETWORK } from "../mock-data";

// Network tab inside the Reputation section. Data is mock-only right now;
// swap the import of `MOCK_NETWORK` for a Supabase fetcher once the network
// tables exist. The returned shape must satisfy `NetworkData` in `../types.ts`.

export const dynamic = "force-dynamic";

export default async function ContractorReputationNetworkPage() {
  const auth = await validateSessionFromCookie();
  if (!auth) redirect("/contractor/login");

  return <NetworkClient data={MOCK_NETWORK} />;
}
