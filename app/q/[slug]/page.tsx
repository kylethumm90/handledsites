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
        ctaText: site.cta_text || "Get My Free Quote",
        accentColor: site.accent_color || "#6366f1",
        gtmId: site.gtm_id || null,
        metaPixelId: site.meta_pixel_id || null,
        zapierWebhookUrl: site.zapier_webhook_url || null,
      }}
      questions={questions}
    />
  );
}
