import type { Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
  title: "Pricing | handled.sites",
  description:
    "A site, a phone number, and everything you need to talk to your customers. Start free, upgrade when you're ready.",
};

export default function PricingPage() {
  return <PricingClient />;
}
