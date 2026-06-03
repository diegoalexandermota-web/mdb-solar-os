import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import SkeletonMetric from '../components/SkeletonMetric';
import SkeletonTable from '../components/SkeletonTable';

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

function KpiCard({ label, value, tone }: { label: string; value: string | number; tone?: 'accent' | 'warning' | 'neutral' }) {
  return (
    <article className={`kpi-card${tone ? ` ${tone}` : ''}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
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

  const funnelData = useMemo(
    () => [
      { label: 'Created', value: metrics.proposalsCreated },
      { label: 'Sent', value: metrics.proposalsSent },
      { label: 'Signed', value: metrics.proposalsSigned },
    ],
    [metrics.proposalsCreated, metrics.proposalsSent, metrics.proposalsSigned]
  );

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
        .limit(6);

      if (tasksErr || propErr || leadsErr) {
        throw new Error(tasksErr?.message || propErr?.message || leadsErr?.message);
      }

      let todayCount = 0;
      let overdueCount = 0;
      let followups = 0;
      let proposalsCreated = 0;
      let proposalsSent = 0;
      let proposalsSigned = 0;
      let avgValue = 0;
      const financingMix: Record<string, number> = {};

      // Existing dashboard logic preserved.
      if (tasks) {
        todayCount = tasks.filter((t: any) => !t.completed && t.due_date === todayStr).length;
        overdueCount = tasks.filter((t: any) => !t.completed && t.due_date < todayStr).length;
        followups = tasks.filter((t: any) => !t.completed && t.type === 'Call').length;
      }

      // Existing dashboard logic preserved.
      if (proposals) {
        const active = proposals.filter((p: any) => !p.archived);
        proposalsCreated = active.length;
        proposalsSent = active.filter((p: any) => p.status === 'Sent').length;
        proposalsSigned = active.filter((p: any) => p.status === 'Signed').length;
        avgValue = active.length
          ? Math.round(
              active.reduce((sum: number, p: any) => sum + (Number(p.monthly_bill) || 0), 0) / active.length
            )
          : 0;

        for (const p of active) {
          const pref = p.financing_preference || 'Unknown';
          financingMix[pref] = (financingMix[pref] || 0) + 1;
        }
      }

      const proposalConversion = proposalsCreated
        ? Math.round((proposalsSigned / proposalsCreated) * 100)
        : 0;

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
    <div className="hub-shell">
      <aside className="hub-sidebar">
        <div className="hub-brand">
          <div className="hub-logo">
            <svg width="34" height="34" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="19" cy="19" r="19" fill="#111827" />
              <path d="M19 8L24.5 28H13.5L19 8Z" fill="#f59e0b" />
            </svg>
          </div>
          <div>
            <div className="brand-title">MDB Solar Hub</div>
            <div className="brand-subtitle">Enterprise CRM</div>
          </div>
        </div>

        <nav className="hub-nav">
          <a className="hub-nav-link active" href="/dashboard">Dashboard</a>
          <a className="hub-nav-link" href="/pipeline">Pipeline</a>
          <a className="hub-nav-link" href="/projects">Projects</a>
          <a className="hub-nav-link" href="/proposals">Proposals</a>
          <a className="hub-nav-link" href="/tasks">Tasks</a>
          <a className="hub-nav-link" href="/customer-portal">Customer Portal</a>
        </nav>
      </aside>

      <main className="hub-main">
        <header className="hub-topbar">
          <div>
            <h1>Command Dashboard</h1>
            <p>Track operations, proposals, and follow-ups in one view.</p>
          </div>
          <div className="hub-topbar-actions">
            <button className="ghost-btn" type="button">Light/Dark (Soon)</button>
            <button className="primary-btn" type="button">+ New Lead</button>
          </div>
        </header>

        {loading ? (
          <>
            <div className="kpi-grid">
              <SkeletonMetric width={130} height={66} count={4} />
              <SkeletonMetric width={130} height={66} count={4} />
            </div>
            <div className="section-grid">
              <section className="panel wide"><SkeletonTable rows={4} cols={3} /></section>
              <section className="panel"><SkeletonTable rows={3} cols={2} /></section>
            </div>
          </>
        ) : error ? (
          <div className="error-panel">
            <h3>Unable to load dashboard data.</h3>
            <p>{error}</p>
            <button className="primary-btn" onClick={fetchMetrics}>Try Again</button>
          </div>
        ) : (
          <>
            <section className="kpi-grid">
              <KpiCard label="Tasks Due Today" value={metrics.today} tone="accent" />
              <KpiCard label="Overdue Tasks" value={metrics.overdue} tone="warning" />
              <KpiCard label="Follow-ups Pending" value={metrics.followups} tone="neutral" />
              <KpiCard label="Proposals Created" value={metrics.proposalsCreated} />
              <KpiCard label="Proposals Sent" value={metrics.proposalsSent} />
              <KpiCard label="Signed Proposals" value={metrics.proposalsSigned} />
              <KpiCard label="Proposal Conversion" value={`${metrics.proposalConversion}%`} />
              <KpiCard label="Avg. Proposal Value" value={`$${metrics.avgValue}`} />
            </section>

            <section className="section-grid">
              <article className="panel wide">
                <h2>Pipeline Funnel</h2>
                <div className="funnel-track">
                  {funnelData.map((step, idx) => (
                    <div key={step.label} className="funnel-step">
                      <span>{step.label}</span>
                      <strong>{step.value}</strong>
                      {idx < funnelData.length - 1 && <i>→</i>}
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel">
                <h2>Service Mix</h2>
                <div className="mix-grid">
                  {Object.keys(metrics.financingMix).length === 0 ? (
                    <p className="muted">No financing data yet.</p>
                  ) : (
                    Object.entries(metrics.financingMix as Record<string, number | string>).map(([k, v]) => (
                      <div className="mix-tile" key={k}>
                        <span>{k}</span>
                        <strong>{String(v)}</strong>
                      </div>
                    ))
                  )}
                </div>
              </article>
            </section>

            <section className="section-grid two-columns">
              <article className="panel wide">
                <h2>Recent Leads</h2>
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
                        <tr>
                          <td colSpan={4} className="muted">No leads found.</td>
                        </tr>
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

              <aside className="panel ai-panel">
                <h2>MDB AI Assistant</h2>
                <p>
                  AI insights are enabled for follow-ups, proposal summaries, and next-best actions.
                  Suggested focus: prioritize overdue follow-ups tied to high-bill leads.
                </p>
                <ul>
                  <li>Generate follow-up for stalled leads</li>
                  <li>Review proposal conversion by financing type</li>
                  <li>Draft WhatsApp outreach from AI summary</li>
                </ul>
                <button className="ghost-btn" type="button">Open AI Assistant</button>
              </aside>
            </section>
          </>
        )}
      </main>

      <style jsx>{`
        .hub-shell {
          min-height: 100vh;
          background: radial-gradient(circle at 5% 0%, #1f2937 0%, #111827 28%, #0b1120 100%);
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
        }
        .hub-sidebar {
          background: rgba(3, 7, 18, 0.9);
          border-right: 1px solid rgba(148, 163, 184, 0.18);
          padding: 24px 16px;
          position: sticky;
          top: 0;
          height: 100vh;
        }
        .hub-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .hub-logo {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          background: linear-gradient(135deg, #f59e0b, #f97316);
          display: grid;
          place-items: center;
        }
        .brand-title {
          color: #f8fafc;
          font-size: 1rem;
          font-weight: 700;
        }
        .brand-subtitle {
          color: #94a3b8;
          font-size: 0.78rem;
        }
        .hub-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .hub-nav-link {
          color: #cbd5e1;
          text-decoration: none;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 0.95rem;
          transition: 0.2s ease;
        }
        .hub-nav-link:hover,
        .hub-nav-link.active {
          background: rgba(30, 41, 59, 0.92);
          color: #fff;
        }
        .hub-main {
          padding: 28px;
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
        }
        .hub-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }
        .hub-topbar h1 {
          margin: 0;
          color: #0f172a;
          font-size: 1.85rem;
          letter-spacing: -0.03em;
        }
        .hub-topbar p {
          margin: 8px 0 0;
          color: #475569;
        }
        .hub-topbar-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .primary-btn,
        .ghost-btn {
          border: none;
          border-radius: 10px;
          padding: 10px 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .primary-btn {
          background: linear-gradient(130deg, #0f172a, #1d4ed8);
          color: #fff;
        }
        .ghost-btn {
          background: #e2e8f0;
          color: #0f172a;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }
        .kpi-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 14px;
          box-shadow: 0 10px 30px -20px rgba(15, 23, 42, 0.35);
        }
        .kpi-card.accent {
          background: linear-gradient(140deg, #172554, #1e3a8a);
          color: #fff;
          border: none;
        }
        .kpi-card.warning {
          background: linear-gradient(140deg, #78350f, #b45309);
          color: #fff;
          border: none;
        }
        .kpi-card.neutral {
          background: linear-gradient(140deg, #0f172a, #334155);
          color: #fff;
          border: none;
        }
        .kpi-label {
          font-size: 0.83rem;
          opacity: 0.85;
          margin-bottom: 8px;
        }
        .kpi-value {
          font-size: 1.7rem;
          font-weight: 700;
        }
        .section-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }
        .section-grid.two-columns {
          align-items: start;
        }
        .panel {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 16px;
          box-shadow: 0 10px 30px -22px rgba(15, 23, 42, 0.35);
        }
        .panel.wide {
          min-width: 0;
        }
        .panel h2 {
          margin: 0 0 12px;
          font-size: 1.05rem;
          color: #0f172a;
        }
        .funnel-track {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }
        .funnel-step {
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 12px;
          background: #f8fafc;
          position: relative;
        }
        .funnel-step span {
          display: block;
          font-size: 0.84rem;
          color: #475569;
        }
        .funnel-step strong {
          font-size: 1.3rem;
          color: #0f172a;
        }
        .funnel-step i {
          position: absolute;
          right: -12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-style: normal;
          font-size: 1rem;
        }
        .mix-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .mix-tile {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px;
          background: #f8fafc;
        }
        .mix-tile span {
          color: #64748b;
          font-size: 0.82rem;
        }
        .mix-tile strong {
          display: block;
          margin-top: 6px;
          color: #0f172a;
          font-size: 1.1rem;
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
          padding: 10px 8px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.9rem;
        }
        th {
          color: #475569;
          font-weight: 600;
        }
        td {
          color: #0f172a;
        }
        .ai-panel p {
          margin: 0 0 10px;
          color: #334155;
          line-height: 1.45;
        }
        .ai-panel ul {
          margin: 0 0 14px;
          padding-left: 18px;
          color: #334155;
        }
        .muted {
          color: #64748b;
        }
        .error-panel {
          background: #fff;
          border: 1px solid #fecaca;
          border-radius: 14px;
          padding: 18px;
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
          .section-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 900px) {
          .hub-shell {
            grid-template-columns: 1fr;
          }
          .hub-sidebar {
            position: static;
            height: auto;
            padding: 12px;
          }
          .hub-nav {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .hub-main {
            padding: 14px;
          }
          .hub-topbar {
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
