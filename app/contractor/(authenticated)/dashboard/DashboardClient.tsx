"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Lead } from "@/lib/supabase";
import { relativeTime, avatarColor, initials } from "@/lib/utils";

type Props = {
  businessName: string;
  logoUrl: string | null;
  leads: Lead[];
  totalLeads: number;
  newLeadsThisWeek: number;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function sourceLabel(source: string): string {
  switch (source) {
    case "quiz_funnel": return "Quiz funnel";
    case "contact_form": return "Contact form";
    case "manual": return "Manual";
    default: return source;
  }
}

function serviceFromLead(lead: Lead): string | null {
  if (lead.service_needed) return lead.service_needed;
  if (lead.answers?.service_type) return lead.answers.service_type;
  return null;
}

export default function DashboardClient({
  businessName,
  logoUrl,
  leads,
  totalLeads,
  newLeadsThisWeek,
}: Props) {
  const router = useRouter();

  return (
    <div className="space-y-8">
      {/* Greeting header */}
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={businessName}
            className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: avatarColor(businessName) }}
          >
            {initials(businessName)}
          </div>
        )}
        <div>
          <p className="text-sm text-gray-500">{getGreeting()}</p>
          <h1 className="text-xl font-bold text-gray-900">
            {businessName}
          </h1>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-2xl font-bold text-gray-900">{newLeadsThisWeek}</p>
          <p className="text-xs text-gray-500">New leads</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
          <p className="text-xs text-gray-500">Customers</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-300">&mdash;</p>
          <p className="text-xs text-gray-400">Page views</p>
        </div>
      </div>

      {/* Recent leads */}
      <div>
        <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-gray-400">
          Recent leads
        </p>

        {leads.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-10 text-center">
            <p className="text-sm text-gray-400">No leads yet.</p>
            <p className="mt-1 text-xs text-gray-400">
              Share your site and quiz funnel to start collecting leads.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {leads.map((lead) => {
                const service = serviceFromLead(lead);
                const color = avatarColor(lead.name);

                return (
                  <button
                    key={lead.id}
                    onClick={() => router.push(`/contractor/customers/${lead.id}`)}
                    className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
                  >
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {initials(lead.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {lead.name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {service || "No service specified"}
                        <span className="mx-1 text-gray-300">&middot;</span>
                        {sourceLabel(lead.source)}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-xs text-gray-400">
                      {relativeTime(lead.created_at)}
                    </span>
                  </button>
                );
              })}
            </div>

            {totalLeads > leads.length && (
              <Link
                href="/contractor/customers"
                className="mt-3 block text-center text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                View all {totalLeads} customers
              </Link>
            )}
          </>
        )}
      </div>

      {/* Closing line */}
      <p className="pt-4 text-center text-xs text-gray-300">
        That&apos;s everything. Go do the work.
      </p>
    </div>
  );
}
