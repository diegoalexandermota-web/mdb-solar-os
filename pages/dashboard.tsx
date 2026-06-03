import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, AlertTriangle, PhoneCall, Send, CheckCircle2, CircleDollarSign, ArrowUpRight, ArrowDownRight, Target } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import SkeletonMetric from '../components/SkeletonMetric';
import SkeletonTable from '../components/SkeletonTable';
import { ServicePill, StageBadge, Topbar } from '../components/layout/Topbar';

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
  service_type: string | null;
  pipeline_stage: string | null;
  created_at: string | null;
};

function fmtDate(value: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString();
}

function trend(current: number, baseline: number) {
  if (baseline <= 0) return 0;
  return Math.round(((current - baseline) / baseline) * 100);
}

function Kpi({ label, value, hint, icon, tone = 'default' }: { label: string; value: string; hint: string; icon: any; tone?: 'default' | 'danger' | 'gold' | 'success' }) {
  const Icon = icon;
  return (
    <article className={`kpi ${tone}`}>
      <div className="kpi-head">
        <span>{label}</span>
        <Icon size={14} />
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-hint">{hint}</div>
    </article>
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
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);

      const { data: tasks, error: tasksErr } = await supabase.from('tasks').select('*');
      const { data: proposals, error: propErr } = await supabase.from('proposals').select('*');
      const { data: leads, error: leadsErr } = await supabase
        .from('leads')
        .select('id,name,service_type,pipeline_stage,created_at')
        .order('created_at', { ascending: false })
        .limit(8);

      if (tasksErr || propErr || leadsErr) throw new Error(tasksErr?.message || propErr?.message || leadsErr?.message);

      let todayCount = 0;
      let overdueCount = 0;
      let followups = 0;
      let proposalsCreated = 0;
      let proposalsSent = 0;
      let proposalsSigned = 0;
      let avgValue = 0;
      const financingMix: Record<string, number> = {};

      if (tasks) {
        todayCount = tasks.filter((t: any) => !t.completed && t.due_date === todayStr).length;
        overdueCount = tasks.filter((t: any) => !t.completed && t.due_date < todayStr).length;
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

      setMetrics({
        today: todayCount,
        overdue: overdueCount,
        followups,
        proposalsCreated,
        proposalsSent,
        proposalsSigned,
        proposalConversion: proposalsCreated ? Math.round((proposalsSigned / proposalsCreated) * 100) : 0,
        avgValue,
        financingMix,
      });

      setRecentLeads((leads || []) as LeadRow[]);
    } catch (e: any) {
      setError(e.message || 'Unable to load dashboard metrics');
    }

    setLoading(false);
  }

  const funnel = useMemo(() => {
    const max = Math.max(metrics.proposalsCreated, metrics.proposalsSent, metrics.proposalsSigned, 1);
    return [
      { name: 'Created', value: metrics.proposalsCreated, pct: (metrics.proposalsCreated / max) * 100 },
      { name: 'Sent', value: metrics.proposalsSent, pct: (metrics.proposalsSent / max) * 100 },
      { name: 'Signed', value: metrics.proposalsSigned, pct: (metrics.proposalsSigned / max) * 100 },
    ];
  }, [metrics.proposalsCreated, metrics.proposalsSent, metrics.proposalsSigned]);

  const conversionTrend = trend(metrics.proposalsSigned, Math.max(metrics.proposalsSent, 1));

  if (loading) {
    return (
      <div>
        <Topbar
          eyebrow="Sales Operations"
          title="Dashboard"
          subtitle="Live command center for pipeline and proposal execution."
        />
        <div className="skeleton-grid"><SkeletonMetric width={190} height={88} count={4} /></div>
        <div style={{ marginTop: 12 }}><SkeletonTable rows={6} cols={4} /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-box">
        <h2>Dashboard unavailable</h2>
        <p>{error}</p>
        <button type="button" onClick={fetchMetrics}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dash-wrap">
      <Topbar
        eyebrow="Sales · Command Center"
        title="Dashboard"
        subtitle={`${metrics.proposalsCreated} active proposals · ${metrics.followups} follow-ups pending · synced with MDB Solar CRM`}
        actions={<Link className="header-cta" href="/pipeline">Open Pipeline</Link>}
      />

      <section className="kpi-grid">
        <Kpi label="Tasks Due Today" value={String(metrics.today)} hint="execution queue" icon={ClipboardList} />
        <Kpi label="Overdue Tasks" value={String(metrics.overdue)} hint="requires triage" icon={AlertTriangle} tone="danger" />
        <Kpi label="Follow-Ups" value={String(metrics.followups)} hint="call list" icon={PhoneCall} />
        <Kpi label="Proposals Sent" value={String(metrics.proposalsSent)} hint="ready for close" icon={Send} tone="gold" />
        <Kpi label="Signed" value={String(metrics.proposalsSigned)} hint="won this period" icon={CheckCircle2} tone="success" />
        <Kpi label="Avg Proposal" value={`$${metrics.avgValue.toLocaleString()}`} hint="ticket size" icon={CircleDollarSign} />
      </section>

      <section className="dash-grid">
        <article className="panel span-2">
          <div className="panel-head">
            <h3>Proposal Funnel</h3>
            <div className={`trend ${conversionTrend >= 0 ? 'up' : 'down'}`}>
              {conversionTrend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {Math.abs(conversionTrend)}% conversion signal
            </div>
          </div>
          <div className="funnel-stack">
            {funnel.map((row) => (
              <div key={row.name} className="funnel-row">
                <div className="row-top">
                  <span>{row.name}</span>
                  <strong>{row.value}</strong>
                </div>
                <div className="track">
                  <div className="fill" style={{ width: `${Math.max(10, row.pct)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h3>Financing Mix</h3>
            <Target size={14} />
          </div>
          <div className="mix-list">
            {Object.keys(metrics.financingMix).length === 0 && <p className="muted">No financing data yet.</p>}
            {Object.entries(metrics.financingMix).map(([name, value]) => (
              <div className="mix-row" key={name}>
                <span>{name}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel span-3">
          <div className="panel-head"><h3>Recent Leads</h3></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Service</th>
                  <th>Stage</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.length === 0 && (
                  <tr>
                    <td colSpan={4} className="muted">No leads found.</td>
                  </tr>
                )}
                {recentLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <Link href={`/leads/${lead.id}`} className="lead-link">{lead.name || 'Unnamed Lead'}</Link>
                    </td>
                    <td>
                      <ServicePill service={lead.service_type || 'Solar'} />
                    </td>
                    <td>
                      <StageBadge stage={lead.pipeline_stage || 'New Lead'} />
                    </td>
                    <td>{fmtDate(lead.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <style jsx>{`
        .dash-wrap {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .header-cta {
          border: 1px solid color-mix(in srgb, var(--mdb-primary) 35%, var(--mdb-border));
          background: color-mix(in srgb, var(--mdb-primary) 10%, white);
          color: var(--mdb-primary);
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 8px 11px;
          text-decoration: none;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 10px;
        }
        .kpi {
          border: 1px solid var(--mdb-border);
          border-radius: var(--mdb-radius);
          background: var(--mdb-card);
          padding: 12px;
          box-shadow: var(--mdb-shadow-card);
        }
        .kpi-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: var(--mdb-muted);
          font-size: 0.69rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
        }
        .kpi-value {
          margin-top: 8px;
          font-size: 1.45rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--mdb-foreground);
        }
        .kpi-hint {
          margin-top: 5px;
          color: var(--mdb-muted);
          font-size: 0.76rem;
        }
        .kpi.danger {
          background: color-mix(in srgb, #ef4444 8%, white);
          border-color: color-mix(in srgb, #ef4444 28%, var(--mdb-border));
        }
        .kpi.gold {
          background: color-mix(in srgb, var(--mdb-gold) 10%, white);
          border-color: color-mix(in srgb, var(--mdb-gold) 30%, var(--mdb-border));
        }
        .kpi.success {
          background: color-mix(in srgb, #16a34a 8%, white);
          border-color: color-mix(in srgb, #16a34a 28%, var(--mdb-border));
        }
        .dash-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }
        .panel {
          border: 1px solid var(--mdb-border);
          border-radius: var(--mdb-radius);
          background: var(--mdb-card);
          padding: 12px;
          box-shadow: var(--mdb-shadow-card);
          min-width: 0;
        }
        .span-2 {
          grid-column: span 2;
        }
        .span-3 {
          grid-column: span 3;
        }
        .panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          color: var(--mdb-muted);
        }
        .panel-head h3 {
          margin: 0;
          font-size: 0.95rem;
          color: var(--mdb-foreground);
        }
        .trend {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 4px 8px;
          border-radius: 999px;
        }
        .trend.up {
          background: color-mix(in srgb, #16a34a 15%, white);
          color: #15803d;
        }
        .trend.down {
          background: color-mix(in srgb, #ef4444 15%, white);
          color: #b91c1c;
        }
        .funnel-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .row-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
          color: var(--mdb-muted);
          font-size: 0.86rem;
        }
        .row-top strong {
          color: var(--mdb-foreground);
        }
        .track {
          height: 11px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--mdb-muted) 15%, white);
          overflow: hidden;
        }
        .fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--mdb-primary), var(--mdb-navy));
        }
        .mix-list {
          display: grid;
          gap: 8px;
        }
        .mix-row {
          border: 1px solid var(--mdb-border);
          border-radius: 8px;
          background: color-mix(in srgb, var(--mdb-secondary) 35%, white);
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.85rem;
        }
        .mix-row span {
          color: var(--mdb-muted);
        }
        .mix-row strong {
          color: var(--mdb-foreground);
        }
        .table-wrap {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th,
        td {
          text-align: left;
          border-bottom: 1px solid var(--mdb-border);
          padding: 9px 8px;
          white-space: nowrap;
          font-size: 0.85rem;
        }
        th {
          color: var(--mdb-muted);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        td {
          color: var(--mdb-foreground);
        }
        .lead-link {
          color: var(--mdb-primary);
          text-decoration: none;
          font-weight: 600;
        }
        .muted {
          color: var(--mdb-muted);
        }
        :global(.stage),
        :global(.service) {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          border: 1px solid var(--mdb-border);
          padding: 2px 8px;
          font-size: 10px;
          line-height: 1.5;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        :global(.stage.primary),
        :global(.service.sky),
        :global(.service.cyan) {
          color: var(--mdb-primary);
          background: color-mix(in srgb, var(--mdb-primary) 12%, white);
          border-color: color-mix(in srgb, var(--mdb-primary) 25%, var(--mdb-border));
        }
        :global(.stage.secondary),
        :global(.service.gray) {
          color: var(--mdb-muted);
          background: color-mix(in srgb, var(--mdb-secondary) 42%, white);
        }
        :global(.stage.success),
        :global(.service.emerald) {
          color: #15803d;
          background: color-mix(in srgb, #16a34a 12%, white);
          border-color: color-mix(in srgb, #16a34a 25%, var(--mdb-border));
        }
        :global(.stage.warning),
        :global(.service.orange) {
          color: #b45309;
          background: color-mix(in srgb, #f97316 12%, white);
          border-color: color-mix(in srgb, #f97316 25%, var(--mdb-border));
        }
        :global(.stage.gold),
        :global(.service.gold) {
          color: #92400e;
          background: color-mix(in srgb, var(--mdb-gold) 16%, white);
          border-color: color-mix(in srgb, var(--mdb-gold) 30%, var(--mdb-border));
        }
        :global(.service.violet) {
          color: #6d28d9;
          background: color-mix(in srgb, #8b5cf6 12%, white);
          border-color: color-mix(in srgb, #8b5cf6 25%, var(--mdb-border));
        }
        .error-box {
          border: 1px solid color-mix(in srgb, #ef4444 30%, var(--mdb-border));
          background: color-mix(in srgb, #ef4444 8%, white);
          border-radius: var(--mdb-radius);
          padding: 14px;
        }
        .error-box h2 {
          margin: 0;
          color: #991b1b;
          font-size: 1rem;
        }
        .error-box p {
          color: #b91c1c;
          margin: 7px 0 10px;
        }
        .error-box button {
          border-radius: 8px;
          border: 1px solid #fca5a5;
          background: #fff;
          color: #991b1b;
          font-weight: 700;
          padding: 7px 10px;
        }
        .skeleton-grid {
          margin-top: 10px;
        }
        @media (max-width: 1320px) {
          .kpi-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 980px) {
          .kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .dash-grid {
            grid-template-columns: 1fr;
          }
          .span-2,
          .span-3 {
            grid-column: span 1;
          }
        }
        @media (max-width: 620px) {
          .kpi-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
