import { NextResponse } from "next/server";
import { getResend } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RECIPIENT = "kyle@gethandled.ai";

const FIELDS: { key: string; label: string; required?: boolean }[] = [
  { key: "name", label: "Your name", required: true },
  { key: "business_name", label: "Business name", required: true },
  { key: "vertical", label: "Vertical", required: true },
  { key: "state", label: "State", required: true },
  { key: "service_area", label: "Service area" },
  { key: "annual_revenue", label: "Annual revenue", required: true },
  { key: "team_size", label: "People in the business", required: true },
  { key: "phone_setup", label: "Current phone setup", required: true },
  { key: "biggest_pain", label: "Biggest thing falling through the cracks" },
  { key: "phone", label: "Phone", required: true },
  { key: "email", label: "Email", required: true },
];

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const values: Record<string, string> = {};
  for (const f of FIELDS) {
    const raw = body[f.key];
    const v = typeof raw === "string" ? raw.trim() : "";
    if (f.required && !v) {
      return NextResponse.json(
        { error: `Missing required field: ${f.label}` },
        { status: 400 }
      );
    }
    values[f.key] = v.slice(0, 4000);
  }

  const subject = `Pilot application — ${values.business_name} (${values.vertical}, ${values.state})`;

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
      <h2 style="font-size: 18px; margin: 0 0 16px;">New pilot application</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        ${FIELDS.map(
          (f) => `
          <tr>
            <td style="padding: 8px 12px 8px 0; color: #6b7280; vertical-align: top; width: 180px;">${escapeHtml(
              f.label
            )}</td>
            <td style="padding: 8px 0; color: #111; white-space: pre-wrap;">${
              escapeHtml(values[f.key]) || '<span style="color:#9ca3af">—</span>'
            }</td>
          </tr>`
        ).join("")}
      </table>
    </div>
  `;

  const text = FIELDS.map((f) => `${f.label}: ${values[f.key] || "—"}`).join("\n");

  try {
    const resend = getResend();
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Handled Pilot <onboarding@resend.dev>",
      to: RECIPIENT,
      replyTo: values.email,
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error("[pilot/apply] email send failed:", err);
    return NextResponse.json(
      { error: "Couldn't send your application. Please email kyle@gethandled.ai directly." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
