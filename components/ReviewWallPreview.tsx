"use client";

type Props = {
  businessName: string;
  trade: string;
  city: string;
  state: string;
  logoUrl?: string | null;
};

export default function ReviewWallPreview({
  businessName,
  trade,
  city,
  state,
  logoUrl,
}: Props) {
  const initials = businessName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  return (
    <div className="w-[420px]">
      {/* Browser chrome */}
      <div className="rounded-t-xl border border-b-0 border-gray-200 bg-gray-100 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 rounded-md bg-white px-3 py-1 text-[9px] text-gray-400 font-mono truncate">
            handledsites.com/reviews/{businessName.toLowerCase().replace(/\s+/g, "-")}
          </div>
        </div>
      </div>

      {/* Browser viewport */}
      <div className="overflow-hidden rounded-b-xl border border-gray-200 bg-[#FAFAF9]" style={{ height: 320 }}>
        {/* Hero */}
        <div className="bg-[#0C1A2E] px-6 py-5 text-center">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="mx-auto mb-2 h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A56DB] text-[8px] font-bold text-white">
              {initials}
            </div>
          )}
          <div className="text-[12px] font-extrabold text-white leading-tight">{businessName}</div>
          <div className="mt-0.5 text-[7px] font-semibold uppercase tracking-[2px] text-white/40">
            {trade} · {city}, {state}
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-center gap-3 border-b border-gray-200 bg-white px-3 py-2">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-extrabold text-gray-900">4.8</span>
            <div className="flex gap-px text-[8px] text-amber-400">★★★★★</div>
          </div>
          <div className="h-3 w-px bg-gray-200" />
          <span className="text-[8px] font-medium text-gray-500">834 reviews</span>
          <div className="h-3 w-px bg-gray-200" />
          <span className="text-[8px] font-medium text-gray-500">Google Reviews</span>
        </div>

        {/* Sample review cards */}
        <div className="px-3 py-2.5">
          <div className="mb-1.5 text-[6px] font-bold uppercase tracking-[1.5px] text-gray-400">Featured Reviews</div>
          <div className="space-y-1.5">
            {/* Review 1 */}
            <div className="rounded-lg border border-gray-200 border-l-[2px] border-l-[#1A56DB] bg-white px-2.5 py-2">
              <div className="mb-1 flex gap-px text-[7px] text-amber-400">★★★★★</div>
              <p className="text-[7px] leading-[1.5] text-gray-600 mb-1.5">
                &ldquo;Outstanding service from start to finish. The team was professional, on time, and the quality exceeded our expectations...&rdquo;
              </p>
              <div className="flex items-center gap-1.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1A56DB] text-[5px] font-bold text-white">JM</div>
                <span className="text-[6px] font-semibold text-gray-700">Jennifer M.</span>
                <span className="text-[6px] text-gray-400">March 2026</span>
              </div>
            </div>

            {/* Review 2 */}
            <div className="rounded-lg border border-gray-200 border-l-[2px] border-l-[#1A56DB] bg-white px-2.5 py-2">
              <div className="mb-1 flex gap-px text-[7px] text-amber-400">★★★★★</div>
              <p className="text-[7px] leading-[1.5] text-gray-600 mb-1.5">
                &ldquo;Best decision we ever made. Highly recommend to anyone looking for quality work at a fair price.&rdquo;
              </p>
              <div className="flex items-center gap-1.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#F97316] text-[5px] font-bold text-white">DC</div>
                <span className="text-[6px] font-semibold text-gray-700">David C.</span>
                <span className="text-[6px] text-gray-400">February 2026</span>
              </div>
            </div>

            {/* Review 3 */}
            <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2">
              <div className="mb-1 flex gap-px text-[7px] text-amber-400">★★★★★</div>
              <p className="text-[7px] leading-[1.5] text-gray-600 mb-1.5">
                &ldquo;Professional crew, great communication throughout. Very happy with the results.&rdquo;
              </p>
              <div className="flex items-center gap-1.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#10b981] text-[5px] font-bold text-white">ST</div>
                <span className="text-[6px] font-semibold text-gray-700">Sarah T.</span>
                <span className="text-[6px] text-gray-400">January 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
