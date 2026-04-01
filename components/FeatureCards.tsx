import { Phone, Globe, Share2 } from "lucide-react";

const features = [
  {
    icon: Phone,
    title: "Built to drive calls",
    description:
      "One-tap call and text buttons front and center. Visitors don't search for your number — they just tap.",
  },
  {
    icon: Globe,
    title: "Your own website, instantly",
    description:
      "A professional site at your own URL. Share it anywhere — texts, emails, social media, truck decals.",
  },
  {
    icon: Share2,
    title: "Works on every device",
    description:
      "Mobile-first design that looks great on any phone, tablet, or computer. No app to download.",
  },
];

export default function FeatureCards() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <div className="grid gap-8 md:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900">
              <feature.icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {feature.title}
            </h3>
            <p className="text-sm leading-relaxed text-gray-600">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
