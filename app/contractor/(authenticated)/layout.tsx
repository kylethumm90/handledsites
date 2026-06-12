import { validateSessionFromCookie } from "@/lib/contractor-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import ContractorShell from "./ContractorShell";

export const dynamic = "force-dynamic";

export default async function ContractorAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await validateSessionFromCookie();

  let businessName: string | null = null;
  let ownerName: string | null = null;
  let logoUrl: string | null = null;

  if (auth) {
    const supabase = getSupabaseAdmin();
    const { data: business } = await supabase
      .from("businesses")
      .select("name, owner_name, logo_url")
      .eq("id", auth.businessId)
      .single();
    businessName = business?.name ?? null;
    ownerName = business?.owner_name ?? null;
    logoUrl = business?.logo_url ?? null;
  }

  return (
    <ContractorShell
      businessName={businessName}
      ownerName={ownerName}
      logoUrl={logoUrl}
    >
      {children}
    </ContractorShell>
  );
}
