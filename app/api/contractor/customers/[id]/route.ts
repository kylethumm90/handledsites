import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { businessId } = auth;

  const supabase = getSupabaseAdmin();

  // Verify lead belongs to this business
  const { data: lead } = await supabase
    .from("leads")
    .select("id, status, business_id, employee_id")
    .eq("id", params.id)
    .eq("business_id", businessId)
    .single();

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const body = await request.json();

  const ALLOWED = new Set(["status", "service_needed", "notes", "tags", "employee_id"]);
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED.has(key)) updates[key] = value;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { error } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Log status change
  if (updates.status && updates.status !== lead.status) {
    await supabase.from("activity_log").insert({
      business_id: businessId,
      lead_id: params.id,
      type: "status_change",
      summary: `Status changed to ${updates.status}`,
    });
  }

  // Log employee (re)assignment. "employee_id" in updates can be a string or
  // null (unassign); we only log when the value actually changed.
  if (
    Object.prototype.hasOwnProperty.call(updates, "employee_id") &&
    updates.employee_id !== lead.employee_id
  ) {
    const newEmpId = updates.employee_id as string | null;
    let summary = "Unassigned";
    if (newEmpId) {
      const { data: emp } = await supabase
        .from("employees")
        .select("name")
        .eq("id", newEmpId)
        .eq("business_id", businessId)
        .single();
      const firstName = emp?.name?.split(" ")[0] || null;
      summary = firstName ? `Assigned to ${firstName}` : "Assigned to rep";
    }
    await supabase.from("activity_log").insert({
      business_id: businessId,
      lead_id: params.id,
      type: "employee_assigned",
      summary,
    });
  }

  return NextResponse.json({ success: true });
}
