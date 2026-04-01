import { Check } from "lucide-react";

const items = [
  "Mobile-optimized business card",
  "One-tap call & text buttons",
  "Save to contacts (vCard)",
  "AI search optimization (JSON-LD)",
  "Shareable QR code",
  "Custom URL for your business",
  "Real-time availability status",
  "Google review integration (coming soon)",
];

export default function IncludedChecklist() {
  return (
    <section className="bg-gray-50 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Static phone mockup */}
          <div className="flex justify-center">
            <div className="flex h-[540px] w-[260px] flex-col rounded-[2.5rem] border-4 border-gray-700 bg-[#12151f] p-4 shadow-2xl overflow-hidden">
              <div className="mx-auto mb-4 h-5 w-24 flex-shrink-0 rounded-full bg-gray-800" />
              <div className="flex flex-1 flex-col items-center justify-center space-y-3 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1a1e2e]">
                  <span className="text-base font-bold text-white">BH</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Blue Hen HVAC
                  </h3>
                  <p className="text-xs text-[#9aa0b8]">Wilmington, DE</p>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span className="text-[10px] text-green-400">
                    Available now
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="rounded-lg bg-[#e03535] py-1.5 text-[10px] font-semibold text-white">
                    Call (302) 555-0147
                  </div>
                  <div className="rounded-lg bg-[#1a4d2e] py-1.5 text-[10px] font-semibold text-[#4ade80]">
                    Text us instead
                  </div>
                  <div className="rounded-lg bg-[#1a2a4a] py-1.5 text-[10px] font-semibold text-[#5b8ef0]">
                    Save to contacts
                  </div>
                </div>
              </div>
              <div className="mx-auto mt-4 h-1 w-14 flex-shrink-0 rounded-full bg-gray-600" />
            </div>
          </div>

          {/* Checklist */}
          <div>
            <h2
              className="mb-2 text-3xl font-bold text-gray-900"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Everything included. Free.
            </h2>
            <p className="mb-8 text-gray-600">
              No subscriptions. No hidden fees. Just a professional card that
              works.
            </p>
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
