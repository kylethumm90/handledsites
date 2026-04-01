import { Phone, Search, Share2 } from "lucide-react";

const features = [
  {
    icon: Phone,
    title: "Converts visitors to calls",
    description:
      "One-tap call and text buttons mean your customers never have to search for your number.",
  },
  {
    icon: Search,
    title: "Found by AI search",
    description:
      "Built-in schema markup helps AI assistants and search engines surface your business.",
  },
  {
    icon: Share2,
    title: "Shareable anywhere",
    description:
      "Text it, email it, put it on your truck. One link that works everywhere, on every device.",
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
