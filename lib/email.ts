import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  return new Resend(key);
}

export async function sendMagicLinkEmail(
  to: string,
  token: string,
  businessName: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${baseUrl}/contractor/verify?token=${token}`;

  await getResend().emails.send({
    from: process.env.EMAIL_FROM || "Handled Sites <onboarding@resend.dev>",
    to,
    subject: `Edit your business card — ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
        <p style="font-size: 15px; color: #1a1a1a; margin-bottom: 8px;">Hi,</p>
        <p style="font-size: 15px; color: #1a1a1a; margin-bottom: 24px;">
          Click below to edit your <strong>${businessName}</strong> business card on handled.sites:
        </p>
        <a
          href="${url}"
          style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;"
        >
          Edit My Business Card
        </a>
        <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
          This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 11px; color: #9ca3af;">
          handled.sites — free business cards for home service contractors
        </p>
      </div>
    `,
  });
}
