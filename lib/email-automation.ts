import { getResend } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase";

function interpolateTemplate(
  text: string,
  variables: Record<string, string>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] ?? match;
  });
}

export async function fireEmailTrigger(
  triggerType: string,
  businessId: string
) {
  const supabase = getSupabaseAdmin();

  // Fetch enabled templates for this trigger
  const { data: templates } = await supabase
    .from("email_templates")
    .select("*")
    .eq("trigger_type", triggerType)
    .eq("is_enabled", true);

  if (!templates || templates.length === 0) return;

  // Fetch business data
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  if (!business) return;

  // No email on file — log as skipped for each template
  if (!business.email) {
    for (const tpl of templates) {
      await supabase.from("email_logs").insert({
        template_id: tpl.id,
        business_id: businessId,
        trigger_type: triggerType,
        recipient_email: "",
        subject: tpl.subject,
        status: "skipped",
        error_message: "No email address on business",
      });
    }
    return;
  }

  // Get business card slug for site_url
  const { data: site } = await supabase
    .from("sites")
    .select("slug")
    .eq("business_id", businessId)
    .eq("type", "business_card")
    .single();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://www.handledsites.com";
  const slug = site?.slug || "";

  const variables: Record<string, string> = {
    business_name: business.name || "",
    owner_name: business.owner_name || "",
    phone: business.phone || "",
    email: business.email || "",
    city: business.city || "",
    state: business.state || "",
    trade: business.trade || "",
    services: (business.services || []).join(", "),
    slug,
    site_url: slug ? `${baseUrl}/${slug}` : baseUrl,
  };

  const resend = getResend();
  const from = process.env.EMAIL_FROM || "Handled Sites <onboarding@resend.dev>";

  for (const tpl of templates) {
    const subject = interpolateTemplate(tpl.subject, variables);
    const html = interpolateTemplate(tpl.body_html, variables);

    try {
      const { data } = await resend.emails.send({
        from,
        to: business.email,
        subject,
        html,
      });

      await supabase.from("email_logs").insert({
        template_id: tpl.id,
        business_id: businessId,
        trigger_type: triggerType,
        recipient_email: business.email,
        subject,
        status: "sent",
        resend_id: data?.id || null,
      });
    } catch (err) {
      await supabase.from("email_logs").insert({
        template_id: tpl.id,
        business_id: businessId,
        trigger_type: triggerType,
        recipient_email: business.email,
        subject,
        status: "failed",
        error_message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
}
