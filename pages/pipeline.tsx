import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Filter,
  Phone,
  Mail,
  MessageCircle,
  MessageSquare,
  ExternalLink,
  FileText,
  Flame,
  Clock,
  ShieldCheck,
  AlertTriangle,
  DollarSign,
  Users,
  User,
  X,
  Sun,
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { PageHeader, ServicePill } from '../components/layout/Topbar';
import { BadgeChip, type LeadBadge } from '../components/layout/BadgeChip';

const STAGES = [
  'New Lead',
  'Contacted',
  'Appointment Set',
  'Proposal Sent',
  'Credit Approved',
  'Contract Signed',
  'Site Survey',
  'Permit',
  'Install Scheduled',
  'Installed',
  'PTO',
  'Commission Paid',
] as const;

type PipelineStage = (typeof STAGES)[number];
type View = 'rep' | 'admin';

type Lead = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  utility_company: string | null;
  service_type: string | null;
  pipeline_stage: string | null;
  priority: string | null;
  city: string | null;
  created_at: string | null;
};

const STAGE_VALUE: Record<PipelineStage, number> = {
  'New Lead': 18000,
  Contacted: 19500,
  'Appointment Set': 21000,
  'Proposal Sent': 24500,
  'Credit Approved': 26000,
  'Contract Signed': 28500,
  'Site Survey': 28500,
  Permit: 29000,
  'Install Scheduled': 30000,
  Installed: 31500,
  PTO: 32000,
  'Commission Paid': 32500,
};

function fmtCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}

function inferBadges(lead: Lead): LeadBadge[] {
  const badges: LeadBadge[] = [];
  const stage = lead.pipeline_stage || 'New Lead';
  if ((lead.priority || '').toLowerCase().includes('high')) badges.push('Hot Lead');
  if (stage === 'Proposal Sent' || stage === 'Credit Approved') badges.push('Credit Ready');
  if (stage === 'Permit') badges.push('Install Risk');
  if (stage === 'PTO') badges.push('Commission Pending');
  if (stage === 'Contacted' || stage === 'Appointment Set') badges.push('Needs Follow-Up');
  return badges.slice(0, 3);
}

function stageFromLead(lead: Lead): PipelineStage {
  const s = lead.pipeline_stage || 'New Lead';
  return (STAGES.includes(s as PipelineStage) ? s : 'New Lead') as PipelineStage;
}

function PriorityChip({ priority }: { priority: string | null }) {
  const p = (priority || 'Low').toLowerCase();
  const cls = p.includes('high')
    ? 'bg-destructive/15 text-destructive border-destructive/30'
    : p.includes('med')
    ? 'bg-gold/20 text-navy border-gold/40'
    : 'bg-secondary text-muted-foreground border-border';

  return <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${cls}`}>{priority || 'Low'}</span>;
}

function ViewBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
        active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
      }`}
      type="button"
    >
      <Icon className="size-3.5" /> {label}
    </button>
  );
}

function Insight({ icon: Icon, n, label, tone }: { icon: any; n: number; label: string; tone: 'warning' | 'danger' | 'success' | 'gold' }) {
  const toneMap = {
    warning: 'bg-warning/20 text-warning border-warning/30',
    danger: 'bg-destructive/20 text-destructive-foreground border-destructive/30',
    success: 'bg-success/20 text-success border-success/30',
    gold: 'bg-gold/20 text-gold border-gold/40',
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

function Suggestion({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="bg-card/10 backdrop-blur rounded-lg border border-white/10 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold opacity-80">
        <Icon className="size-3.5" /> {title}
      </div>
      <div className="text-xs leading-snug mt-1 opacity-95">{body}</div>
    </div>
  );
}

export default function Pipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<PipelineStage | null>(null);
  const [view, setView] = useState<View>('admin');

  const [query, setQuery] = useState('');
  const [service, setService] = useState('');
  const [priority, setPriority] = useState('');
  const [city, setCity] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  const services = useMemo(() => Array.from(new Set(leads.map((l) => l.service_type).filter(Boolean) as string[])), [leads]);
  const cities = useMemo(() => Array.from(new Set(leads.map((l) => l.city).filter(Boolean) as string[])), [leads]);

  useEffect(() => {
    void loadLeads();
  }, []);

  async function loadLeads() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('leads')
      .select('id,name,phone,email,utility_company,service_type,pipeline_stage,priority,city,created_at,archived')
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (error) setError(error.message || 'Unable to load pipeline');
    else setLeads((data || []) as Lead[]);
    setLoading(false);
  }

  async function onDrop(stage: PipelineStage) {
    setDragOver(null);
    if (!dragId) return;

    const current = leads.find((l) => l.id === dragId);
    setLeads((all) => all.map((l) => (l.id === dragId ? { ...l, pipeline_stage: stage } : l)));
    setDragId(null);

    if (current && stageFromLead(current) !== stage) {
      const { error } = await supabase.from('leads').update({ pipeline_stage: stage }).eq('id', current.id);
      if (error) {
        setError(error.message || 'Unable to update stage');
        await loadLeads();
      }
    }
  }

  function clearFilters() {
    setService('');
    setPriority('');
    setCity('');
    setStageFilter('');
  }

  const activeFilterCount = [service, priority, city, stageFilter].filter(Boolean).length;

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (view === 'rep' && !(l.name || '').toLowerCase().includes('diego')) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = `${l.name || ''} ${l.phone || ''} ${l.email || ''} ${l.utility_company || ''} ${l.city || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (service && l.service_type !== service) return false;
      if (priority && l.priority !== priority) return false;
      if (city && l.city !== city) return false;
      if (stageFilter && stageFromLead(l) !== stageFilter) return false;
      return true;
    });
  }, [leads, view, query, service, priority, city, stageFilter]);

  const totalValue = useMemo(() => filtered.reduce((s, l) => s + STAGE_VALUE[stageFromLead(l)], 0), [filtered]);

  const followToday = filtered.filter((l) => !['Installed', 'PTO', 'Commission Paid'].includes(stageFromLead(l))).length;
  const hotStuck = filtered.filter((l) => (l.priority || '').toLowerCase().includes('high') && ['Contacted', 'Appointment Set', 'Proposal Sent'].includes(stageFromLead(l))).length;
  const creditReady = filtered.filter((l) => ['Proposal Sent', 'Credit Approved'].includes(stageFromLead(l))).length;
  const toClose = filtered.filter((l) => stageFromLead(l) === 'Proposal Sent').length;
  const atRisk = filtered.filter((l) => stageFromLead(l) === 'Permit' || (l.priority || '').toLowerCase().includes('high')).length;
  const commissionDue = filtered.filter((l) => stageFromLead(l) === 'PTO').length;

  if (loading) {
    return <div className="p-4 lg:p-6 text-sm text-muted-foreground">Loading pipeline...</div>;
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6">
        <div className="bg-card rounded-xl border border-destructive/30 p-4 text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 min-h-screen flex flex-col bg-background text-foreground">
      <PageHeader
        eyebrow="Sales · Command Center"
        title="Pipeline"
        subtitle={`${filtered.length} leads · ${fmtCurrency(totalValue)} weighted value · synced to project tracker`}
        actions={
          <div className="hidden md:inline-flex items-center bg-secondary rounded-md p-0.5 border border-border">
            <ViewBtn active={view === 'rep'} onClick={() => setView('rep')} icon={User} label="Sales Rep" />
            <ViewBtn active={view === 'admin'} onClick={() => setView('admin')} icon={Users} label="Admin" />
          </div>
        }
      />

      <div className="bg-card border border-border rounded-xl p-3 mb-4 space-y-3 shadow-card">
        <div className="relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by customer name, phone, email, city, or utility"
            className="w-full pl-9 pr-9 py-2.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" type="button">
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

          <select value={service} onChange={(e) => setService(e.target.value)} className="text-xs rounded-md border border-input bg-background px-2 py-1.5">
            <option value="">Service: All</option>
            {services.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="text-xs rounded-md border border-input bg-background px-2 py-1.5">
            <option value="">Priority: All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select value={city} onChange={(e) => setCity(e.target.value)} className="text-xs rounded-md border border-input bg-background px-2 py-1.5">
            <option value="">City: All</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="text-xs rounded-md border border-input bg-background px-2 py-1.5">
            <option value="">Stage: All</option>
            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-primary font-semibold hover:underline ml-auto" type="button">
              Clear all
            </button>
          )}
        </div>
      </div>

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
          <Insight icon={Clock} n={followToday} label="Follow up today" tone="warning" />
          <Insight icon={Flame} n={hotStuck} label="Hot & stuck" tone="danger" />
          <Insight icon={ShieldCheck} n={creditReady} label="Credit ready" tone="success" />
          <Insight icon={FileText} n={toClose} label="Proposals to close" tone="gold" />
          <Insight icon={AlertTriangle} n={atRisk} label="Projects at risk" tone="danger" />
          <Insight icon={DollarSign} n={commissionDue} label="Commission pending" tone="gold" />
        </div>
        <div className="mt-3 grid md:grid-cols-2 gap-2 text-xs">
          <Suggestion icon={MessageCircle} title="Suggested WhatsApp" body="Quick check-in drafted for leads in Proposal Sent and Contacted with highest urgency." />
          <Suggestion icon={Flame} title="Suggested next action" body="Move top high-priority Proposal Sent leads to Credit Approved by sending credit auth now." />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto -mx-4 lg:-mx-6 px-4 lg:px-6 pb-6 mt-4">
        <div className="flex gap-3 h-full" style={{ minWidth: `${STAGES.length * 304}px` }}>
          {STAGES.map((stage) => {
            const items = filtered.filter((l) => stageFromLead(l) === stage);
            const colValue = items.reduce((s, l) => s + STAGE_VALUE[stage], 0);
            const isOver = dragOver === stage;

            return (
              <div
                key={stage}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(stage);
                }}
                onDragLeave={() => setDragOver((s) => (s === stage ? null : s))}
                onDrop={() => void onDrop(stage)}
                className={`w-[292px] shrink-0 flex flex-col rounded-xl border transition-all ${
                  isOver ? 'border-gold bg-gold/10 ring-2 ring-gold/40' : 'border-border bg-secondary/40'
                }`}
              >
                <div className="px-3 py-2.5 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-foreground uppercase tracking-wide">{stage}</div>
                    <div className="text-[10px] font-bold text-foreground bg-card border border-border px-1.5 py-0.5 rounded">{items.length}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 font-medium">{fmtCurrency(colValue)} pipeline</div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {items.map((lead) => {
                    const badges = inferBadges(lead);
                    const priorityRing =
                      (lead.priority || '').toLowerCase().includes('high')
                        ? 'border-l-destructive'
                        : (lead.priority || '').toLowerCase().includes('med')
                        ? 'border-l-gold'
                        : 'border-l-border';

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => setDragId(lead.id)}
                        onDragEnd={() => {
                          setDragId(null);
                          setDragOver(null);
                        }}
                        className={`group bg-card rounded-lg border border-border border-l-[3px] ${priorityRing} p-3 shadow-card hover:border-primary/50 hover:shadow-elegant transition-all cursor-grab active:cursor-grabbing ${
                          dragId === lead.id ? 'opacity-40 scale-95' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="size-8 shrink-0 rounded-full bg-gradient-to-br from-primary to-navy text-primary-foreground grid place-items-center text-[10px] font-bold">
                            {(lead.name || 'U').split(' ').map((s) => s[0]).join('').slice(0, 2)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-foreground truncate">{lead.name || 'Unnamed Lead'}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{lead.city || 'City N/A'}</div>
                          </div>
                          <PriorityChip priority={lead.priority} />
                        </div>

                        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                          <ServicePill service={lead.service_type || 'Solar'} />
                          <span className="text-[10px] font-medium text-muted-foreground">· {lead.utility_company || 'Utility N/A'}</span>
                        </div>

                        {badges.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {badges.map((b) => <BadgeChip key={`${lead.id}-${b}`} badge={b} />)}
                          </div>
                        )}

                        <div className="mt-2.5 pt-2 border-t border-border flex items-center gap-1">
                          <button title="Call" onClick={() => lead.phone && window.open(`tel:${lead.phone}`)} className="inline-flex items-center justify-center size-7 rounded text-muted-foreground hover:text-primary hover:bg-secondary transition-colors" type="button">
                            <Phone className="size-3.5" />
                          </button>
                          <button title="SMS" onClick={() => lead.phone && window.open(`sms:${lead.phone}`)} className="inline-flex items-center justify-center size-7 rounded text-muted-foreground hover:text-primary hover:bg-secondary transition-colors" type="button">
                            <MessageSquare className="size-3.5" />
                          </button>
                          <button title="WhatsApp" onClick={() => lead.phone && window.open(`https://wa.me/${(lead.phone || '').replace(/\D/g, '')}`)} className="inline-flex items-center justify-center size-7 rounded text-success hover:text-primary hover:bg-secondary transition-colors" type="button">
                            <MessageCircle className="size-3.5" />
                          </button>
                          <button title="Email" onClick={() => lead.email && window.open(`mailto:${lead.email}`)} className="inline-flex items-center justify-center size-7 rounded text-muted-foreground hover:text-primary hover:bg-secondary transition-colors" type="button">
                            <Mail className="size-3.5" />
                          </button>

                          <Link href={`/proposals?lead_id=${lead.id}`} className="ml-auto inline-flex items-center justify-center size-7 rounded text-muted-foreground hover:text-gold hover:bg-secondary" title="Create Proposal">
                            <FileText className="size-3.5" />
                          </Link>

                          <Link href={`/leads/${lead.id}`} className="inline-flex items-center justify-center size-7 rounded text-primary hover:bg-primary/10" title="Open Lead">
                            <ExternalLink className="size-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}

                  {items.length === 0 && <div className="text-[11px] text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">Drop a lead here</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
