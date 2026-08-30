-- Seed the default email template for the negative_feedback trigger.
--
-- fireEmailTrigger() early-returns when no enabled email_templates row
-- matches the trigger type, so without this row the negative-feedback alert
-- wired into app/api/review/submit/route.ts compiles and runs but silently
-- sends nothing. This is the row that makes the recovery alert real.
--
-- Idempotent: only inserts when no row for this trigger_type exists yet, so
-- re-running the migration (or running it after a manual admin-created row)
-- is a no-op. Columns match email_templates as used by
-- app/api/admin/email-templates/route.ts: name, subject, body_html,
-- trigger_type, is_enabled.
--
-- Available template variables (see lib/email-automation.ts): business_name,
-- owner_name, plus event values from the submit route: rating,
-- sentiment_score, feedback_text, tech_name, customer_name, customer_phone,
-- submitted_at, highlights, customer_url.

INSERT INTO public.email_templates (name, subject, body_html, trigger_type, is_enabled)
SELECT
  'Negative Feedback Alert',
  'New {{rating}}-star feedback for {{business_name}} from {{customer_name}}',
  '<div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">'
    || '<p style="font-size: 14px; color: #6B7280; margin: 0 0 16px;">A customer rated their experience {{rating}} out of 5. Read what they wrote and follow up.</p>'
    || '<div style="border-left: 3px solid #EF4444; background: #FEF2F2; padding: 16px 18px; border-radius: 6px; margin: 0 0 20px;">'
    || '<p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #991B1B; margin: 0 0 8px;">What they said</p>'
    || '<p style="font-size: 16px; line-height: 1.5; color: #111827; margin: 0; white-space: pre-wrap;">{{feedback_text}}</p>'
    || '</div>'
    || '<table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #111827;">'
    || '<tr><td style="padding: 6px 0; color: #6B7280; width: 140px;">Rating</td><td style="padding: 6px 0;">{{rating}} / 5</td></tr>'
    || '<tr><td style="padding: 6px 0; color: #6B7280;">Sentiment score</td><td style="padding: 6px 0;">{{sentiment_score}}</td></tr>'
    || '<tr><td style="padding: 6px 0; color: #6B7280;">Highlights</td><td style="padding: 6px 0;">{{highlights}}</td></tr>'
    || '<tr><td style="padding: 6px 0; color: #6B7280;">Technician</td><td style="padding: 6px 0;">{{tech_name}}</td></tr>'
    || '<tr><td style="padding: 6px 0; color: #6B7280;">Customer</td><td style="padding: 6px 0;">{{customer_name}}</td></tr>'
    || '<tr><td style="padding: 6px 0; color: #6B7280;">Phone</td><td style="padding: 6px 0;">{{customer_phone}}</td></tr>'
    || '<tr><td style="padding: 6px 0; color: #6B7280;">Submitted</td><td style="padding: 6px 0;">{{submitted_at}}</td></tr>'
    || '</table>'
    || '<p style="margin: 24px 0 0;"><a href="{{customer_url}}" style="display: inline-block; background: #111827; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; padding: 10px 18px; border-radius: 8px;">View customer record</a></p>'
    || '</div>',
  'negative_feedback',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_templates WHERE trigger_type = 'negative_feedback'
);
