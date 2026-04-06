import { Phone, Globe, Share2 } from "lucide-react";

const features = [
  {
    icon: Phone,
    title: "Built to drive calls",
    description:
      "One-tap call and text buttons front and center. Visitors don't search for your number — they just tap.",
    accent: "bg-blue-50 text-blue-600",
  },
  {
    icon: Globe,
    title: "Your own website, instantly",
    description:
      "A professional site at your own URL. Share it anywhere — texts, emails, social media, truck decals.",
    accent: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Share2,
    title: "Works on every device",
    description:
      "Mobile-first design that looks great on any phone, tablet, or computer. No app to download.",
    accent: "bg-amber-50 text-amber-600",
  },
];

export default function FeatureCards() {
  return (
    <section className="border-t border-gray-100 bg-gray-50/60 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <p className="mb-10 text-center text-sm font-semibold tracking-wide text-gray-400">WHY CONTRACTORS CHOOSE HANDLED</p>
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-gray-100"
            >
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${feature.accent}`}>
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
