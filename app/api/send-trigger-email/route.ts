import { NextRequest, NextResponse } from "next/server";
import { fireEmailTrigger } from "@/lib/email-automation";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { trigger_type, business_id } = body;

  if (!trigger_type || !business_id) {
    return NextResponse.json({ error: "trigger_type and business_id required" }, { status: 400 });
  }

  try {
    await fireEmailTrigger(trigger_type, business_id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
