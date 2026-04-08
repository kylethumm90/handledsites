import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return stripeInstance;
}

export const PLAN_PRICE_MAP: Record<string, string | undefined> = {
  sites_pro: process.env.STRIPE_PRICE_SITES_PRO,
  tools: process.env.STRIPE_PRICE_TOOLS,
  ai: process.env.STRIPE_PRICE_AI,
};

/** Reverse-map a Stripe price ID back to a plan name */
export function priceToPlan(priceId: string): string {
  for (const [plan, pid] of Object.entries(PLAN_PRICE_MAP)) {
    if (pid === priceId) return plan;
  }
  return "free";
}
