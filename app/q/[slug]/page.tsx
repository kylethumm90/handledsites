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

  const { data: funnel } = await supabase
    .from("quiz_funnels")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single();

  if (!funnel) notFound();

  const { data: template } = await supabase
    .from("quiz_templates")
    .select("questions")
    .eq("trade", funnel.trade)
    .single();

  const questions: QuizQuestion[] = template?.questions || [];

  return (
    <QuizClient
      funnel={{
        id: funnel.id,
        businessName: funnel.business_name,
        trade: funnel.trade,
        phone: funnel.phone,
        city: funnel.city,
        state: funnel.state,
        logoUrl: funnel.logo_url,
        headline: funnel.headline,
        ctaText: funnel.cta_text || "Get My Free Quote",
        accentColor: funnel.accent_color || "#6366f1",
      }}
      questions={questions}
    />
  );
}
