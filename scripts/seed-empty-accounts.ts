/**
 * One-time script: seed demo leads for every business that currently has zero leads.
 *
 * Usage:
 *   npx tsx scripts/seed-empty-accounts.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment
 * (loaded automatically from .env.local via tsx).
 */

import { createClient } from "@supabase/supabase-js";
import { generateSeedLeads } from "../lib/seed-leads";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  // Get all businesses
  const { data: businesses, error: bizErr } = await supabase
    .from("businesses")
    .select("id, name");

  if (bizErr) {
    console.error("Failed to fetch businesses:", bizErr.message);
    process.exit(1);
  }

  if (!businesses || businesses.length === 0) {
    console.log("No businesses found.");
    return;
  }

  let seededCount = 0;

  for (const biz of businesses) {
    // Check if this business has any leads at all
    const { count } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", biz.id);

    if (count && count > 0) {
      console.log(`  Skipping "${biz.name}" — already has ${count} leads`);
      continue;
    }

    const rows = generateSeedLeads(biz.id);
    const { error } = await supabase.from("leads").insert(rows);

    if (error) {
      console.error(`  Error seeding "${biz.name}":`, error.message);
      continue;
    }

    console.log(`  Seeded "${biz.name}" with ${rows.length} demo leads`);
    seededCount++;
  }

  console.log(`\nDone. Seeded ${seededCount} of ${businesses.length} accounts.`);
}

main();
