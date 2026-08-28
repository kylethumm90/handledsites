"use client";

/**
 * Contacts screen shell.
 *
 * Desktop (>=1024px): table on the left, detail panel on the right.
 * Mobile: the existing ContactCard list from the pipeline screen, with
 * ContactDetailModal for detail — no horizontal scrolling and no second
 * mobile design to maintain.
 *
 * The contractor layout caps `main` at 680px, so the desktop view breaks out
 * with the same `calc(50% - 50vw)` full-bleed trick PipelineV2 uses, then
 * re-constrains to its own wider column.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Upload } from "lucide-react";
import type { Lead } from "@/lib/supabase";
import type { TabKey } from "@/lib/contacts";
import { nextActionFor, contactStatusFor } from "@/lib/contacts";
import { leadToContact } from "@/lib/pipeline-v2";
import { ContactCard } from "@/components/pipeline/contact-card";
import ContactDetailModal from "@/components/pipeline/contact-detail-modal";
import ContactStatCards, { type ContactStats } from "./ContactStatCards";
import ContactFilterTabs from "./ContactFilterTabs";
import ContactsTable from "./ContactsTable";
import ContactDetailPanel from "./ContactDetailPanel";
import type { RowActivity } from "./ContactRow";
import { buttonSecondary, hairline, hairlineStrong, ink, inkSoft } from "./styles";

const DESKTOP_MIN = 1024;

type Props = {
  leads: Lead[];
  latestActivityByLead: Record<string, RowActivity>;
  askedLeadIds: string[];
  tab: TabKey;
  search: string;
  page: number;
  pageSize: number;
  total: number;
  tabCounts: Record<TabKey, number>;
  stats: ContactStats;
};

export default function ContactsClient({
  leads,
  latestActivityByLead,
  askedLeadIds,
  tab,
  search,
  page,
  pageSize,
  total,
  tabCounts,
  stats,
}: Props) {
  const router = useRouter();

  const [isDesktop, setIsDesktop] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState(search);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const asked = useMemo(() => new Set(askedLeadIds), [askedLeadIds]);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Selection is local state, not a search param, so opening a contact never
  // costs a server round trip.
  const selected = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? null,
    [leads, selectedId],
  );

  // A new page of rows invalidates any selection from the previous page.
  useEffect(() => {
    setSelectedId(null);
    setCheckedIds(new Set());
  }, [page, tab, search]);

  useEffect(() => {
    setQuery(search);
  }, [search]);

  const submitSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams();
      if (tab !== "all") params.set("tab", tab);
      if (value.trim()) params.set("q", value.trim());
      const qs = params.toString();
      router.push(`/contractor/contacts${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, tab],
  );

  const sendReviewAsk = useCallback(
    async (lead: Lead) => {
      setBusyId(lead.id);
      try {
        const res = await fetch(
          `/api/contractor/customers/${lead.id}/review-request-sent`,
          { method: "POST" },
        );
        if (res.ok) {
          setSentIds((prev) => new Set(prev).add(lead.id));
          // Refresh so the status badge and Recent Activity pick up the new row.
          router.refresh();
        }
      } finally {
        setBusyId(null);
      }
    },
    [router],
  );

  const handleAction = useCallback(
    (lead: Lead) => {
      const status = contactStatusFor(lead, asked.has(lead.id));
      const action = nextActionFor(status);
      if (action.kind === "review_ask") {
        void sendReviewAsk(lead);
      } else {
        setSelectedId(lead.id);
      }
    },
    [asked, sendReviewAsk],
  );

  const toggleCheck = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setCheckedIds((prev) =>
      prev.size === leads.length ? new Set() : new Set(leads.map((l) => l.id)),
    );
  }, [leads]);

  const header = (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: ink,
              margin: 0,
            }}
          >
            Contacts
          </h1>
          <p style={{ ...{ fontSize: 13, color: inkSoft }, margin: "4px 0 0" }}>
            {stats.totalContacts.toLocaleString()} total
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch(query);
            }}
            style={{ position: "relative" }}
          >
            <Search
              size={14}
              aria-hidden
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: inkSoft,
              }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts…"
              aria-label="Search contacts"
              style={{
                fontSize: 13,
                padding: "7px 10px 7px 30px",
                borderRadius: 8,
                border: `1px solid ${hairlineStrong}`,
                background: "#fff",
                color: ink,
                width: 200,
                outline: "none",
              }}
            />
          </form>
          <Link
            href="/contractor/import"
            style={{
              ...buttonSecondary,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              textDecoration: "none",
              padding: "7px 12px",
            }}
          >
            <Upload size={13} /> Import
          </Link>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <ContactStatCards stats={stats} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <ContactFilterTabs active={tab} counts={tabCounts} search={search} />
      </div>
    </>
  );

  // ---- Mobile: reuse the pipeline card list + modal ----
  if (!isDesktop) {
    return (
      <div>
        {header}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {leads.length === 0 ? (
            <p style={{ fontSize: 13, color: inkSoft }}>No contacts match this filter.</p>
          ) : (
            leads.map((lead) => {
              const contact = leadToContact(lead, {
                view: lead.status === "customer" ? "post_sale" : "pipeline",
                aiTeamLive: false,
              });
              if (!contact) return null;
              return (
                <div key={lead.id} onClick={() => setSelectedId(lead.id)}>
                  <ContactCard contact={contact} tier="base" />
                </div>
              );
            })
          )}
        </div>

        {selected ? (
          <ContactDetailModal
            lead={selected}
            onClose={() => setSelectedId(null)}
            onUpdate={() => router.refresh()}
          />
        ) : null}
      </div>
    );
  }

  // ---- Desktop: full-bleed table + side panel ----
  return (
    <div
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        padding: "0 24px",
      }}
    >
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        {header}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: selected ? "minmax(0, 1fr) 340px" : "minmax(0, 1fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          <ContactsTable
            leads={leads}
            activityByLead={latestActivityByLead}
            askedLeadIds={asked}
            selectedId={selectedId}
            checkedIds={checkedIds}
            busyId={busyId}
            onSelect={(lead) => setSelectedId(lead.id)}
            onToggleCheck={toggleCheck}
            onToggleAll={toggleAll}
            onAction={handleAction}
            page={page}
            pageSize={pageSize}
            total={total}
            tab={tab}
            search={search}
          />

          {selected ? (
            <ContactDetailPanel
              lead={selected}
              hasReviewAsk={asked.has(selected.id)}
              onClose={() => setSelectedId(null)}
              onSendReviewAsk={() => void sendReviewAsk(selected)}
              sending={busyId === selected.id}
              sent={sentIds.has(selected.id)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const CONTACTS_HAIRLINE = hairline;
