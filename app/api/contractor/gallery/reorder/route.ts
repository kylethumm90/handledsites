import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReorderItem = { id: string; display_order: number };

export async function POST(request: NextRequest) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { items?: ReorderItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items required" }, { status: 400 });
  }

  for (const item of items) {
    if (
      typeof item.id !== "string" ||
      typeof item.display_order !== "number" ||
      !Number.isInteger(item.display_order)
    ) {
      return NextResponse.json({ error: "Invalid item shape" }, { status: 400 });
    }
  }

  const supabase = getSupabaseAdmin();

  // Update one at a time, scoped by business_id so a caller can't
  // reorder rows they don't own. Volume here is tiny (a few dozen
  // photos), so the round-trip cost is negligible.
  const results = await Promise.all(
    items.map((item) =>
      supabase
        .from("business_gallery_photos")
        .update({ display_order: item.display_order })
        .eq("id", item.id)
        .eq("business_id", auth.businessId)
    )
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
