"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

// Shared lazy backfill for lead.ai_summary.
//
// Leads have an ai_summary column cached on the row. Any row where
// ai_summary IS NULL needs to be regenerated via
// POST /api/contractor/customers/[id]/ai-summary, which calls Claude
// Haiku 4.5 and writes the result back. A Postgres trigger on the
// activity_log table nulls ai_summary whenever a timeline entry is
// inserted/updated/deleted, so after any server-side change the next
// client to view the lead will see a stale null and trigger regen.
//
// This module exposes the shared loop used by both the pipeline view
// (many leads at once) and the customer detail page (single lead).
// The loop is self-driving: it reads the latest leads via a ref each
// iteration, so newly-arrived leads get picked up without cancelling
// the in-progress pass. Failures mark the lead as "attempted" for the
// session so we don't hammer a permanently broken row; the consumer
// can call `markStale(id)` after a mutation to re-enable retry.

type LeadSummaryShape = {
  id: string;
  ai_summary: string | null;
  is_demo?: boolean | null;
};

async function fetchAiSummary(leadId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `/api/contractor/customers/${leadId}/ai-summary`,
      { method: "POST" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { ai_summary?: string };
    return data.ai_summary ?? null;
  } catch {
    return null;
  }
}

export type LazyAiSummaryHandle = {
  /** Forget that we've attempted a given lead so it becomes eligible for
   *  regeneration again. Call after a client-side mutation (note add,
   *  status change, etc.) so the hook picks the lead back up. */
  markStale: (leadId: string) => void;
};

/** Lazy backfill for a batch of leads (pipeline view). */
export function useLazyAiSummaries<T extends LeadSummaryShape>(
  leads: T[],
  onSummary: (leadId: string, summary: string) => void,
): LazyAiSummaryHandle {
  const attempted = useRef<Set<string>>(new Set());
  const running = useRef(false);
  const leadsRef = useRef(leads);
  const onSummaryRef = useRef(onSummary);

  useEffect(() => {
    leadsRef.current = leads;
  }, [leads]);

  useEffect(() => {
    onSummaryRef.current = onSummary;
  }, [onSummary]);

  useEffect(() => {
    if (running.current) return;
    running.current = true;

    (async () => {
      try {
        while (true) {
          const target = leadsRef.current.find(
            (l) =>
              !l.ai_summary && !l.is_demo && !attempted.current.has(l.id),
          );
          if (!target) return;
          const id = target.id;
          const summary = await fetchAiSummary(id);
          attempted.current.add(id);
          if (summary) onSummaryRef.current(id, summary);
        }
      } finally {
        running.current = false;
      }
    })();
  }, [leads]);

  const markStale = useCallback((leadId: string) => {
    attempted.current.delete(leadId);
  }, []);

  return { markStale };
}

/** Lazy backfill for a single lead (customer detail page). Thin wrapper
 *  around useLazyAiSummaries. */
export function useLazyAiSummary<T extends LeadSummaryShape>(
  lead: T | null,
  onSummary: (summary: string) => void,
): LazyAiSummaryHandle {
  const wrapped = useMemo(() => (lead ? [lead] : []), [lead]);
  const onSummaryByLeadId = useCallback(
    (_leadId: string, summary: string) => onSummary(summary),
    [onSummary],
  );
  return useLazyAiSummaries(wrapped, onSummaryByLeadId);
}
