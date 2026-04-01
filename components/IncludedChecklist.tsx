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
            <img
              src="/phone-demo-home.png"
              alt="Example contractor business card"
              className="w-[360px]"
            />
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
