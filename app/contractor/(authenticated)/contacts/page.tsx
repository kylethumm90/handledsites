import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Lead } from "@/lib/supabase";
import {
  PAGE_SIZE,
  TABS,
  applySearchFilter,
  applyTabFilter,
  isTabKey,
  pageRange,
  parsePage,
  sanitizeSearch,
  type TabKey,
} from "@/lib/contacts";
import ContactsClient from "@/components/contacts/ContactsClient";

export const dynamic = "force-dynamic";

type SearchParams = {
  tab?: string;
  q?: string;
  page?: string;
};

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const auth = await validateSessionFromCookie();
  if (!auth) redirect("/contractor/login");

  const { businessId } = auth;
  const supabase = getSupabaseAdmin();

  const tab: TabKey = isTabKey(searchParams.tab) ? searchParams.tab : "all";
  const search = sanitizeSearch(searchParams.q);
  const page = parsePage(searchParams.page);
  const [from, to] = pageRange(page);

  const scoped = () => supabase.from("leads").select("*").eq("business_id", businessId);
  const counted = () =>
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId);

  // The page of rows, plus its total under the current tab + search so the
  // pagination footer is accurate.
  const rowsQuery = applySearchFilter(applyTabFilter(scoped(), tab), search)
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalQuery = applySearchFilter(applyTabFilter(counted(), tab), search);

  // Tab counts ignore the search box (they describe the whole book, not the
  // current search) but each uses the same filter as its tab's rows.
  const tabCountQueries = TABS.map((t) => applyTabFilter(counted(), t.key));

  const monthAgo = new Date();
  monthAgo.setUTCMonth(monthAgo.getUTCMonth() - 1);
  const monthAgoIso = monthAgo.toISOString();

  const [
    { data: business },
    { data: rows, error: rowsError },
    { count: total },
    tabCounts,
    { count: totalContacts },
    { count: newThisMonth },
    { count: referralsActive },
    { count: unhappyCount },
    { count: reviewAskCount },
  ] = await Promise.all([
    supabase.from("businesses").select("name").eq("id", businessId).single(),
    rowsQuery,
    totalQuery,
    Promise.all(tabCountQueries).then((results) =>
      results.map((r) => r.count ?? 0),
    ),
    counted(),
    counted().gte("created_at", monthAgoIso),
    counted().not("referral_opted_in_at", "is", null),
    counted().lt("sentiment_score", 60),
    supabase
      .from("activity_log")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("type", "review_request_sent"),
  ]);

  if (!business) redirect("/contractor/login");
  if (rowsError) throw new Error(`Failed to load contacts: ${rowsError.message}`);

  const leads = (rows ?? []) as Lead[];
  const pageIds = leads.map((l) => l.id);

  // Recent Activity column + the "asked" status, both rolled up for this page
  // only so the query stays small regardless of book size.
  const latestActivityByLead: Record<string, { type: string; summary: string; at: string }> = {};
  let askedLeadIds: string[] = [];

  if (pageIds.length > 0) {
    const { data: activities } = await supabase
      .from("activity_log")
      .select("lead_id, type, summary, created_at")
      .eq("business_id", businessId)
      .in("lead_id", pageIds)
      .order("created_at", { ascending: false });

    const seen = new Set<string>();
    const asked = new Set<string>();
    for (const a of activities ?? []) {
      if (!a.lead_id) continue;
      // Rows arrive newest-first, so the first sighting of a lead is its latest.
      if (!seen.has(a.lead_id)) {
        seen.add(a.lead_id);
        latestActivityByLead[a.lead_id] = {
          type: a.type,
          summary: a.summary,
          at: a.created_at,
        };
      }
      if (a.type === "review_request_sent") asked.add(a.lead_id);
    }
    askedLeadIds = Array.from(asked);
  }

  const counts: Record<TabKey, number> = TABS.reduce(
    (acc, t, i) => ({ ...acc, [t.key]: tabCounts[i] }),
    {} as Record<TabKey, number>,
  );

  return (
    <ContactsClient
      leads={leads}
      latestActivityByLead={latestActivityByLead}
      askedLeadIds={askedLeadIds}
      tab={tab}
      search={searchParams.q ?? ""}
      page={page}
      pageSize={PAGE_SIZE}
      total={total ?? 0}
      tabCounts={counts}
      stats={{
        totalContacts: totalContacts ?? 0,
        newThisMonth: newThisMonth ?? 0,
        reviewRequests: reviewAskCount ?? 0,
        referralsActive: referralsActive ?? 0,
        unhappy: unhappyCount ?? 0,
      }}
    />
  );
}
