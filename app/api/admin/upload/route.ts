import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const storagePath = formData.get("storagePath") as string | null;

  if (!file || !storagePath) {
    return NextResponse.json({ error: "Missing file or storagePath" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 2MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "png";
  const path = `${storagePath}.${ext}`;
  const supabase = getSupabaseAdmin();

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("contractor-assets")
    .upload(path, buffer, {
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("contractor-assets")
    .getPublicUrl(path);

  return NextResponse.json({ url: `${urlData.publicUrl}?t=${Date.now()}` });
}
