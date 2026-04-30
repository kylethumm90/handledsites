import { redirect } from "next/navigation";
import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import GalleryClient, { type GalleryPhoto } from "./GalleryClient";

export const dynamic = "force-dynamic";

export default async function ContractorGalleryPage() {
  const auth = await validateSessionFromCookie();
  if (!auth) redirect("/contractor/login");

  const supabase = getSupabaseAdmin();

  const [{ data: photos }, { data: business }] = await Promise.all([
    supabase
      .from("business_gallery_photos")
      .select("*")
      .eq("business_id", auth.businessId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("businesses")
      .select("services")
      .eq("id", auth.businessId)
      .single(),
  ]);

  const services: string[] = Array.isArray(business?.services)
    ? business!.services
    : [];

  return (
    <GalleryClient
      initialPhotos={(photos || []) as GalleryPhoto[]}
      services={services}
    />
  );
}
