import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { businessId } = auth;

  const supabase = getSupabaseAdmin();

  // Verify lead belongs to this business and grab the assigned employee so
  // we can enrich the summary with the rep's first name.
  const { data: lead } = await supabase
    .from("leads")
    .select("id, employee_id")
    .eq("id", params.id)
    .eq("business_id", businessId)
    .single();

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  let empFirstName: string | null = null;
  if (lead.employee_id) {
    const { data: emp } = await supabase
      .from("employees")
      .select("name")
      .eq("id", lead.employee_id)
      .eq("business_id", businessId)
      .single();
    if (emp?.name) empFirstName = emp.name.split(" ")[0] || null;
  }

  const { data: entry, error } = await supabase
    .from("activity_log")
    .insert({
      business_id: businessId,
      lead_id: params.id,
      type: "review_request_sent",
      summary: empFirstName ? `Review request sent (${empFirstName})` : "Review request sent",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ entry });
}
