import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  let body: { review: string; businessName: string; tone: string; stars: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { review, businessName, tone, stars } = body;

  if (!review || !businessName || !tone || !stars) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let starGuidance = "";
  if (stars <= 2) {
    starGuidance =
      "This is a negative review (1-2 stars). Use damage control mode: sincerely acknowledge the issue, apologize without making excuses, offer to make it right, and invite them to contact you directly to resolve the situation. Show empathy and accountability.";
  } else if (stars === 3) {
    starGuidance =
      "This is a mixed review (3 stars). Use neutral recovery mode: thank them for the feedback, directly address the gap they mentioned, and show a clear commitment to improvement. Strike a balance between gratitude and accountability.";
  } else {
    starGuidance =
      "This is a positive review (4-5 stars). Amplify the positive: express genuine, heartfelt gratitude, reinforce the specific things they praised, and warmly invite them back. Be enthusiastic without being over-the-top.";
  }

  let toneGuidance = "";
  if (tone === "Professional") {
    toneGuidance =
      "Use a professional, polished tone. Measured and business-appropriate. No slang or casual language.";
  } else if (tone === "Friendly") {
    toneGuidance =
      "Use a warm, friendly, conversational tone. Personable and approachable, like a small business owner who genuinely cares.";
  } else if (tone === "Firm") {
    toneGuidance =
      "Use a firm but polite tone. This may be an unfair or fake review. Be clear and factual in protecting the brand's reputation without being combative, argumentative, or defensive. Politely present the business's side if appropriate.";
  }

  const systemPrompt = `You are a professional review response writer for a home service business called "${businessName}". Write a public response to a Google review as the business owner.

Rules:
- Keep responses between 75-150 words
- Never be defensive or argue with the customer
- Include the business name naturally in the response
- Write in first person as the business owner
- Do not use placeholder text like [Name] or [Phone Number] — write a complete, ready-to-post response
- Do not include a subject line or greeting prefix like "Dear customer" — start naturally
- Output ONLY the response text, nothing else

${toneGuidance}

${starGuidance}`;

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Here is the ${stars}-star Google review to respond to:\n\n"${review}"`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const response = textBlock ? textBlock.text : "";

    return NextResponse.json({ response });
  } catch (err) {
    console.error("Anthropic API error:", err);
    return NextResponse.json(
      { error: "Failed to generate response. Please try again." },
      { status: 500 }
    );
  }
}
