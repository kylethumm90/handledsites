import { getSupabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import QuizClient from "./QuizClient";

export const revalidate = 60;

type QuizQuestion = {
  id: string;
  question: string;
  type: string;
  options: string[];
};

// Per-trade default copy — override via site fields if needed
const TRADE_COPY: Record<string, {
  formHeadline: string;
  formSubtext: string;
  submitButtonText: string;
  finePrint: string;
  thankYouHeadline: string;
  thankYouBody: string;
  dqHeadline: string;
  dqBody: string;
  buttonTextColor: string;
}> = {
  Solar: {
    formHeadline: "You qualify. Let\u2019s build your free savings estimate.",
    formSubtext: "Fill in a few details and we\u2019ll get back to you fast.",
    submitButtonText: "See My Savings \u2192",
    finePrint: "No pressure. No obligation. Takes 2 minutes.",
    thankYouHeadline: "You\u2019re all set.",
    thankYouBody: "A solar advisor will reach out within the hour.",
    dqHeadline: "Solar works best for homeowners.",
    dqBody: "Check back when you\u2019re ready \u2014 we\u2019d love to help you go solar.",
    buttonTextColor: "#1A1A1A",
  },
  Landscaping: {
    formHeadline: "Great news \u2014 we service your area. Let\u2019s get you a free quote.",
    formSubtext: "Fill in a few details and we\u2019ll reach out within 24 hours.",
    submitButtonText: "Get My Free Quote \u2192",
    finePrint: "No commitment. We\u2019ll reach out within 24 hours.",
    thankYouHeadline: "You\u2019re on the list.",
    thankYouBody: "A member of our team will be in touch within 24 hours to walk through your options.",
    dqHeadline: "We work best with homeowners.",
    dqBody: "Feel free to reach out directly if you have questions.",
    buttonTextColor: "#ffffff",
  },
};

const DEFAULT_COPY = {
  formHeadline: "You qualify. Let\u2019s get you a free quote.",
  formSubtext: "Fill in a few details and we\u2019ll get back to you fast.",
  submitButtonText: "Get My Free Quote \u2192",
  finePrint: "No commitment. No spam.",
  thankYouHeadline: "You\u2019re on the list.",
  thankYouBody: "A member of our team will be in touch shortly.",
  dqHeadline: "We work best with homeowners.",
  dqBody: "Feel free to reach out directly if you have questions.",
  buttonTextColor: "#ffffff",
};

export default async function QuizFunnelPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = getSupabaseAdmin();

  const { data: site } = await supabase
    .from("sites_full")
    .select("*")
    .eq("slug", params.slug)
    .eq("type", "quiz_funnel")
    .eq("is_active", true)
    .single();

  if (!site) notFound();

  const { data: template } = await supabase
    .from("quiz_templates")
    .select("questions")
    .eq("trade", site.trade)
    .single();

  const questions: QuizQuestion[] = template?.questions || [];
  const copy = TRADE_COPY[site.trade] || DEFAULT_COPY;

  return (
    <QuizClient
      funnel={{
        id: site.id,
        businessName: site.business_name,
        trade: site.trade,
        phone: site.business_phone,
        city: site.city,
        state: site.state,
        logoUrl: site.logo_url,
        headline: site.headline,
        ctaText: site.cta_text || copy.submitButtonText,
        accentColor: site.accent_color || "#6366f1",
        gtmId: site.gtm_id || null,
        metaPixelId: site.meta_pixel_id || null,
        zapierWebhookUrl: site.zapier_webhook_url || null,
        formHeadline: copy.formHeadline,
        formSubtext: copy.formSubtext,
        submitButtonText: copy.submitButtonText,
        finePrint: copy.finePrint,
        thankYouHeadline: copy.thankYouHeadline,
        thankYouBody: copy.thankYouBody,
        dqHeadline: copy.dqHeadline,
        dqBody: copy.dqBody,
        buttonTextColor: copy.buttonTextColor,
      }}
      questions={questions}
    />
  );
}
