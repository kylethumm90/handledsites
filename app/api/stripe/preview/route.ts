import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";
import { getStripe, PLAN_PRICE_MAP } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { businessId } = auth;

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

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("business_id", businessId)
    .single();

  if (!sub?.stripe_subscription_id || !sub?.stripe_customer_id) {
    // No existing subscription — this will be a new checkout, no preview needed
    return NextResponse.json({
      type: "new_subscription",
      amount: null,
      message: "You'll be redirected to checkout.",
    });
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
    const currentItemId = subscription.items.data[0]?.id;

    if (!currentItemId) {
      return NextResponse.json({ error: "No subscription item found" }, { status: 500 });
    }

    // Preview the upcoming invoice with the proposed change
    const preview = await stripe.invoices.createPreview({
      customer: sub.stripe_customer_id,
      subscription: sub.stripe_subscription_id,
      subscription_details: {
        items: [{ id: currentItemId, price: priceId }],
        proration_behavior: "create_prorations",
      },
    });

    // Find proration line items (v22 SDK: check parent.subscription_item_details.proration)
    const lines = preview.lines?.data || [];
    const prorationLines = lines.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (line: any) => line.proration || line.parent?.subscription_item_details?.proration
    );
    const regularLines = lines.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (line: any) => !line.proration && !line.parent?.subscription_item_details?.proration
    );

    const prorationAmount = prorationLines.reduce(
      (sum, line) => sum + line.amount,
      0
    );

    const amountDueToday = prorationAmount;
    const nextPeriodStart = preview.period_end;
    const nextAmount = regularLines.reduce((sum, line) => sum + line.amount, 0);

    return NextResponse.json({
      type: "plan_change",
      amount_due_today: amountDueToday, // cents, positive = charge, negative = credit
      next_billing_date: nextPeriodStart, // unix timestamp
      next_amount: nextAmount, // cents
      currency: preview.currency || "usd",
    });
  } catch (err) {
    console.error("[stripe/preview] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to preview" },
      { status: 500 }
    );
  }
}
