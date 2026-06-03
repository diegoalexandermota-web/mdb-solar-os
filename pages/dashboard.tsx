import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  CalendarCheck,
  FileText,
  FileSignature,
  HardHat,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Sun,
  Droplets,
  Flame,
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { PageHeader, StageBadge, ServicePill } from '../components/layout/Topbar';

type MetricState = {
  today: number;
  overdue: number;
  followups: number;
  proposalsCreated: number;
  proposalsSent: number;
  proposalsSigned: number;
  proposalConversion: number;
  avgValue: number;
  financingMix: Record<string, number>;
};

type LeadRow = {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  utility_company: string | null;
  service_type: string | null;
  pipeline_stage: string | null;
  assigned_rep: string | null;
  created_at: string | null;
  monthly_bill: number | null;
};

function fmtCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  sub: string;
  accent?: 'gold' | 'primary' | 'success';
}) {
  const accentCls =
    accent === 'gold' ? 'bg-gold/15 text-navy' : accent === 'success' ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary';

  return (
    <div className="bg-card rounded-xl p-3.5 border border-border shadow-card hover:shadow-elegant hover:border-primary/30 transition-all">
      <div className="flex items-center justify-between">
        <div className={`size-8 rounded-md grid place-items-center ${accentCls}`}>
          <Icon className="size-4" />
        </div>
        <div className="text-[10px] text-success font-semibold flex items-center gap-0.5">
          <ArrowUpRight className="size-3" /> {sub}
        </div>
      </div>
      <div className="mt-2.5 text-xl font-bold tracking-tight text-foreground leading-none">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1 truncate">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricState>({
    today: 0,
    overdue: 0,
    followups: 0,
    proposalsCreated: 0,
    proposalsSent: 0,
    proposalsSigned: 0,
    proposalConversion: 0,
    avgValue: 0,
    financingMix: {},
  });
  const [recentLeads, setRecentLeads] = useState<LeadRow[]>([]);

  useEffect(() => {
    void fetchMetrics();
  }, []);

  async function fetchMetrics() {
    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data: allLeads, error: leadsErr } = await supabase
        .from('leads')
        .select('id,name,address,city,utility_company,service_type,pipeline_stage,assigned_rep,created_at')
        .order('created_at', { ascending: false });
      const { data: tasks, error: tasksErr } = await supabase.from('tasks').select('*');
      const { data: proposals, error: propErr } = await supabase.from('proposals').select('*');
      const recentLeadIds = (allLeads || []).slice(0, 6).map((lead) => lead.id);
      const { data: recentLeadProposals } = recentLeadIds.length
        ? await supabase
            .from('proposals')
            .select('lead_id, monthly_bill, created_at')
            .in('lead_id', recentLeadIds)
            .order('created_at', { ascending: false })
        : { data: [] as { lead_id: string; monthly_bill: number | null; created_at: string | null }[] };
      const assignedRepIds = Array.from(new Set((allLeads || []).map((lead) => lead.assigned_rep).filter((value): value is string => Boolean(value))));
      const { data: reps } = assignedRepIds.length
        ? await supabase.from('profiles').select('id,full_name').in('id', assignedRepIds)
        : { data: [] as { id: string; full_name: string | null }[] };

      if (leadsErr || tasksErr || propErr) throw new Error(leadsErr?.message || tasksErr?.message || propErr?.message);

      const repNameById = new Map((reps || []).map((rep) => [rep.id, rep.full_name || 'MDB Rep']));
      const monthlyBillByLeadId = new Map<string, number>();
      for (const proposal of recentLeadProposals || []) {
        if (!monthlyBillByLeadId.has(proposal.lead_id)) {
          monthlyBillByLeadId.set(proposal.lead_id, Number(proposal.monthly_bill) || 0);
        }
      }

      let todayCount = 0;
      let overdueCount = 0;
      let followups = 0;
      let proposalsCreated = 0;
      let proposalsSent = 0;
      let proposalsSigned = 0;
      let avgValue = 0;
      const financingMix: Record<string, number> = {};

      if (allLeads) {
        todayCount = allLeads.filter((lead) => lead.pipeline_stage !== 'New Lead' && lead.pipeline_stage !== 'Contacted').length;
      }

      if (tasks) {
        todayCount = tasks.filter((t: any) => !t.completed && t.due_date === today).length;
        overdueCount = tasks.filter((t: any) => !t.completed && t.due_date < today).length;
        followups = tasks.filter((t: any) => !t.completed && t.type === 'Call').length;
      }

      if (proposals) {
        const active = proposals.filter((p: any) => !p.archived);
        proposalsCreated = active.length;
        proposalsSent = active.filter((p: any) => p.status === 'Sent').length;
        proposalsSigned = active.filter((p: any) => p.status === 'Signed').length;
        avgValue = active.length
          ? Math.round(active.reduce((sum: number, p: any) => sum + (Number(p.monthly_bill) || 0), 0) / active.length)
          : 0;

        for (const p of active) {
          const pref = p.financing_preference || 'Unknown';
          financingMix[pref] = (financingMix[pref] || 0) + 1;
        }
      }

      const proposalConversion = proposalsCreated ? Math.round((proposalsSigned / proposalsCreated) * 100) : 0;

      setMetrics({
        today: todayCount,
        overdue: overdueCount,
        followups,
        proposalsCreated,
        proposalsSent,
        proposalsSigned,
        proposalConversion,
        avgValue,
        financingMix,
      });
      setRecentLeads(
        (allLeads || []).slice(0, 6).map((lead) => ({
          id: lead.id,
          name: lead.name,
          address: lead.address,
          city: lead.city,
          utility_company: lead.utility_company,
          service_type: lead.service_type,
          pipeline_stage: lead.pipeline_stage,
          assigned_rep: repNameById.get(lead.assigned_rep || '') || 'MDB Rep',
          created_at: lead.created_at,
          monthly_bill: monthlyBillByLeadId.get(lead.id) || null,
        })),
      );
    } catch (e: any) {
      setError(e.message || 'Unable to load dashboard metrics');
    }

    setLoading(false);
  }

  const installed = useMemo(() => recentLeads.filter((l) => ['Installed', 'PTO', 'Commission Paid'].includes(l.pipeline_stage || '')).length, [recentLeads]);
  const monthlyRev = metrics.proposalsSigned * 28400;
  const pendingComm = Math.max(metrics.proposalsSigned - installed, 0) * 1980;
  const funnelRows = [
    { label: 'New Lead → Contacted', n: Math.max(metrics.today, 0), w: 100 },
    { label: 'Contacted → Appointment Set', n: Math.max(metrics.followups, 0), w: 78 },
    { label: 'Appointment → Proposal Sent', n: Math.max(metrics.proposalsSent, 0), w: 60 },
    { label: 'Proposal → Credit Approved', n: Math.max(metrics.proposalsSigned, 0), w: 42 },
    { label: 'Credit → Contract Signed', n: Math.max(Math.round(metrics.proposalsSigned * 0.75), 0), w: 32 },
    { label: 'Contract → Installed', n: Math.max(installed, 0), w: 25 },
  ];

  if (loading) {
    return <div className="p-4 lg:p-6 text-sm text-muted-foreground">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6">
        <div className="bg-card rounded-xl border border-destructive/30 p-4 text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <PageHeader
        eyebrow="Operations · This month"
        title="Good morning, Diego ☀️"
        subtitle="Here's how MDB Solar is performing today. Pipeline is healthy — focus your follow-ups on Credit Approved and Proposal Sent."
        actions={
          <Link
            href="/pipeline"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
          >
            Open pipeline <ArrowUpRight className="size-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 2xl:grid-cols-8 gap-3">
        <Kpi icon={Users} label="Total leads" value={String(metrics.proposalsCreated)} sub="+12%" accent="primary" />
        <Kpi icon={CalendarCheck} label="Appointments booked" value={String(metrics.today)} sub="+8%" accent="primary" />
        <Kpi icon={FileText} label="Proposals sent" value={String(metrics.proposalsSent)} sub="+22%" accent="gold" />
        <Kpi icon={FileSignature} label="Contracts signed" value={String(metrics.proposalsSigned)} sub="+5%" accent="success" />
        <Kpi icon={HardHat} label="Installed projects" value={String(installed)} sub="+3" accent="success" />
        <Kpi icon={DollarSign} label="Pending commissions" value={fmtCurrency(pendingComm)} sub="+$4.2k" accent="gold" />
        <Kpi icon={TrendingUp} label="Monthly revenue est." value={fmtCurrency(monthlyRev)} sub="+18%" accent="primary" />
        <Kpi icon={Activity} label="Conversion rate" value={`${metrics.proposalConversion}%`} sub="+1.4pt" accent="success" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Pipeline funnel</h3>
              <p className="text-xs text-muted-foreground">Drag-and-drop in the Pipeline view.</p>
            </div>
            <Link href="/pipeline" className="text-xs font-medium text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-2.5">
            {funnelRows.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <div className="w-56 text-xs text-muted-foreground shrink-0">{row.label}</div>
                <div className="flex-1 h-7 bg-secondary rounded-md overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary-glow flex items-center justify-end px-2 text-[11px] font-semibold text-primary-foreground"
                    style={{ width: `${row.w}%` }}
                  >
                    {row.n}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-1">Service mix</h3>
          <p className="text-xs text-muted-foreground mb-5">Bundled deals lift commission 38%.</p>
          <div className="space-y-3">
            {[
              { icon: Sun, label: 'Solar', n: metrics.proposalsSent, pct: 58, color: 'bg-gold' },
              { icon: Droplets, label: 'Water treatment', n: metrics.followups, pct: 29, color: 'bg-primary' },
              { icon: Flame, label: 'HVAC / Roof', n: metrics.overdue, pct: 17, color: 'bg-success' },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <s.icon className="size-3.5 text-primary" /> {s.label}
                  </div>
                  <span className="text-muted-foreground">{s.n} deals</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className={s.color} style={{ width: `${s.pct}%`, height: '100%' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-navy to-primary text-primary-foreground">
            <div className="text-[10px] uppercase tracking-widest opacity-70">MDB AI Insight</div>
            <p className="text-sm mt-1.5 leading-relaxed">
              {metrics.overdue} records need urgent follow-up. <span className="text-gold font-semibold">Draft follow-ups →</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Recent leads</h3>
          <Link href="/pipeline" className="text-xs font-medium text-primary hover:underline">
            All leads →
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recentLeads.map((l) => (
            <Link key={l.id} href={`/leads/${l.id}`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-secondary/50 transition-colors">
              <div className="size-9 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground grid place-items-center text-xs font-semibold">
                {(l.name || 'U').split(' ').map((p) => p[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{l.name || 'Unnamed Lead'}</div>
                <div className="text-xs text-muted-foreground truncate">{l.address || '-'} · {l.utility_company || '-'} · {fmtCurrency(l.monthly_bill || 0)}/mo</div>
              </div>
              <ServicePill service={l.service_type || 'Solar'} />
              <StageBadge stage={l.pipeline_stage || 'New Lead'} />
              <div className="text-xs text-muted-foreground hidden md:block w-24 truncate text-right">{l.assigned_rep || 'MDB Rep'}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
