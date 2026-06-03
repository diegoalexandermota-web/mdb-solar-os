import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Phone, Mail, MapPin, Zap, DollarSign, CreditCard, User, Calendar,
  ArrowLeft, MessageSquare, Sparkles, ChevronRight,
  PhoneCall, MessageCircle, Send, CalendarPlus, FilePlus,
  CheckCircle2, Clock, FileSignature, Upload, AlertTriangle, Pencil, Loader2,
} from "lucide-react";
import { PageHeader, StageBadge, ServicePill } from "@/components/page-header";
import { BadgeChip } from "@/components/badge-chip";
import { LEADS, PIPELINE_STAGES, fmtCurrency, docsFor, type Lead, type Priority } from "@/lib/mdb-data";
import {
  fetchLeadById, fetchLeadRaw, fetchLeadActivities, fetchLeadNotes, addLeadNote, updateLead,
  fetchLeadTasks, createLeadTask,
  fetchLeadDocuments,
  type LeadActivity, type LeadNote, type LeadTaskRow,
  type LeadDocument,
} from "@/lib/leads-api";
import { EditLeadDialog } from "@/components/edit-lead-dialog";
import { ScheduleDialog } from "@/components/schedule-dialog";
import { UploadDocumentDialog } from "@/components/upload-document-dialog";
import { SolarDesignerDialog } from "@/components/solar-designer-dialog";
import { VisualSolarPreviewDialog } from "@/components/visual-solar-preview-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { telHref, smsHref, waHref, mailHref, openExternal, copyToClipboard, comingSoon } from "@/lib/actions";

export const Route = createFileRoute("/_app/leads/$leadId")({
  head: () => ({ meta: [{ title: "Lead — MDB Solar OS" }] }),
  component: LeadDetail,
  notFoundComponent: () => (
    <div className="p-12 text-center text-muted-foreground">Lead not found or no longer available.</div>
  ),
});

function LeadDetail() {
  const { leadId } = Route.useParams();
  const [lead, setLead] = useState<Lead | null>(() => LEADS.find((l) => l.id === leadId) ?? null);
  const [loading, setLoading] = useState(!lead);
  const [notFound, setNotFound] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [tasks, setTasks] = useState<LeadTaskRow[]>([]);
  const [documents, setDocuments] = useState<LeadDocument[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [visualOpen, setVisualOpen] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const reload = useCallback(async () => {
    const l = await fetchLeadById(leadId);
    if (!l) { setNotFound(true); setLoading(false); return; }
    setLead(l); setNotFound(false); setLoading(false);
    const [raw, acts, nts, tks, docs] = await Promise.all([
      fetchLeadRaw(leadId),
      fetchLeadActivities(leadId),
      fetchLeadNotes(leadId),
      fetchLeadTasks(leadId),
      fetchLeadDocuments(leadId),
    ]);
    if (raw) setUpdatedAt(raw.updated_at);
    setActivities(acts);
    setNotes(nts);
    setTasks(tks);
    setDocuments(docs);
  }, [leadId]);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  async function advanceStage() {
    if (!lead) return;
    const idx = PIPELINE_STAGES.indexOf(lead.stage);
    if (idx < 0 || idx >= PIPELINE_STAGES.length - 1) {
      toast("Already at final stage.");
      return;
    }
    const next = PIPELINE_STAGES[idx + 1];
    setAdvancing(true);
    const { error } = await updateLead(lead.id, { pipeline_stage: next });
    setAdvancing(false);
    if (error) { toast.error("Couldn't advance stage", { description: error }); return; }
    toast.success(`Lead advanced to ${next}.`);
    window.dispatchEvent(new CustomEvent("leads:changed"));
    reload();
  }

  const waDraft = lead ? `Hi ${lead.name.split(" ")[0]}, Diego from MDB Solar. Quick follow-up on your ${lead.utility} bill — got a minute?` : "";

  if (loading && !lead) {
    return <div className="p-12 text-center text-muted-foreground">Loading lead…</div>;
  }
  if (notFound || !lead) {
    return (
      <div className="p-12 text-center space-y-3">
        <div className="text-muted-foreground">Lead not found or no longer available.</div>
        <Link to="/pipeline" className="text-primary text-sm hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="size-3.5" /> Back to pipeline
        </Link>
      </div>
    );
  }

  const stageIdx = PIPELINE_STAGES.indexOf(lead.stage);
  const docs = docsFor(lead.id);
  const systemKw = +(lead.bill / 35).toFixed(1);
  const panels = Math.round(lead.bill / 14);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <Link to="/pipeline" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-3.5" /> Back to pipeline
      </Link>

      <PageHeader
        eyebrow={`Lead · ${lead.id} · ${lead.priority} priority`}
        title={lead.name}
        subtitle={lead.address}
        actions={
          <>
            <HeaderBtn
              icon={PhoneCall} label="Call"
              onClick={() => lead.phone ? openExternal(telHref(lead.phone)) : toast.error("No phone number on this lead.")}
            />
            <HeaderBtn
              icon={MessageCircle} label="SMS"
              onClick={() => lead.phone ? openExternal(smsHref(lead.phone)) : toast.error("No phone number on this lead.")}
            />
            <HeaderBtn
              icon={MessageSquare} label="WhatsApp"
              onClick={() => lead.phone ? openExternal(waHref(lead.phone, waDraft)) : toast.error("No phone number on this lead.")}
            />
            <HeaderBtn
              icon={Send} label="Email"
              onClick={() => lead.email ? openExternal(mailHref(lead.email, "MDB Solar follow-up")) : toast.error("No email on this lead.")}
            />
            <HeaderBtn icon={CalendarPlus} label="Schedule" onClick={() => setScheduleOpen(true)} />
            <button
              onClick={() => setAiOpen(true)}
              className="inline-flex items-center gap-1.5 bg-card border border-border hover:bg-secondary hover:border-primary/40 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Sparkles className="size-4 text-primary" /> AI Solar Designer
            </button>
            <button
              onClick={() => setVisualOpen(true)}
              className="inline-flex items-center gap-1.5 bg-card border border-border hover:bg-secondary hover:border-primary/40 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Sparkles className="size-4 text-primary" /> AI Visual Preview
            </button>
            <button
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1.5 bg-card border border-border hover:bg-secondary hover:border-primary/40 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Pencil className="size-4 text-primary" /> Edit Lead
            </button>
            <Link
              to="/proposals"
              search={{ lead_id: lead.id }}
              className="inline-flex items-center gap-1.5 bg-gold text-gold-foreground hover:opacity-90 px-3 py-2 rounded-md text-sm font-semibold"
            >
              <FilePlus className="size-4" /> Create Proposal
            </Link>
            <button
              onClick={advanceStage}
              disabled={advancing}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md text-sm font-medium disabled:opacity-60"
            >
              {advancing ? <Loader2 className="size-4 animate-spin" /> : <>Advance stage <ChevronRight className="size-4" /></>}
            </button>
          </>
        }
      />

      <div className="flex items-center gap-2 flex-wrap">
        <StageBadge stage={lead.stage} />
        <ServicePill service={lead.service} />
        {lead.badges.map((b: import("@/lib/mdb-data").LeadBadge) => <BadgeChip key={b} badge={b} />)}
        <span className="text-xs text-muted-foreground ml-2">Source: <span className="text-foreground font-medium">{lead.source}</span></span>
        <span className="text-xs text-muted-foreground">· Rep: <span className="text-foreground font-medium">{lead.rep}</span></span>
        {updatedAt && (
          <span className="text-xs text-muted-foreground ml-auto">
            Last updated: <span className="text-foreground font-medium">{new Date(updatedAt).toLocaleString()}</span>
          </span>
        )}
      </div>

      {/* Stage tracker */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-card overflow-x-auto">
        <div className="flex items-center min-w-max gap-1.5">
          {PIPELINE_STAGES.map((s, i) => {
            const active = i <= stageIdx;
            const current = i === stageIdx;
            return (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`size-7 rounded-full grid place-items-center text-[10px] font-bold ${current ? "bg-gold text-gold-foreground ring-4 ring-gold/25" : active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                    {i + 1}
                  </div>
                  <div className={`text-[10px] mt-1.5 whitespace-nowrap font-medium ${current ? "text-foreground" : "text-muted-foreground"}`}>{s}</div>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <div className={`h-0.5 w-10 mb-5 ${i < stageIdx ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer + property */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-card">
            <h3 className="font-semibold text-foreground mb-4">Customer profile</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: User, label: "Customer name", val: lead.name },
                { icon: Phone, label: "Phone", val: lead.phone },
                { icon: Mail, label: "Email", val: lead.email },
                { icon: MapPin, label: "Address", val: lead.address },
                { icon: Zap, label: "Service type", val: lead.service },
                { icon: User, label: "Utility company", val: lead.utility },
                { icon: DollarSign, label: "Monthly bill", val: fmtCurrency(lead.bill) },
                { icon: CreditCard, label: "Credit score range", val: lead.credit },
                { icon: User, label: "Lead source", val: lead.source },
                { icon: User, label: "Assigned rep", val: lead.rep },
                { icon: Calendar, label: "Pipeline stage", val: lead.stage },
                { icon: Calendar, label: "Next follow-up", val: lead.nextFollowUp },
              ].map((f) => (
                <div key={f.label} className="flex items-start gap-3">
                  <div className="size-9 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                    <f.icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{f.label}</div>
                    <div className="text-sm font-medium text-foreground truncate">{f.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <NotesSection
            leadId={lead.id}
            seedNote={lead.notes}
            notes={notes}
            onAdded={reload}
          />

          {/* Timeline */}
          <ActivityTimeline activities={activities} />

          {/* Tasks + Documents two-col */}
          <div className="grid sm:grid-cols-2 gap-6">
            <TasksSection leadId={lead.id} tasks={tasks} onChanged={reload} />

            <div className="bg-card border border-border rounded-xl p-6 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Documents</h3>
                <button
                  onClick={() => setUploadOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Upload className="size-3" /> Upload
                </button>
              </div>
              <div className="space-y-2">
                {documents.length === 0 ? (
                  docs.map((d) => (
                    <div key={d.id} className="flex items-center gap-2.5 p-2.5 rounded-md bg-secondary/40 border border-border">
                      <FileSignature className="size-3.5 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-foreground truncate">{d.name}</div>
                        <div className="text-[10px] text-muted-foreground">{d.size}</div>
                      </div>
                      <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${d.status === "Signed" ? "bg-success/15 text-success" : d.status === "Received" ? "bg-primary/10 text-primary" : "bg-warning/25 text-navy"}`}>
                        {d.status}
                      </span>
                    </div>
                  ))
                ) : (
                  documents.map((d) => (
                    <a
                      key={d.id}
                      href={d.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-2.5 rounded-md bg-secondary/40 border border-border hover:border-primary/40 transition-colors"
                    >
                      <FileSignature className="size-3.5 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-foreground truncate">{d.file_name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {d.document_type}{d.file_size ? ` · ${(d.file_size / 1024).toFixed(0)} KB` : ""}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        {d.status}
                      </span>
                    </a>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Proposal summary */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Proposal summary</h3>
              <Link to="/proposals" className="text-xs font-medium text-primary hover:underline">Open builder →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <PStat label="System size" val={`${systemKw} kW`} />
              <PStat label="Panel count" val={`${panels} × 410W`} />
              <PStat label="Est. payment" val={`${fmtCurrency(Math.round(lead.bill * 0.62))}/mo`} />
              <PStat label="Est. savings" val={`${fmtCurrency(Math.round(lead.bill * 0.38))}/mo`} highlight />
            </div>
            <div className="mt-4 text-[11px] text-muted-foreground italic">
              Uses MDB estimate assumptions. Final proposal must be verified before contract.
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="size-4 text-gold" />
              <div className="text-xs uppercase tracking-widest font-semibold opacity-80">MDB AI · Next-best action</div>
            </div>
            <p className="text-sm leading-relaxed">
              Send a WhatsApp recap and book a 6:30pm virtual review tomorrow with both spouses. Lead with the locked-rate vs {lead.utility} comparison — they're 2.4x more likely to close on a Tue/Wed evening slot.
            </p>
            <button
              onClick={() => {
                if (lead.phone) openExternal(waHref(lead.phone, waDraft));
                else copyToClipboard(waDraft, "Draft copied to clipboard.");
              }}
              className="mt-4 w-full bg-gold text-gold-foreground hover:opacity-90 py-2 rounded-md text-sm font-semibold"
            >
              Draft WhatsApp message
            </button>
            <button
              onClick={() => copyToClipboard(waDraft)}
              className="mt-2 w-full bg-card/10 hover:bg-card/20 py-1.5 rounded-md text-xs font-medium border border-white/20"
            >
              Copy Message
            </button>
          </div>

          {lead.badges.includes("Install Risk") || lead.badges.includes("Missing Documents") ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="size-4 text-destructive" />
                <div className="text-xs font-bold uppercase tracking-wide text-destructive">Risk warning</div>
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                {lead.badges.includes("Missing Documents") ? "Missing income verification — block before NTP. " : ""}
                {lead.badges.includes("Install Risk") ? "Polk County permit backlog at 14 days; pre-stage materials." : ""}
              </p>
            </div>
          ) : null}

          <div className="bg-card border border-border rounded-xl p-5 shadow-card">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 className="size-4 text-success" /> System estimate
            </h4>
            <div className="space-y-2 text-xs">
              <Row label="System size" val={`${systemKw} kW`} />
              <Row label="Estimated panels" val={`${panels} × 410W`} />
              <Row label="Est. monthly payment" val={fmtCurrency(Math.round(lead.bill * 0.62))} />
              <Row label="Est. monthly savings" val={fmtCurrency(Math.round(lead.bill * 0.38))} highlight />
              <Row label="25-yr lifetime savings" val={fmtCurrency(Math.round(lead.bill * 0.38 * 12 * 25))} highlight />
            </div>
          </div>
        </div>
      </div>

      <EditLeadDialog open={editOpen} onOpenChange={setEditOpen} lead={lead} onSaved={reload} />
      <ScheduleDialog open={scheduleOpen} onOpenChange={setScheduleOpen} leadId={lead.id} leadName={lead.name} onScheduled={reload} />
      <UploadDocumentDialog open={uploadOpen} onOpenChange={setUploadOpen} leadId={lead.id} onUploaded={reload} />
      <SolarDesignerDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        leadId={lead.id}
        defaults={{ customer_name: lead.name, address: lead.address, utility_company: lead.utility, monthly_bill: lead.bill }}
        onSaved={reload}
      />
      <VisualSolarPreviewDialog
        open={visualOpen}
        onOpenChange={setVisualOpen}
        leadId={lead.id}
        defaults={{ address: lead.address, customer_name: lead.name }}
      />
    </div>
  );
}

function HeaderBtn({ icon: Icon, label, onClick }: { icon: typeof PhoneCall; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 bg-card border border-border hover:bg-secondary hover:border-primary/40 px-3 py-2 rounded-md text-sm font-medium transition-colors"
    >
      <Icon className="size-4 text-primary" /> {label}
    </button>
  );
}

function Row({ label, val, highlight }: { label: string; val: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${highlight ? "text-success" : "text-foreground"}`}>{val}</span>
    </div>
  );
}
function PStat({ label, val, highlight }: { label: string; val: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 border ${highlight ? "border-gold/40 bg-gold/10" : "border-border bg-secondary/40"}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-base font-bold text-foreground mt-0.5">{val}</div>
    </div>
  );
}

function NotesSection({ leadId, seedNote, notes, onAdded }: {
  leadId: string; seedNote: string; notes: LeadNote[]; onAdded: () => void;
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setSaving(true);
    const { error } = await addLeadNote(leadId, trimmed);
    setSaving(false);
    if (error) { toast.error("Couldn't save note", { description: error }); return; }
    toast.success("Note added");
    setBody("");
    onAdded();
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">Notes</h3>
        <span className="text-[11px] text-muted-foreground">{notes.length} note{notes.length === 1 ? "" : "s"}</span>
      </div>
      <div className="space-y-2 mb-3">
        <Textarea
          rows={2}
          placeholder="Add a note about this lead…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={save} disabled={saving || !body.trim()}>
            {saving && <Loader2 className="size-3.5 animate-spin mr-1.5" />} Save note
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {notes.map((n) => (
          <div key={n.id} className="rounded-lg bg-secondary/60 border border-border p-3 text-sm text-foreground whitespace-pre-wrap">
            {n.body}
            <div className="text-[10px] text-muted-foreground mt-2">
              {n.author_name ?? "User"} · {new Date(n.created_at).toLocaleString()}
            </div>
          </div>
        ))}
        {notes.length === 0 && seedNote && (
          <div className="rounded-lg bg-secondary/40 border border-border p-3 text-sm text-foreground">
            {seedNote}
            <div className="text-[10px] text-muted-foreground mt-2">From lead record</div>
          </div>
        )}
        {notes.length === 0 && !seedNote && (
          <div className="text-xs text-muted-foreground text-center py-4">No notes yet.</div>
        )}
      </div>
    </div>
  );
}

function ActivityTimeline({ activities }: { activities: LeadActivity[] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-card">
      <h3 className="font-semibold text-foreground mb-4">Activity timeline</h3>
      {activities.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-4">No activity yet.</div>
      ) : (
        <ol className="relative border-l-2 border-border ml-2 space-y-4">
          {activities.map((e) => (
            <li key={e.id} className="ml-4 relative">
              <div className="absolute -left-[22px] top-1.5 size-3 rounded-full bg-primary ring-4 ring-card" />
              <div className="text-sm text-foreground">{e.message}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {e.actor_name ?? "System"} · {new Date(e.created_at).toLocaleString()} ·{" "}
                <span className="uppercase font-semibold tracking-wide text-primary">{e.activity_type.replace(/_/g, " ")}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function TasksSection({ leadId, tasks, onChanged }: {
  leadId: string; tasks: LeadTaskRow[]; onChanged: () => void;
}) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    const { error } = await createLeadTask(leadId, {
      title: title.trim(),
      due_date: due || undefined,
      priority,
    });
    setSaving(false);
    if (error) { toast.error("Couldn't create task", { description: error }); return; }
    toast.success("Task created");
    setTitle(""); setDue(""); setPriority("Medium"); setOpen(false);
    onChanged();
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">Tasks</h3>
        <button onClick={() => setOpen((v) => !v)} className="text-xs font-medium text-primary hover:underline">
          {open ? "Cancel" : "+ Add task"}
        </button>
      </div>
      {open && (
        <div className="space-y-2 mb-3 p-3 rounded-lg border border-border bg-secondary/40">
          <div className="space-y-1">
            <Label className="text-[11px]">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Call to confirm appointment" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px]">Due date</Label>
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Low", "Medium", "High"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={save} disabled={saving || !title.trim()}>
              {saving && <Loader2 className="size-3.5 animate-spin mr-1.5" />} Create task
            </Button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {tasks.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-4">No tasks for this lead.</div>
        )}
        {tasks.map((t) => (
          <div key={t.id} className="flex items-start gap-2.5 p-2.5 rounded-md bg-secondary/40 border border-border">
            <Clock className="size-3.5 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm text-foreground">{t.title}</div>
              <div className="text-[10px] text-muted-foreground">
                {t.due_date ? `Due ${t.due_date}` : "No due date"} · {t.priority} · {t.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}