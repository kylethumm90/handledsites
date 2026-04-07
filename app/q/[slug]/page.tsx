import { getSupabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import QuizClient from "./QuizClient";
import PulsePageView from "@/components/PulsePageView";

export const revalidate = 60;

type QuizQuestion = {
  id: string;
  question: string;
  type: string;
  options: string[];
};

// Per-trade default copy — override via site fields if needed
const TRADE_COPY: Record<string, {
  quizHeadline: string;
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
    quizHeadline: "Find Out If Your Home Qualifies for $0-Down Solar (Takes 60 Seconds)",
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
    quizHeadline: "What Would Your Yard Look Like With a Pro Behind It? Let\u2019s Find Out.",
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
  Roofing: {
    quizHeadline: "How Much Is Your Roof Actually Worth? Find Out in 60 Seconds.",
    formHeadline: "You qualify. Let\u2019s get you a free roof estimate.",
    formSubtext: "Fill in a few details and we\u2019ll get back to you fast.",
    submitButtonText: "Get My Free Quote \u2192",
    finePrint: "No commitment. No spam.",
    thankYouHeadline: "You\u2019re on the list.",
    thankYouBody: "A roofing specialist will be in touch shortly.",
    dqHeadline: "We work best with homeowners.",
    dqBody: "Feel free to reach out directly if you have questions.",
    buttonTextColor: "#ffffff",
  },
  Electrical: {
    quizHeadline: "Is Your Home\u2019s Electrical Up to Code? Answer 5 Quick Questions to Find Out.",
    formHeadline: "Let\u2019s get you a free electrical assessment.",
    formSubtext: "Fill in a few details and we\u2019ll reach out fast.",
    submitButtonText: "Get My Free Quote \u2192",
    finePrint: "No commitment. No spam.",
    thankYouHeadline: "You\u2019re on the list.",
    thankYouBody: "A licensed electrician will be in touch shortly.",
    dqHeadline: "We work best with homeowners.",
    dqBody: "Feel free to reach out directly if you have questions.",
    buttonTextColor: "#ffffff",
  },
  HVAC: {
    quizHeadline: "Is Your HVAC System Costing You More Than It Should? Take the 60-Second Check.",
    formHeadline: "Let\u2019s get you a free HVAC assessment.",
    formSubtext: "Fill in a few details and we\u2019ll reach out fast.",
    submitButtonText: "Get My Free Quote \u2192",
    finePrint: "No commitment. No spam.",
    thankYouHeadline: "You\u2019re on the list.",
    thankYouBody: "An HVAC specialist will be in touch shortly.",
    dqHeadline: "We work best with homeowners.",
    dqBody: "Feel free to reach out directly if you have questions.",
    buttonTextColor: "#ffffff",
  },
  Plumbing: {
    quizHeadline: "Got a Plumbing Problem? Answer 4 Questions and We\u2019ll Tell You What It\u2019ll Take to Fix It.",
    formHeadline: "Let\u2019s get you a free plumbing estimate.",
    formSubtext: "Fill in a few details and we\u2019ll reach out fast.",
    submitButtonText: "Get My Free Quote \u2192",
    finePrint: "No commitment. No spam.",
    thankYouHeadline: "You\u2019re on the list.",
    thankYouBody: "A plumber will be in touch shortly.",
    dqHeadline: "We work best with homeowners.",
    dqBody: "Feel free to reach out directly if you have questions.",
    buttonTextColor: "#ffffff",
  },
  Painting: {
    quizHeadline: "How Much Should Your Paint Job Actually Cost? Get a Real Estimate in 60 Seconds.",
    formHeadline: "Let\u2019s get you a free painting estimate.",
    formSubtext: "Fill in a few details and we\u2019ll reach out fast.",
    submitButtonText: "Get My Free Quote \u2192",
    finePrint: "No commitment. No spam.",
    thankYouHeadline: "You\u2019re on the list.",
    thankYouBody: "A painting pro will be in touch shortly.",
    dqHeadline: "We work best with homeowners.",
    dqBody: "Feel free to reach out directly if you have questions.",
    buttonTextColor: "#ffffff",
  },
  "General Contractor": {
    quizHeadline: "What\u2019s Your Project Worth? Answer a Few Questions and Get a Real Ballpark.",
    formHeadline: "Let\u2019s get you a free project estimate.",
    formSubtext: "Fill in a few details and we\u2019ll reach out fast.",
    submitButtonText: "Get My Free Quote \u2192",
    finePrint: "No commitment. No spam.",
    thankYouHeadline: "You\u2019re on the list.",
    thankYouBody: "A contractor will be in touch shortly.",
    dqHeadline: "We work best with homeowners.",
    dqBody: "Feel free to reach out directly if you have questions.",
    buttonTextColor: "#ffffff",
  },
  "Pest Control": {
    quizHeadline: "Got Pests? Find Out What It\u2019ll Take to Get Rid of Them \u2014 in 60 Seconds.",
    formHeadline: "We can help. Let\u2019s get you a free inspection.",
    formSubtext: "Fill in a few details and we\u2019ll reach out fast.",
    submitButtonText: "Get My Free Inspection \u2192",
    finePrint: "No commitment. No obligation.",
    thankYouHeadline: "You\u2019re all set.",
    thankYouBody: "A pest control specialist will be in touch shortly.",
    dqHeadline: "We work best with homeowners.",
    dqBody: "Feel free to reach out directly if you have questions.",
    buttonTextColor: "#ffffff",
  },
};

const DEFAULT_COPY = {
  quizHeadline: "",
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
    <>
    <PulsePageView siteId={site.id} />
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
        quizHeadline: copy.quizHeadline,
        formHeadline: copy.formHeadline,
        formSubtext: copy.formSubtext,
        submitButtonText: copy.submitButtonText,
        finePrint: copy.finePrint,
        thankYouHeadline: copy.thankYouHeadline,
        thankYouBody: copy.thankYouBody,
        dqHeadline: copy.dqHeadline,
        dqBody: copy.dqBody,
        buttonTextColor: copy.buttonTextColor,
        googleRating: site.google_rating || null,
        googleReviewCount: site.google_review_count || null,
      }}
      questions={questions}
    />
    </>
  );
}
