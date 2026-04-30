import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: { id: string } };

const PATCHABLE_FIELDS = [
  "caption",
  "service_type",
  "is_visible",
  "display_order",
] as const;

export async function PATCH(request: NextRequest, { params }: RouteCtx) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  for (const key of PATCHABLE_FIELDS) {
    if (key in body) updates[key] = body[key];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updatable fields" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("business_gallery_photos")
    .update(updates)
    .eq("id", params.id)
    .eq("business_id", auth.businessId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ photo: data });
}

export async function DELETE(request: NextRequest, { params }: RouteCtx) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // Look up the row first so we can also remove the storage object,
  // and so we enforce ownership via business_id rather than trusting
  // the caller.
  const { data: row, error: fetchError } = await supabase
    .from("business_gallery_photos")
    .select("id, storage_path")
    .eq("id", params.id)
    .eq("business_id", auth.businessId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from("business_gallery_photos")
    .delete()
    .eq("id", row.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Best-effort storage cleanup; row is already gone, so a failure here
  // just leaves an orphan and shouldn't fail the request.
  await supabase.storage.from("gallery-photos").remove([row.storage_path]);

  return NextResponse.json({ ok: true });
}
