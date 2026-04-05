import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const body = await request.json();
  const { businessName, trade, city, state, services, differentiator } = body;

  if (!businessName || !trade) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const servicesText = services?.length > 0 ? `They offer ${services.join(", ")}.` : "";
  const diffText = differentiator?.trim() ? differentiator.trim() : "";

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      system: `Write a 2-3 sentence professional about section for a contractor's website. Keep it warm, confident, and local. No fluff. No em dashes. Write in third person. Output ONLY the bio text.`,
      messages: [
        {
          role: "user",
          content: `Business: ${businessName}, a ${trade} company in ${city}, ${state}. ${servicesText} ${diffText ? `What makes them different: "${diffText}"` : ""}`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    return NextResponse.json({ bio: textBlock?.text || null });
  } catch (err) {
    console.error("Bio generation error:", err);
    return NextResponse.json({ bio: diffText || null });
  }
}
