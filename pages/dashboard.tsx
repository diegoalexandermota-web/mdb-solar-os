import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import SkeletonMetric from '../components/SkeletonMetric';
import SkeletonTable from '../components/SkeletonTable';
import AIAssistantPanel from '../components/ai/AIAssistantPanel';

type MetricState = {
  today: number;
  overdue: number;
  followups: number;
  proposalsCreated: number;
  proposalsSent: number;
  proposalsSigned: number;
  proposalConversion: number;
  avgValue: number;
  financingMix: Record<string, number | string>;
};

type LeadRow = {
  id: string;
  name: string | null;
  service_type: string | null;
  pipeline_stage: string | null;
  created_at: string | null;
};

function KpiCard({ label, value, tone }: { label: string; value: string | number; tone?: 'blue' | 'amber' | 'slate' }) {
  return (
    <article className={`kpi-card${tone ? ` ${tone}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function formatDate(value: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString();
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

  const funnelBars = useMemo(() => {
    const max = Math.max(metrics.proposalsCreated, metrics.proposalsSent, metrics.proposalsSigned, 1);
    return [
      { label: 'Created', value: metrics.proposalsCreated, width: (metrics.proposalsCreated / max) * 100 },
      { label: 'Sent', value: metrics.proposalsSent, width: (metrics.proposalsSent / max) * 100 },
      { label: 'Signed', value: metrics.proposalsSigned, width: (metrics.proposalsSigned / max) * 100 },
    ];
  }, [metrics.proposalsCreated, metrics.proposalsSent, metrics.proposalsSigned]);

  useEffect(() => {
    fetchMetrics();
    // eslint-disable-next-line
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

      // Existing dashboard task metrics logic preserved.
      if (tasks) {
        todayCount = tasks.filter((t: any) => !t.completed && t.due_date === todayStr).length;
        overdueCount = tasks.filter((t: any) => !t.completed && t.due_date < todayStr).length;
        followups = tasks.filter((t: any) => !t.completed && t.type === 'Call').length;
      }

      // Existing dashboard proposal metrics logic preserved.
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

      setRecentLeads((leads || []) as LeadRow[]);
    } catch (e: any) {
      setError(e.message || 'Unable to load dashboard metrics');
    }
    setLoading(false);
  }

  return (
    <div className="dashboard-page">
      <section className="welcome-strip">
        <div>
          <h2>Good afternoon, MDB Team</h2>
          <p>Monitor pipeline health, proposal momentum, and top-priority follow-ups.</p>
        </div>
        <div className="welcome-actions">
          <button className="ghost-btn" type="button">Light/Dark (Soon)</button>
          <button className="primary-btn" type="button">+ New Lead</button>
        </div>
      </section>

      {loading ? (
        <>
          <div className="kpi-grid">
            <SkeletonMetric width={140} height={72} count={4} />
            <SkeletonMetric width={140} height={72} count={4} />
          </div>
          <div className="main-grid">
            <section className="panel span-2"><SkeletonTable rows={5} cols={3} /></section>
            <section className="panel"><SkeletonTable rows={4} cols={2} /></section>
          </div>
        </>
      ) : error ? (
        <div className="error-panel">
          <h3>Unable to load dashboard metrics.</h3>
          <p>{error}</p>
          <button className="primary-btn" type="button" onClick={fetchMetrics}>Try Again</button>
        </div>
      ) : (
        <>
          <section className="kpi-grid">
            <KpiCard label="Tasks Due Today" value={metrics.today} tone="blue" />
            <KpiCard label="Overdue Tasks" value={metrics.overdue} tone="amber" />
            <KpiCard label="Follow-ups Pending" value={metrics.followups} tone="slate" />
            <KpiCard label="Proposals Created" value={metrics.proposalsCreated} />
            <KpiCard label="Proposals Sent" value={metrics.proposalsSent} />
            <KpiCard label="Signed Proposals" value={metrics.proposalsSigned} />
            <KpiCard label="Proposal Conversion" value={`${metrics.proposalConversion}%`} />
            <KpiCard label="Avg. Proposal Value" value={`$${metrics.avgValue}`} />
          </section>

          <section className="main-grid">
            <article className="panel span-2">
              <h3>Pipeline Funnel</h3>
              <div className="funnel-bars">
                {funnelBars.map((bar) => (
                  <div key={bar.label} className="funnel-row">
                    <div className="funnel-row-head">
                      <span>{bar.label}</span>
                      <strong>{bar.value}</strong>
                    </div>
                    <div className="funnel-track">
                      <div className="funnel-fill" style={{ width: `${Math.max(bar.width, 10)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <h3>Service Mix</h3>
              <div className="mix-grid">
                {Object.keys(metrics.financingMix).length === 0 ? (
                  <p className="muted">No financing data yet.</p>
                ) : (
                  Object.entries(metrics.financingMix as Record<string, number | string>).map(([k, v]) => (
                    <div className="mix-item" key={k}>
                      <span>{k}</span>
                      <strong>{String(v)}</strong>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="panel span-2">
              <h3>Recent Leads</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Service</th>
                      <th>Stage</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeads.length === 0 ? (
                      <tr><td colSpan={4} className="muted">No leads found.</td></tr>
                    ) : (
                      recentLeads.map((lead) => (
                        <tr key={lead.id}>
                          <td>{lead.name || '-'}</td>
                          <td>{lead.service_type || '-'}</td>
                          <td>{lead.pipeline_stage || '-'}</td>
                          <td>{formatDate(lead.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <AIAssistantPanel
              title="MDB AI Assistant"
              description="Operational summary powered by your current CRM data and proposal progress."
              bullets={[
                'Prioritize overdue follow-ups tied to high monthly bill leads',
                'Review signed-to-sent conversion trend by financing mix',
                'Trigger AI follow-up generation for stalled prospects',
              ]}
            />
          </section>
        </>
      )}

      <style jsx>{`
        .dashboard-page {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .welcome-strip {
          background: linear-gradient(135deg, #0f172a, #1d4ed8);
          border-radius: 16px;
          color: #fff;
          padding: 18px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }
        .welcome-strip h2 {
          margin: 0;
          font-size: 1.35rem;
        }
        .welcome-strip p {
          margin: 8px 0 0;
          color: #cbd5e1;
          max-width: 650px;
        }
        .welcome-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .primary-btn,
        .ghost-btn {
          border: none;
          border-radius: 10px;
          padding: 9px 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .primary-btn {
          background: linear-gradient(135deg, #f59e0b, #f97316);
          color: #111827;
        }
        .ghost-btn {
          background: rgba(148, 163, 184, 0.2);
          color: #fff;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }
        .kpi-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 14px;
          box-shadow: 0 8px 24px -20px rgba(15, 23, 42, 0.45);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .kpi-card span {
          color: #64748b;
          font-size: 0.79rem;
          font-weight: 600;
        }
        .kpi-card strong {
          color: #0f172a;
          font-size: 1.6rem;
          letter-spacing: -0.02em;
        }
        .kpi-card.blue,
        .kpi-card.amber,
        .kpi-card.slate {
          border: none;
        }
        .kpi-card.blue {
          background: linear-gradient(135deg, #1e3a8a, #1d4ed8);
        }
        .kpi-card.amber {
          background: linear-gradient(135deg, #92400e, #f59e0b);
        }
        .kpi-card.slate {
          background: linear-gradient(135deg, #0f172a, #334155);
        }
        .kpi-card.blue span,
        .kpi-card.amber span,
        .kpi-card.slate span,
        .kpi-card.blue strong,
        .kpi-card.amber strong,
        .kpi-card.slate strong {
          color: #fff;
        }
        .main-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 12px;
        }
        .panel {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 14px;
          box-shadow: 0 8px 24px -20px rgba(15, 23, 42, 0.42);
        }
        .panel.span-2 {
          min-width: 0;
        }
        .panel h3 {
          margin: 0 0 10px;
          color: #0f172a;
          font-size: 1rem;
        }
        .funnel-bars {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .funnel-row-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          margin-bottom: 5px;
          color: #334155;
        }
        .funnel-track {
          width: 100%;
          height: 11px;
          border-radius: 999px;
          background: #e2e8f0;
          overflow: hidden;
        }
        .funnel-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #1d4ed8, #38bdf8);
        }
        .mix-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .mix-item {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .mix-item span {
          color: #64748b;
          font-size: 0.8rem;
        }
        .mix-item strong {
          color: #0f172a;
          font-size: 1.05rem;
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
          padding: 9px 8px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.88rem;
        }
        th {
          color: #64748b;
          font-weight: 700;
        }
        td {
          color: #0f172a;
        }
        .muted {
          color: #64748b;
        }
        .error-panel {
          background: #fff;
          border: 1px solid #fecaca;
          border-radius: 14px;
          padding: 14px;
        }
        .error-panel h3 {
          margin: 0;
          color: #b91c1c;
        }
        .error-panel p {
          color: #7f1d1d;
        }
        @media (max-width: 1200px) {
          .kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .main-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 720px) {
          .welcome-strip {
            flex-direction: column;
          }
          .kpi-grid {
            grid-template-columns: 1fr;
          }
          .mix-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
