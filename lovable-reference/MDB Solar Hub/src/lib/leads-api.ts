import { supabase } from "@/integrations/supabase/client";
import {
  LEADS as DEMO_LEADS,
  type Lead,
  type PipelineStage,
  type ServiceType,
  type Priority,
  type LeadBadge,
  REPS,
} from "@/lib/mdb-data";

// Demo/display lead ids (e.g. "L-1000") are NOT valid Postgres UUIDs and must
// never be sent to the database. Use this helper everywhere a *_id column is
// populated from a UI lead/proposal id.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isDemoId(id: string | null | undefined): boolean {
  if (!id) return false;
  return id.startsWith("L-") || !UUID_RE.test(id);
}
export function toDbUuid(id: string | null | undefined): string | null {
  if (!id) return null;
  return UUID_RE.test(id) ? id : null;
}

export type DbLead = {
  id: string;
  customer_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  service_type: string | null;
  utility_company: string | null;
  monthly_bill: number | null;
  credit_score_range: string | null;
  lead_source: string | null;
  assigned_rep: string | null;
  pipeline_stage: PipelineStage;
  priority: Priority;
  notes: string | null;
  next_follow_up_date: string | null;
  last_contact_date: string | null;
  created_at: string;
  updated_at: string;
};

function deriveBadges(d: DbLead): LeadBadge[] {
  const b: LeadBadge[] = [];
  if (d.priority === "High") b.push("Hot Lead");
  if (d.credit_score_range === "680-739" || d.credit_score_range === "740+") b.push("Credit Ready");
  if (d.pipeline_stage === "Install Scheduled") b.push("Install Risk");
  if (["Installed", "PTO"].includes(d.pipeline_stage)) b.push("Commission Pending");
  return b;
}

export function dbToUi(d: DbLead): Lead {
  return {
    id: d.id,
    name: d.customer_name,
    phone: d.phone ?? "",
    email: d.email ?? "",
    address: d.address ?? "",
    city: d.city ?? "",
    service: (d.service_type as ServiceType) ?? "Solar",
    utility: d.utility_company ?? "FPL",
    bill: Number(d.monthly_bill ?? 0),
    credit: (d.credit_score_range as Lead["credit"]) ?? "600-679",
    source: d.lead_source ?? "Door-to-Door",
    rep: REPS[0],
    stage: d.pipeline_stage,
    nextFollowUp: d.next_follow_up_date ?? "",
    lastContact: d.last_contact_date ?? "",
    notes: d.notes ?? "",
    createdAt: d.created_at.slice(0, 10),
    priority: d.priority,
    badges: deriveBadges(d),
  };
}

export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[leads] fetch failed, using demo:", error.message);
    return DEMO_LEADS;
  }
  if (!data || data.length === 0) return DEMO_LEADS;
  return (data as DbLead[]).map(dbToUi);
}

export async function fetchLeadById(id: string): Promise<Lead | null> {
  // Demo IDs start with "L-"
  if (id.startsWith("L-")) {
    return DEMO_LEADS.find((l) => l.id === id) ?? null;
  }
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return dbToUi(data as DbLead);
}

export async function fetchLeadRaw(id: string): Promise<DbLead | null> {
  if (id.startsWith("L-")) return null;
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as DbLead;
}

export async function updateLeadStage(id: string, stage: PipelineStage): Promise<boolean> {
  if (id.startsWith("L-")) return true; // demo lead, no-op
  const { error } = await supabase.from("leads").update({ pipeline_stage: stage }).eq("id", id);
  if (error) {
    console.error("[leads] stage update failed:", error.message);
    return false;
  }
  await logLeadActivity(id, "stage_changed", `Stage moved to ${stage}`);
  return true;
}

export type NewLeadInput = {
  customer_name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  service_type?: string;
  utility_company?: string;
  monthly_bill?: number;
  credit_score_range?: string;
  lead_source?: string;
  notes?: string;
  priority?: Priority;
  next_follow_up_date?: string;
  assigned_rep_name?: string; // free-text only; not persisted (column is uuid)
};

export async function createLead(input: NewLeadInput): Promise<{ data: DbLead | null; error: string | null }> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;
  // Strip helper-only fields that don't map to a column
  const { assigned_rep_name: _ignored, ...row } = input;
  const { data, error } = await supabase
    .from("leads")
    .insert({
      ...row,
      assigned_rep: userId,
      created_by: userId,
    })
    .select()
    .single();
  if (error) {
    console.error("[leads] create failed:", error.message);
    return { data: null, error: error.message };
  }
  if (data) {
    await logLeadActivity((data as DbLead).id, "lead_created", `Lead created: ${(data as DbLead).customer_name}`);
  }
  return { data: data as DbLead, error: null };
}

export type UpdateLeadInput = Partial<{
  customer_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  service_type: string | null;
  utility_company: string | null;
  monthly_bill: number | null;
  credit_score_range: string | null;
  lead_source: string | null;
  pipeline_stage: PipelineStage;
  priority: Priority;
  notes: string | null;
  next_follow_up_date: string | null;
}>;

export async function updateLead(id: string, patch: UpdateLeadInput): Promise<{ data: DbLead | null; error: string | null }> {
  if (id.startsWith("L-")) {
    return { data: null, error: "Demo leads cannot be edited. Create a real lead first." };
  }
  const { data, error } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("[leads] update failed:", error.message);
    return { data: null, error: error.message };
  }
  await logLeadActivity(id, "lead_updated", `Lead details updated`, { fields: Object.keys(patch) });
  return { data: data as DbLead, error: null };
}

// ----- Activities ---------------------------------------------------------

export type LeadActivity = {
  id: string;
  lead_id: string;
  actor_id: string | null;
  actor_name: string | null;
  activity_type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

async function currentActor(): Promise<{ id: string | null; name: string | null }> {
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) return { id: null, name: null };
  const name = (u.user_metadata?.full_name as string | undefined) ?? u.email ?? null;
  return { id: u.id, name };
}

export async function logLeadActivity(
  leadId: string,
  activity_type: string,
  message: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (leadId.startsWith("L-")) return;
  const actor = await currentActor();
  const { error } = await supabase.from("lead_activities").insert({
    lead_id: leadId,
    actor_id: actor.id,
    actor_name: actor.name,
    activity_type,
    message,
    metadata: (metadata ?? null) as never,
  });
  if (error) console.warn("[activities] insert failed:", error.message);
}

export async function fetchLeadActivities(leadId: string): Promise<LeadActivity[]> {
  if (leadId.startsWith("L-")) return [];
  const { data, error } = await supabase
    .from("lead_activities")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[activities] fetch failed:", error.message);
    return [];
  }
  return (data ?? []) as LeadActivity[];
}

// ----- Notes --------------------------------------------------------------

export type LeadNote = {
  id: string;
  lead_id: string;
  author_id: string | null;
  author_name: string | null;
  body: string;
  created_at: string;
  updated_at: string;
};

export async function fetchLeadNotes(leadId: string): Promise<LeadNote[]> {
  if (leadId.startsWith("L-")) return [];
  const { data, error } = await supabase
    .from("lead_notes")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[notes] fetch failed:", error.message);
    return [];
  }
  return (data ?? []) as LeadNote[];
}

export async function addLeadNote(leadId: string, body: string): Promise<{ data: LeadNote | null; error: string | null }> {
  if (leadId.startsWith("L-")) return { data: null, error: "Demo lead — notes are not persisted." };
  const actor = await currentActor();
  const { data, error } = await supabase
    .from("lead_notes")
    .insert({ lead_id: leadId, author_id: actor.id, author_name: actor.name, body })
    .select()
    .single();
  if (error) return { data: null, error: error.message };
  await logLeadActivity(leadId, "note_added", `Note added`, { preview: body.slice(0, 120) });
  return { data: data as LeadNote, error: null };
}

// ----- Tasks --------------------------------------------------------------

export type LeadTaskRow = {
  id: string;
  lead_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: Priority;
  status: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export type NewTaskInput = {
  title: string;
  description?: string;
  due_date?: string;
  priority?: Priority;
};

export async function fetchLeadTasks(leadId: string): Promise<LeadTaskRow[]> {
  if (leadId.startsWith("L-")) return [];
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("lead_id", leadId)
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) {
    console.warn("[tasks] fetch failed:", error.message);
    return [];
  }
  return (data ?? []) as LeadTaskRow[];
}

export async function createLeadTask(leadId: string, input: NewTaskInput): Promise<{ data: LeadTaskRow | null; error: string | null }> {
  if (leadId.startsWith("L-")) return { data: null, error: "Demo lead — tasks are not persisted." };
  const actor = await currentActor();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      lead_id: leadId,
      title: input.title,
      description: input.description ?? null,
      due_date: input.due_date ?? null,
      priority: input.priority ?? "Medium",
      assigned_to: actor.id,
    })
    .select()
    .single();
  if (error) return { data: null, error: error.message };
  await logLeadActivity(leadId, "task_created", `Task created: ${input.title}`, { due_date: input.due_date });
  return { data: data as LeadTaskRow, error: null };
}

// ----- Documents ----------------------------------------------------------

export type LeadDocument = {
  id: string;
  lead_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_path: string | null;
  file_size: number | null;
  status: string;
  uploaded_by: string | null;
  created_at: string;
};

const DOC_BUCKET = "lead-documents";

export async function fetchLeadDocuments(leadId: string): Promise<LeadDocument[]> {
  if (leadId.startsWith("L-")) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("lead_documents")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[documents] fetch failed:", error.message);
    return [];
  }
  return (data ?? []) as LeadDocument[];
}

export async function uploadLeadDocument(
  leadId: string,
  file: File,
  document_type: string,
): Promise<{ data: LeadDocument | null; error: string | null }> {
  if (leadId.startsWith("L-")) {
    return { data: null, error: "Demo lead — documents are not persisted." };
  }
  const actor = await currentActor();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${leadId}/${Date.now()}-${safeName}`;

  const up = await supabase.storage.from(DOC_BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (up.error) {
    const msg = up.error.message || "";
    if (/bucket.*not.*found/i.test(msg) || /not found/i.test(msg)) {
      return { data: null, error: "Document storage is not configured yet." };
    }
    return { data: null, error: msg };
  }

  const { data: signed } = await supabase.storage
    .from(DOC_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  const file_url = signed?.signedUrl ?? path;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("lead_documents")
    .insert({
      lead_id: leadId,
      document_type,
      file_name: file.name,
      file_url,
      file_path: path,
      file_size: file.size,
      status: "Received",
      uploaded_by: actor.id,
    })
    .select()
    .single();
  if (error) return { data: null, error: error.message };
  await logLeadActivity(leadId, "document_uploaded", `Document uploaded: ${file.name}`, { document_type });
  return { data: data as LeadDocument, error: null };
}