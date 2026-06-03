import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search, Filter, Phone, Mail, MessageCircle, MessageSquare,
  ExternalLink, FileText, Flame, Clock, ShieldCheck, FileWarning,
  AlertTriangle, DollarSign, Users, User, X, Sun, Sparkles,
} from "lucide-react";
import { PageHeader, ServicePill } from "@/components/page-header";
import { BadgeChip } from "@/components/badge-chip";
import {
  LEADS, PIPELINE_STAGES, REPS, UTILITIES, CITIES,
  type Lead, type PipelineStage, fmtCurrency,
} from "@/lib/mdb-data";
import { fetchLeads, updateLeadStage } from "@/lib/leads-api";
import { telHref, smsHref, waHref, mailHref, openExternal, comingSoon } from "@/lib/actions";
import { SolarDesignerDialog } from "@/components/solar-designer-dialog";

export const Route = createFileRoute("/_app/pipeline")({
  head: () => ({ meta: [{ title: "Pipeline — MDB Solar OS" }] }),
  component: Pipeline,
});

const ME = "Diego Mota";
const SERVICES = ["Solar", "Water", "Roofing", "HVAC", "Battery", "EV Charger"];
const CREDITS = ["500-599", "600-679", "680-739", "740+"];
const PRIORITIES = ["High", "Medium", "Low"];

// Per-stage estimated deal value (USD) — used for column totals
const STAGE_VALUE: Record<PipelineStage, number> = {
  "New Lead": 18000, "Contacted": 19500, "Appointment Set": 21000,
  "Proposal Sent": 24500, "Credit Approved": 26000, "Contract Signed": 28500,
  "Site Survey": 28500, "Permit": 29000, "Install Scheduled": 30000,
  "Installed": 31500, "PTO": 32000, "Commission Paid": 32500,
};

type View = "rep" | "admin";

function Pipeline() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>(LEADS);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<PipelineStage | null>(null);
  const [view, setView] = useState<View>("admin");
  const [aiLead, setAiLead] = useState<Lead | null>(null);

  // filters
  const [query, setQuery] = useState("");
  const [service, setService] = useState("");
  const [rep, setRep] = useState("");
  const [utility, setUtility] = useState("");
  const [credit, setCredit] = useState("");
  const [priority, setPriority] = useState("");
  const [city, setCity] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [since, setSince] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await fetchLeads();
      if (!cancelled) setLeads(data);
    }
    load();
    const handler = () => load();
    window.addEventListener("leads:changed", handler);
    return () => {
      cancelled = true;
      window.removeEventListener("leads:changed", handler);
    };
  }, []);

  function clearFilters() {
    setService(""); setRep(""); setUtility(""); setCredit("");
    setPriority(""); setCity(""); setStageFilter(""); setSince("");
  }

  const activeFilterCount = [service, rep, utility, credit, priority, city, stageFilter, since].filter(Boolean).length;

  function onDrop(stage: PipelineStage) {
    setDragOver(null);
    if (!dragId) return;
    const lead = leads.find((l) => l.id === dragId);
    setLeads((all) => all.map((l) => (l.id === dragId ? { ...l, stage } : l)));
    const movedId = dragId;
    setDragId(null);
    if (lead && lead.stage !== stage) {
      toast.success(`Lead moved to ${stage}`, {
        description: `${lead.name} · Customer tracker updated.`,
      });
      void updateLeadStage(movedId, stage);
    }
  }

  const filtered = useMemo(() => leads.filter((l) => {
    if (view === "rep" && l.rep !== ME) return false;
    if (query) {
      const q = query.toLowerCase();
      const hay = `${l.name} ${l.phone} ${l.email} ${l.address} ${l.utility}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (service && l.service !== service) return false;
    if (rep && l.rep !== rep) return false;
    if (utility && l.utility !== utility) return false;
    if (credit && l.credit !== credit) return false;
    if (priority && l.priority !== priority) return false;
    if (city && l.city !== city) return false;
    if (stageFilter && l.stage !== stageFilter) return false;
    if (since && l.createdAt < since) return false;
    return true;
  }), [leads, view, query, service, rep, utility, credit, priority, city, stageFilter, since]);

  const totalValue = filtered.reduce((s, l) => s + STAGE_VALUE[l.stage], 0);

  return (
    <div className="p-4 lg:p-6 min-h-screen flex flex-col bg-background text-foreground">
        <PageHeader
          eyebrow="Sales · Command Center"
          title="Pipeline"
          subtitle={`${filtered.length} leads · ${fmtCurrency(totalValue)} weighted value · synced to project tracker`}
          actions={
            <>
              <div className="hidden md:inline-flex items-center bg-secondary rounded-md p-0.5 border border-border">
                <ViewBtn active={view === "rep"} onClick={() => setView("rep")} icon={User} label="Sales Rep" />
                <ViewBtn active={view === "admin"} onClick={() => setView("admin")} icon={Users} label="Admin" />
              </div>
            </>
          }
        />

        {/* Search + filters */}
        <div className="bg-card border border-border rounded-xl p-3 mb-4 space-y-3 shadow-card">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by customer name, phone, email, address, or utility…"
              className="w-full pl-9 pr-9 py-2.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground px-1">
              <Filter className="size-3.5" /> Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold rounded-full size-4">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <Sel value={service} onChange={setService} label="Service" opts={SERVICES} />
            <Sel value={rep} onChange={setRep} label="Rep" opts={REPS} disabled={view === "rep"} />
            <Sel value={utility} onChange={setUtility} label="Utility" opts={UTILITIES} />
            <Sel value={credit} onChange={setCredit} label="Credit" opts={CREDITS} />
            <Sel value={priority} onChange={setPriority} label="Priority" opts={PRIORITIES} />
            <Sel value={city} onChange={setCity} label="City" opts={CITIES} />
            <Sel value={stageFilter} onChange={setStageFilter} label="Stage" opts={PIPELINE_STAGES as unknown as string[]} />
            <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              Created since
              <input type="date" value={since} onChange={(e) => setSince(e.target.value)}
                className="text-xs rounded-md border border-input bg-background px-2 py-1" />
            </label>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-primary font-semibold hover:underline ml-auto">
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* AI insights bar */}
        <PipelineInsights leads={filtered} />

        {/* Kanban */}
        <div className="flex-1 min-h-0 overflow-x-auto -mx-4 lg:-mx-6 px-4 lg:px-6 pb-6 mt-4">
          <div className="flex gap-3 h-full" style={{ minWidth: `${PIPELINE_STAGES.length * 304}px` }}>
            {PIPELINE_STAGES.map((stage) => {
              const items = filtered.filter((l) => l.stage === stage);
              const colValue = items.reduce((s) => s + STAGE_VALUE[stage], 0);
              const isOver = dragOver === stage;
              return (
                <div
                  key={stage}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(stage); }}
                  onDragLeave={() => setDragOver((s) => (s === stage ? null : s))}
                  onDrop={() => onDrop(stage)}
                  className={`w-[292px] shrink-0 flex flex-col rounded-xl border transition-all ${
                    isOver
                      ? "border-gold bg-gold/10 ring-2 ring-gold/40"
                      : "border-border bg-secondary/40"
                  }`}
                >
                  <div className="px-3 py-2.5 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-foreground uppercase tracking-wide">{stage}</div>
                      <div className="text-[10px] font-bold text-foreground bg-card border border-border px-1.5 py-0.5 rounded">
                        {items.length}
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 font-medium">
                      {fmtCurrency(colValue)} pipeline
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {items.map((l) => (
                      <LeadCard
                        key={l.id}
                        lead={l}
                        dragging={dragId === l.id}
                        onDragStart={() => setDragId(l.id)}
                        onDragEnd={() => { setDragId(null); setDragOver(null); }}
                        onOpen={() => navigate({ to: "/leads/$leadId", params: { leadId: l.id } })}
                        onAiDesign={() => setAiLead(l)}
                      />
                    ))}
                    {items.length === 0 && (
                      <div className="text-[11px] text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">
                        Drop a lead here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      <SolarDesignerDialog
        open={!!aiLead}
        onOpenChange={(v) => { if (!v) setAiLead(null); }}
        leadId={aiLead?.id ?? null}
        defaults={aiLead ? { customer_name: aiLead.name, address: aiLead.address, utility_company: aiLead.utility, monthly_bill: aiLead.bill } : undefined}
      />
    </div>
  );
}

function ViewBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof User; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="size-3.5" /> {label}
    </button>
  );
}

function Sel({ value, onChange, label, opts, disabled }: { value: string; onChange: (v: string) => void; label: string; opts: string[]; disabled?: boolean }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="text-xs rounded-md border border-input bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-40"
    >
      <option value="">{label}: All</option>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function LeadCard({ lead, dragging, onDragStart, onDragEnd, onOpen, onAiDesign }: {
  lead: Lead; dragging: boolean; onDragStart: () => void; onDragEnd: () => void; onOpen: () => void; onAiDesign: () => void;
}) {
  const initials = lead.name.split(" ").map((s) => s[0]).join("").slice(0, 2);
  const priorityRing =
    lead.priority === "High" ? "border-l-destructive"
    : lead.priority === "Medium" ? "border-l-gold"
    : "border-l-border";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      className={`group bg-card rounded-lg border border-border border-l-[3px] ${priorityRing} p-3 shadow-card hover:border-primary/50 hover:shadow-elegant transition-all cursor-grab active:cursor-grabbing ${
        dragging ? "opacity-40 scale-95" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div className="size-8 shrink-0 rounded-full bg-gradient-to-br from-primary to-navy text-primary-foreground grid place-items-center text-[10px] font-bold">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground truncate">{lead.name}</div>
          <div className="text-[10px] text-muted-foreground truncate">{lead.city}</div>
        </div>
        <PriorityChip priority={lead.priority} />
      </div>

      {/* Service + utility */}
      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
        <ServicePill service={lead.service} />
        <span className="text-[10px] font-medium text-muted-foreground">· {lead.utility}</span>
      </div>

      {/* Badges */}
      {lead.badges.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {lead.badges.slice(0, 3).map((b) => <BadgeChip key={b} badge={b} />)}
        </div>
      )}

      {/* Stats grid */}
      <div className="mt-2.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
        <Stat label="Bill" value={`${fmtCurrency(lead.bill)}/mo`} />
        <Stat label="Credit" value={lead.credit} accent />
        <Stat label="Source" value={lead.source} />
        <Stat label="Rep" value={lead.rep.split(" ")[0]} />
        <Stat label="Last" value={fmtShort(lead.lastContact)} />
        <Stat label="Next" value={fmtShort(lead.nextFollowUp)} accent={isSoon(lead.nextFollowUp)} />
      </div>

      {/* Actions */}
      <div className="mt-2.5 pt-2 border-t border-border flex items-center gap-1">
        <ActionIcon
          icon={Phone} title="Call"
          onClick={() => lead.phone ? openExternal(telHref(lead.phone)) : comingSoon("Calling")}
        />
        <ActionIcon
          icon={MessageSquare} title="SMS"
          onClick={() => lead.phone ? openExternal(smsHref(lead.phone)) : toast.error("No phone number on this lead.")}
        />
        <ActionIcon
          icon={MessageCircle} title="WhatsApp" className="text-success"
          onClick={() => lead.phone ? openExternal(waHref(lead.phone, `Hi ${lead.name.split(" ")[0]}, this is your MDB Solar rep — quick follow-up.`)) : toast.error("No phone number on this lead.")}
        />
        <ActionIcon
          icon={Mail} title="Email"
          onClick={() => lead.email ? openExternal(mailHref(lead.email, "MDB Solar follow-up")) : toast.error("No email on this lead.")}
        />
        <Link
          to="/proposals"
          search={{ lead_id: lead.id }}
          onClick={(e) => e.stopPropagation()}
          title="Create Proposal"
          className="ml-auto inline-flex items-center justify-center size-7 rounded text-muted-foreground hover:text-gold hover:bg-secondary"
        >
          <FileText className="size-3.5" />
        </Link>
        <button
          title="AI Solar Designer"
          onClick={(e) => { e.stopPropagation(); onAiDesign(); }}
          className="inline-flex items-center justify-center size-7 rounded text-primary hover:bg-primary/10"
        >
          <Sparkles className="size-3.5" />
        </button>
        <button
          title="Open Lead"
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          className="inline-flex items-center justify-center size-7 rounded text-primary hover:bg-primary/10"
        >
          <ExternalLink className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function ActionIcon({ icon: Icon, title, onClick, className = "" }: {
  icon: typeof Phone; title: string; onClick: () => void; className?: string;
}) {
  return (
    <button
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`inline-flex items-center justify-center size-7 rounded text-muted-foreground hover:text-primary hover:bg-secondary transition-colors ${className}`}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline gap-1 min-w-0">
      <span className="text-muted-foreground uppercase tracking-wide text-[9px] shrink-0">{label}</span>
      <span className={`font-semibold truncate ${accent ? "text-primary" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

function PriorityChip({ priority }: { priority: Lead["priority"] }) {
  const map = {
    High: "bg-destructive/15 text-destructive border-destructive/30",
    Medium: "bg-gold/20 text-navy dark:text-gold border-gold/40",
    Low: "bg-secondary text-muted-foreground border-border",
  } as const;
  return (
    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${map[priority]}`}>
      {priority}
    </span>
  );
}

function fmtShort(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}
function isSoon(iso: string) {
  const d = new Date(iso).getTime();
  return d - Date.now() < 3 * 86400000;
}

// ----- AI insights panel ---------------------------------------------------
function PipelineInsights({ leads }: { leads: Lead[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const followToday = leads.filter((l) => l.nextFollowUp <= today && !["Installed", "PTO", "Commission Paid"].includes(l.stage));
  const hotStuck = leads.filter((l) => l.badges.includes("Hot Lead") && ["Contacted", "Appointment Set", "Proposal Sent"].includes(l.stage));
  const creditReady = leads.filter((l) => l.badges.includes("Credit Ready") && ["Proposal Sent", "Credit Approved"].includes(l.stage));
  const toClose = leads.filter((l) => l.stage === "Proposal Sent");
  const atRisk = leads.filter((l) => l.badges.includes("Install Risk") || l.badges.includes("Missing Documents"));
  const commissionDue = leads.filter((l) => l.badges.includes("Commission Pending"));

  return (
    <div className="bg-gradient-to-r from-navy via-primary to-navy text-primary-foreground rounded-xl border border-border p-4 shadow-elegant">
      <div className="flex items-center gap-2 mb-3">
        <div className="size-7 rounded-md bg-gold grid place-items-center">
          <Sun className="size-4 text-gold-foreground" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-sm font-bold">MDB AI · Pipeline Brief</div>
          <div className="text-[10px] opacity-70 uppercase tracking-wider">Live analysis of your visible board</div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
        <Insight icon={Clock}        n={followToday.length}    label="Follow up today" tone="warning" />
        <Insight icon={Flame}        n={hotStuck.length}       label="Hot & stuck" tone="danger" />
        <Insight icon={ShieldCheck}  n={creditReady.length}    label="Credit ready" tone="success" />
        <Insight icon={FileText}     n={toClose.length}        label="Proposals to close" tone="gold" />
        <Insight icon={AlertTriangle} n={atRisk.length}        label="Projects at risk" tone="danger" />
        <Insight icon={DollarSign}   n={commissionDue.length}  label="Commission pending" tone="gold" />
      </div>
      <div className="mt-3 grid md:grid-cols-2 gap-2 text-xs">
        <Suggestion
          icon={MessageCircle}
          title="Suggested WhatsApp"
          body={`Hey ${(followToday[0]?.name ?? "there").split(" ")[0]} 👋 quick check-in from MDB — I locked your ${followToday[0]?.utility ?? "FPL"} rate comparison. Want me to text the side-by-side or call after 6pm?`}
        />
        <Suggestion
          icon={Flame}
          title="Suggested next action"
          body={hotStuck[0]
            ? `Move ${hotStuck[0].name} (${hotStuck[0].city}) from ${hotStuck[0].stage} → Credit Approved today. Send credit auth via SMS and book a 15-min close call.`
            : "No hot leads stuck. Focus on Proposals to close — schedule a 20-min review with each Proposal Sent lead before EOD."}
        />
      </div>
    </div>
  );
}

function Insight({ icon: Icon, n, label, tone }: {
  icon: typeof Clock; n: number; label: string; tone: "warning" | "danger" | "success" | "gold";
}) {
  const toneMap = {
    warning: "bg-warning/20 text-warning border-warning/30",
    danger: "bg-destructive/20 text-destructive-foreground border-destructive/30",
    success: "bg-success/20 text-success border-success/30",
    gold: "bg-gold/20 text-gold border-gold/40",
  } as const;
  return (
    <div className="bg-card/10 backdrop-blur rounded-lg border border-white/10 px-2.5 py-2 flex items-center gap-2">
      <div className={`size-7 rounded grid place-items-center border ${toneMap[tone]}`}>
        <Icon className="size-3.5" />
      </div>
      <div className="leading-tight min-w-0">
        <div className="text-base font-bold">{n}</div>
        <div className="text-[9px] uppercase tracking-wide opacity-80 truncate">{label}</div>
      </div>
    </div>
  );
}

function Suggestion({ icon: Icon, title, body }: { icon: typeof Clock; title: string; body: string }) {
  return (
    <div className="bg-card/10 backdrop-blur rounded-lg border border-white/10 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold opacity-80">
        <Icon className="size-3.5" /> {title}
      </div>
      <div className="text-xs leading-snug mt-1 opacity-95">{body}</div>
    </div>
  );
}

// Re-export so existing imports from this route keep working.
export { BadgeChip } from "@/components/badge-chip";
// touch reference for FileWarning to avoid unused-import error in some lints
void FileWarning;