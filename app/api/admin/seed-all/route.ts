import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAdminToken } from "@/lib/admin-auth";
import { generateSeedLeads } from "@/lib/seed-leads";

function isAuthed(request: NextRequest): boolean {
  const cookie = request.cookies.get("admin_session");
  return cookie?.value === getAdminToken();
}

export async function POST(request: NextRequest) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // Find businesses without demo leads
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name");

  if (!businesses) return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });

  let seeded = 0;
  let skipped = 0;

  for (const biz of businesses) {
    const { count } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", biz.id)
      .eq("is_demo", true);

    if (count && count > 0) { skipped++; continue; }

    // Check if they have real leads (skip those)
    const { count: realCount } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", biz.id)
      .eq("is_demo", false);

    if (realCount && realCount > 0) { skipped++; continue; }

    const rows = generateSeedLeads(biz.id);
    const { error } = await supabase.from("leads").insert(rows);
    if (!error) seeded++;
  }

  return NextResponse.json({ seeded, skipped, total: businesses.length });
}
