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

  let body: { name: string; city: string; state: string; trade: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, city, state, trade } = body;

  if (!name || !city || !state || !trade) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const systemPrompt =
    "You are evaluating whether AI assistants can find and recommend a local business. Be direct and honest. If you don't know the business, say so clearly. Keep response under 120 words. Do not use em dashes. Write in a friendly, plain tone.";

  const userMessage = `A homeowner asked: "Can you recommend a good ${trade.toLowerCase()} company in ${city}, ${state}? What about ${name}?" Respond naturally. If you don't know this specific business, be honest.`;

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const text = textBlock && textBlock.type === "text" ? textBlock.text : "";

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Anthropic API error:", err);
    return NextResponse.json(
      { error: "Failed to run visibility scan." },
      { status: 500 }
    );
  }
}
