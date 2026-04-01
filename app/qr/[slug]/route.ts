import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("contractor_sites")
    .select("slug, qr_redirect_url")
    .eq("slug", params.slug)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const destination = data.qr_redirect_url || `/${data.slug}`;
  return NextResponse.redirect(new URL(destination, request.url));
}
