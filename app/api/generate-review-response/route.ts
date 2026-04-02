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

  const systemPrompt = `You are a real business owner of "${businessName}" responding to a Google review. Write like a human, not a corporation. Casual, warm, and genuine -- like a text from someone who actually cares.

The reviewer gave ${stars} star${stars !== 1 ? "s" : ""}. The requested tone is: ${tone}.

Rules:
- 4-5 star reviews: 50-75 words MAX. Short and grateful.
- 3 star reviews: 60-80 words. Acknowledge the gap, show you care.
- 1-2 star reviews: 75-100 words. Apologize, don't argue, invite them to reach out.
- Never use phrases like "it brings me pride", "means the world", "you deserved", or anything that sounds like a press release
- Never list multiple employee names. If one person is mentioned specifically, you can reference them once naturally. That's it.
- Never start the response with "I"
- Always sound like a real person wrote this at the end of a workday
- Include the business name once, naturally -- don't force it
- For firm tone on unfair reviews: be polite but clear, don't grovel, protect the reputation without being combative
- No em dashes
- Do not use placeholder text like [Name] or [Phone Number] -- write a complete, ready-to-post response
- Do not include a subject line or greeting prefix like "Dear customer" -- start naturally
- Output ONLY the response text, nothing else`;

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
