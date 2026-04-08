import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";
import { getStripe, PLAN_PRICE_MAP } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const siteId = await validateSessionFromRequest(request);
  if (!siteId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const plan = body.plan as string;

  if (!plan || !PLAN_PRICE_MAP[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceId = PLAN_PRICE_MAP[plan];
  if (!priceId) {
    return NextResponse.json({ error: "Price not configured" }, { status: 500 });
  }

  const supabase = getSupabaseAdmin();
  const stripe = getStripe();

  // Get business info
  const { data: site } = await supabase
    .from("sites")
    .select("business_id")
    .eq("id", siteId)
    .single();

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const businessId = site.business_id;

  const { data: business } = await supabase
    .from("businesses")
    .select("email, name")
    .eq("id", businessId)
    .single();

  // Get or create subscription record
  let { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("business_id", businessId)
    .single();

  if (!sub) {
    const { data: newSub } = await supabase
      .from("subscriptions")
      .insert({ business_id: businessId, plan: "free", status: "active" })
      .select()
      .single();
    sub = newSub;
  }

  // Get or create Stripe customer
  let customerId = sub?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: business?.email || undefined,
      name: business?.name || undefined,
      metadata: { business_id: businessId },
    });
    customerId = customer.id;

    await supabase
      .from("subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("business_id", businessId);
  }

  // If already has an active Stripe subscription, update it (upgrade/downgrade)
  if (sub?.stripe_subscription_id && sub.status === "active") {
    const subscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      items: [{ id: subscription.items.data[0].id, price: priceId }],
      proration_behavior: "create_prorations",
    });

    return NextResponse.json({ url: "/contractor/settings?upgraded=true" });
  }

  // Create new checkout session
  const origin = request.headers.get("origin") || "https://www.handledsites.com";
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/contractor/settings?upgraded=true`,
    cancel_url: `${origin}/contractor/settings`,
    metadata: { business_id: businessId },
    subscription_data: { metadata: { business_id: businessId } },
  });

  return NextResponse.json({ url: session.url });
}
