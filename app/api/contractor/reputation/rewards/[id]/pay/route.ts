import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

// Marks a pending referral reward as sent. The button on each Rewards
// Pending card in the Growth view calls this. We do NOT actually move
// money — this just records that the contractor handled the payout
// out-of-band (cash, gift card, etc.) so the card disappears from the
// pending list.

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { businessId } = auth;

  const supabase = getSupabaseAdmin();

  const { data: reward, error: fetchErr } = await supabase
    .from("referral_rewards")
    .select("id, status, business_id, referrer_lead_id, amount_cents")
    .eq("id", params.id)
    .eq("business_id", businessId)
    .single();

  if (fetchErr || !reward) {
    return NextResponse.json({ error: "Reward not found" }, { status: 404 });
  }
  if (reward.status !== "pending") {
    return NextResponse.json(
      { error: `Reward is already ${reward.status}` },
      { status: 409 }
    );
  }

  const { error: updateErr } = await supabase
    .from("referral_rewards")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("business_id", businessId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Best-effort activity log on the referrer's lead row so the payout
  // shows up in their timeline.
  await supabase
    .from("activity_log")
    .insert({
      business_id: businessId,
      lead_id: reward.referrer_lead_id,
      type: "referral_reward_sent",
      summary: `Referral reward of $${(reward.amount_cents / 100).toFixed(0)} marked as sent`,
    })
    .then(
      () => {},
      () => {}
    );

  return NextResponse.json({ ok: true });
}
