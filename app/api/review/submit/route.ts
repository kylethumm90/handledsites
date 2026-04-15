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
  // Sentiment 0-100 derived from the text (and structured signals). We only
  // fall back to `rating * 20` when there's nothing for Claude to read —
  // see below. A low-sentiment 4-star review is the whole point of this
  // code path: it's what lets Alerts catch an angry-but-polite customer
  // that a rating-only model would miss.
  let sentimentScore: number | null =
    typeof rating === "number" ? Math.round(rating * 20) : null;

  // Call Claude whenever we have *any* text signal, positive or negative.
  // - Positive + text → generate a Google review AND extract sentiment.
  // - Negative + text → sentiment only (generated_review: null).
  // - No text + no highlights → skip Claude; use the rating * 20 fallback.
  const hasTextSignal = !!feedback?.trim() || hasHighlights;
  if (hasTextSignal) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        const client = new Anthropic({ apiKey });

        const repInstruction = resolvedRepName
          ? `\nThe customer worked with ${resolvedRepName}. Naturally include their first name in the review where it fits — like "${resolvedRepName} walked us through..." or "Working with ${resolvedRepName} was...". Only include the name where it reads naturally, don't force it.`
          : "";

        const message = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          system: `You are analyzing a customer's feedback about "${site.business_name}" and returning a single JSON object.

Return ONLY valid JSON with this exact shape:
{ "sentiment": <integer 0-100>, "generated_review": <string or null> }

sentiment:
- 0 = extremely negative, 100 = extremely positive
- Weight the WRITTEN TEXT far more heavily than the star rating
- An angry 4-star review should score around 35-45, not 80
- A glowing 3-star review should score around 70-85, not 60
- A neutral review with no strong signal should score near rating * 20

generated_review:
- If positive_hint is true, write a natural, genuine 2-3 sentence Google review based on their feedback
- If positive_hint is false, set this to null
- When writing: sound like a real customer not marketing copy, include specifics from their feedback, keep it under 60 words, don't start with "I", no em dashes, no exclamation marks in the first sentence${repInstruction}

Output ONLY the JSON object. No prose, no markdown fences, no commentary.`,
          messages: [
            {
              role: "user",
              content: `positive_hint: ${isPositive}
Star rating: ${rating}/5
Professionalism: ${professionalism || "not answered"}
Communication: ${communication || "not answered"}${hasHighlights ? `\nWhat stood out to them: ${highlights.join(", ")}` : ""}
Feedback: "${feedback || ""}"`,
            },
          ],
        });

        const textBlock = message.content.find((b) => b.type === "text");
        const raw = textBlock?.text?.trim() || "";
        if (raw) {
          try {
            // Claude sometimes wraps JSON in a fenced block despite the
            // instructions; strip common fences before parsing.
            const cleaned = raw
              .replace(/^```(?:json)?\s*/i, "")
              .replace(/\s*```$/i, "")
              .trim();
            const parsed = JSON.parse(cleaned) as {
              sentiment?: unknown;
              generated_review?: unknown;
            };
            if (
              typeof parsed.sentiment === "number" &&
              Number.isFinite(parsed.sentiment)
            ) {
              sentimentScore = Math.max(
                0,
                Math.min(100, Math.round(parsed.sentiment)),
              );
            }
            if (
              isPositive &&
              typeof parsed.generated_review === "string" &&
              parsed.generated_review.trim().length > 0
            ) {
              generatedReview = parsed.generated_review.trim();
            }
          } catch (parseErr) {
            console.error("Failed to parse Claude JSON response:", parseErr, raw);
            // Leave sentimentScore at the rating*20 fallback.
          }
        }
      } catch (err) {
        console.error("Failed to generate review / sentiment:", err);
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

    // Stamp the denormalized reputation-funnel columns on the lead row so
    // the funnel counts + alerts queries don't need to re-aggregate against
    // review_responses on every render. Best-effort — the review row is
    // already persisted even if this follow-up update fails.
    //
    // - feedback_submitted_at: only set on the first response so re-submits
    //   don't reset the clock.
    // - sentiment_score: latest-wins. Derived by Claude from the written
    //   feedback when text exists (see the NLP block above); falls back to
    //   rating * 20 when the customer didn't write anything.
    await supabase
      .from("leads")
      .update({
        feedback_submitted_at: new Date().toISOString(),
        sentiment_score: sentimentScore,
      })
      .eq("id", lead_id)
      .is("feedback_submitted_at", null)
      .then(() => {}, () => {});

    // Separate update for sentiment_score so we always refresh it on new
    // responses (the guard above only runs on the first-ever submission).
    if (sentimentScore != null) {
      await supabase
        .from("leads")
        .update({ sentiment_score: sentimentScore })
        .eq("id", lead_id)
        .then(() => {}, () => {});
    }

    // Stamp review_submitted_at the first time a positive review lands so
    // the Post-Sale "Reviewed" stage on the new Pipeline screen has a
    // precise signal instead of approximating via sentiment. Negative
    // feedback rows intentionally do NOT stamp this column.
    if (isPositive) {
      await supabase
        .from("leads")
        .update({ review_submitted_at: new Date().toISOString() })
        .eq("id", lead_id)
        .is("review_submitted_at", null)
        .then(() => {}, () => {});
    }
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
