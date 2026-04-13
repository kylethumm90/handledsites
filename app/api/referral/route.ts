import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getResend } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { referral_code, name, phone, message } = body;

  if (!referral_code || !name || !phone) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Look up referral partner
  const { data: partner } = await supabase
    .from("referral_partners")
    .select("id, business_id, customer_id")
    .eq("referral_code", referral_code)
    .single();

  if (!partner) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
  }

  // Get referrer name for notification
  const { data: referrer } = await supabase
    .from("leads")
    .select("name")
    .eq("id", partner.customer_id)
    .single();

  // Create the lead
  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      business_id: partner.business_id,
      name: name.trim(),
      phone: phone.replace(/\D/g, ""),
      source: "referral",
      status: "lead",
      referral_code,
      notes: message?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log to The Story on the newly-created lead: where it came from + the
  // message (if any) as a separate note-style entry. Best-effort — never
  // fail the referral if activity logging errors.
  const referrerFirst = referrer?.name?.split(" ")[0] || null;
  await supabase
    .from("activity_log")
    .insert({
      business_id: partner.business_id,
      lead_id: lead.id,
      type: "lead_created",
      summary: referrerFirst
        ? `New referral from ${referrerFirst}`
        : "New referral",
    })
    .then(() => {}, () => {});

  if (message?.trim()) {
    await supabase
      .from("activity_log")
      .insert({
        business_id: partner.business_id,
        lead_id: lead.id,
        type: "note",
        summary: message.trim(),
      })
      .then(() => {}, () => {});
  }

  // Notify business owner via email
  try {
    const { data: business } = await supabase
      .from("businesses")
      .select("email, name")
      .eq("id", partner.business_id)
      .single();

    if (business?.email) {
      const resend = getResend();
      const from = process.env.EMAIL_FROM || "Handled Sites <onboarding@resend.dev>";
      await resend.emails.send({
        from,
        to: business.email,
        subject: `New referral from ${referrer?.name || "a customer"}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
            <p style="font-size: 15px; color: #1a1a1a; margin-bottom: 8px;">
              <strong>${referrer?.name || "A customer"}</strong> just referred someone to ${business.name}.
            </p>
            <div style="background: #f8f8f6; border-radius: 12px; padding: 16px; margin: 16px 0;">
              <p style="font-size: 14px; color: #1a1a1a; margin: 0 0 4px;"><strong>Name:</strong> ${name}</p>
              <p style="font-size: 14px; color: #1a1a1a; margin: 0 0 4px;"><strong>Phone:</strong> ${phone}</p>
              ${message ? `<p style="font-size: 14px; color: #1a1a1a; margin: 0;"><strong>Message:</strong> ${message}</p>` : ""}
            </div>
            <p style="font-size: 13px; color: #6b7280;">This lead came through your handled. referral link.</p>
          </div>
        `,
      });
    }
  } catch (err) {
    console.error("Referral notification failed:", err);
  }

  return NextResponse.json({ success: true, lead_id: lead.id });
}
