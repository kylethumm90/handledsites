/**
 * One-time script to push all existing businesses with emails to Resend contacts.
 *
 * Usage: npx tsx scripts/sync-resend-contacts.ts
 *
 * Required env vars: RESEND_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !supabaseKey || !resendKey) {
    console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const resend = new Resend(resendKey);

  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("id, name, owner_name, email, phone, city, state, trade")
    .not("email", "is", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch businesses:", error.message);
    process.exit(1);
  }

  console.log(`Found ${businesses.length} businesses with emails`);

  let success = 0;
  let skipped = 0;

  for (const biz of businesses) {
    if (!biz.email) continue;

    const [firstName, ...rest] = (biz.owner_name || "").split(" ");
    const lastName = rest.join(" ");

    try {
      await resend.contacts.create({
        email: biz.email,
        firstName: firstName || biz.name,
        lastName: lastName || "",
        properties: {
          business_name: biz.name || "",
          phone: biz.phone || "",
          city: biz.city || "",
          state: biz.state || "",
          trade: biz.trade || "",
        },
      });
      success++;
      console.log(`✓ ${biz.email} (${biz.name})`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already exists")) {
        skipped++;
        console.log(`– ${biz.email} (already exists)`);
      } else {
        console.error(`✗ ${biz.email}: ${msg}`);
      }
    }
  }

  console.log(`\nDone: ${success} added, ${skipped} already existed, ${businesses.length - success - skipped} failed`);
}

main();
