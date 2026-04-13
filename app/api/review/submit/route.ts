import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { site_id, rating, feedback, highlights, professionalism, communication, rep_id, rep_name, lead_id } = body;
  const hasHighlights = Array.isArray(highlights) && highlights.length > 0;

  if (!site_id || !rating) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Look up site and business
  const { data: site } = await supabase
    .from("sites_full")
    .select("business_id, business_name, google_review_url")
    .eq("id", site_id)
    .single();

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  // Resolve rep name if rep_id provided but no rep_name
  let resolvedRepName = rep_name || null;
  if (rep_id && !resolvedRepName) {
    const { data: emp } = await supabase
      .from("employees")
      .select("name")
      .eq("id", rep_id)
      .single();
    if (emp) resolvedRepName = emp.name.split(" ")[0];
  }

  const isPositive = rating >= 4;
  let generatedReview: string | null = null;

  // Generate review for happy customers
  if (isPositive && (feedback?.trim() || hasHighlights)) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        const client = new Anthropic({ apiKey });

        const repInstruction = resolvedRepName
          ? `\nThe customer worked with ${resolvedRepName}. Naturally include their first name in the review where it fits — like "${resolvedRepName} walked us through..." or "Working with ${resolvedRepName} was...". Only include the name where it reads naturally, don't force it.`
          : "";

        const message = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          system: `You are writing a Google review on behalf of a happy customer of "${site.business_name}".

Write a natural, genuine 2-3 sentence Google review based on their feedback.
Rules:
- Sound like a real customer, not marketing copy
- Include specifics from their feedback
- Keep it under 60 words
- Don't start with "I"
- No em dashes
- No exclamation marks in the first sentence
- Output ONLY the review text, nothing else${repInstruction}`,
          messages: [
            {
              role: "user",
              content: `The customer rated their experience ${rating}/5.
Professionalism: ${professionalism || "not answered"}
Communication: ${communication || "not answered"}${hasHighlights ? `\nWhat stood out to them: ${highlights.join(", ")}` : ""}
Additional feedback: "${feedback || ""}"`,
            },
          ],
        });

        const textBlock = message.content.find((b) => b.type === "text");
        generatedReview = textBlock?.text || null;
      } catch (err) {
        console.error("Failed to generate review:", err);
      }
    }
  }

  // Store response with rep + (optional) customer attribution
  await supabase.from("review_responses").insert({
    business_id: site.business_id,
    site_id,
    rating,
    feedback: feedback?.trim() || null,
    highlights: hasHighlights ? highlights : null,
    generated_review: generatedReview,
    is_positive: isPositive,
    professionalism: professionalism || null,
    communication: communication || null,
    rep_id: rep_id || null,
    tech_name: resolvedRepName || null,
    lead_id: lead_id || null,
  });

  // Log activity when the review is attributable to a specific customer.
  // Best-effort: never fail the submission if the log insert errors.
  if (lead_id) {
    const summary = isPositive
      ? `Left a ${rating}-star review`
      : `Submitted feedback (${rating}/5)`;
    await supabase
      .from("activity_log")
      .insert({
        business_id: site.business_id,
        lead_id,
        type: "review_received",
        summary,
      })
      .then(() => {}, () => {});
  }

  if (isPositive) {
    return NextResponse.json({
      is_positive: true,
      generated_review: generatedReview,
      google_review_url: site.google_review_url,
    });
  }

  return NextResponse.json({ is_positive: false });
}
