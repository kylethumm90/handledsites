import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const MAX_BYTES = 15 * 1024 * 1024;
const LONG_EDGE = 2000;
const JPEG_QUALITY = 82;

export async function POST(request: NextRequest) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Determine the next display_order so newly uploaded photos land at the end.
  const { data: lastRow } = await supabase
    .from("business_gallery_photos")
    .select("display_order")
    .eq("business_id", auth.businessId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  let nextOrder = (lastRow?.display_order ?? -1) + 1;

  const created: unknown[] = [];
  const errors: { name: string; error: string }[] = [];

  for (const file of files) {
    try {
      if (!ALLOWED_MIME.has(file.type)) {
        errors.push({ name: file.name, error: "Unsupported file type" });
        continue;
      }
      if (file.size > MAX_BYTES) {
        errors.push({ name: file.name, error: "File too large (max 15MB)" });
        continue;
      }

      const inputBuffer = Buffer.from(await file.arrayBuffer());

      // Re-encode through sharp:
      //   - rotate() honors EXIF orientation, then withMetadata({exif: {}})
      //     drops the rest of the metadata (location, camera info).
      //   - resize with `inside` keeps aspect ratio inside the long edge.
      //   - JPEG output normalizes HEIC/PNG/WebP to a single served format.
      const pipeline = sharp(inputBuffer, { failOn: "none" })
        .rotate()
        .resize({
          width: LONG_EDGE,
          height: LONG_EDGE,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .withMetadata({ exif: {} });

      const { data: outputBuffer, info } = await pipeline.toBuffer({
        resolveWithObject: true,
      });

      const fileId = randomUUID();
      const storagePath = `${auth.businessId}/${fileId}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("gallery-photos")
        .upload(storagePath, outputBuffer, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        errors.push({ name: file.name, error: uploadError.message });
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("gallery-photos")
        .getPublicUrl(storagePath);

      const { data: row, error: insertError } = await supabase
        .from("business_gallery_photos")
        .insert({
          business_id: auth.businessId,
          storage_path: storagePath,
          public_url: urlData.publicUrl,
          width: info.width ?? null,
          height: info.height ?? null,
          display_order: nextOrder++,
        })
        .select()
        .single();

      if (insertError || !row) {
        // Clean up the orphaned storage object so we don't leak.
        await supabase.storage.from("gallery-photos").remove([storagePath]);
        errors.push({
          name: file.name,
          error: insertError?.message || "Insert failed",
        });
        continue;
      }

      created.push(row);
    } catch (err) {
      errors.push({
        name: file.name,
        error: err instanceof Error ? err.message : "Processing failed",
      });
    }
  }

  return NextResponse.json({ created, errors });
}
