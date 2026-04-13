import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

function generateCode(): string {
  return crypto.randomBytes(4).toString("hex"); // 8 char hex
}

/**
 * Generate a referral code that does not collide with any existing row in
 * the `referral_partners` table. Retries up to 5 times.
 */
export async function generateUniqueReferralCode(supabase: SupabaseClient): Promise<string> {
  let code = generateCode();
  let attempts = 0;
  while (attempts < 5) {
    const { data: collision } = await supabase
      .from("referral_partners")
      .select("id")
      .eq("referral_code", code)
      .single();

    if (!collision) return code;
    code = generateCode();
    attempts++;
  }
  return code;
}
