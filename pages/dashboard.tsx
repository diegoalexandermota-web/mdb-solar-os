
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import SkeletonLoader from '../components/SkeletonLoader';
import SkeletonCard from '../components/SkeletonCard';
import SkeletonTable from '../components/SkeletonTable';
import SkeletonMetric from '../components/SkeletonMetric';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{
    today: number;
    overdue: number;
    followups: number;
    proposalsCreated: number;
    proposalsSent: number;
    proposalsSigned: number;
    proposalConversion: number;
    avgValue: number;
    financingMix: Record<string, number | string>;
  }>({
    today: 0,
    overdue: 0,
    followups: 0,
    proposalsCreated: 0,
    proposalsSent: 0,
    proposalsSigned: 0,
    proposalConversion: 0,
    avgValue: 0,
    financingMix: {}
  });


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
      if (tasksErr || propErr) throw new Error(tasksErr?.message || propErr?.message);
      let todayCount = 0, overdueCount = 0, followups = 0;
      let proposalsCreated = 0, proposalsSent = 0, proposalsSigned = 0, avgValue = 0, financingMix: Record<string, number> = {};
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
          ? Math.round(
              active.reduce((sum: number, p: any) => sum + (Number(p.monthly_bill) || 0), 0) /
                active.length
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
        financingMix
      });
    } catch (e: any) {
      setError(e.message || 'Unable to load dashboard metrics');
    }
    setLoading(false);
  }

  return (
    <div className="dashboard-root">
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo-row">
          <div className="dashboard-logo-circle">
            <svg width="34" height="34" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="19" cy="19" r="19" fill="#2b3990"/>
              <path d="M19 8L24.5 28H13.5L19 8Z" fill="#fbb040"/>
            </svg>
          </div>
          <span className="dashboard-title">MDB Solar OS</span>
        </div>
        <nav className="dashboard-nav">
          <a className="dashboard-nav-link active">Dashboard</a>
          <a className="dashboard-nav-link" href="/pipeline">Pipeline</a>
          <a className="dashboard-nav-link" href="/projects">Projects</a>
          <a className="dashboard-nav-link" href="/proposals">Proposals</a>
          <a className="dashboard-nav-link" href="/tasks">Tasks</a>
        </nav>
      </aside>
      <main className="dashboard-main">
        <h1 className="dashboard-heading">Dashboard</h1>
        {loading ? (
          <div className="dashboard-kpi-row">
            <SkeletonMetric width={110} height={54} count={4} />
            <SkeletonMetric width={110} height={54} count={4} />
          </div>
        ) : error ? (
          <div className="dashboard-error">
            <div className="dashboard-error-title">Unable to load dashboard metrics.</div>
            <div className="dashboard-error-msg">{error}</div>
            <button className="dashboard-btn" onClick={fetchMetrics}>Try Again</button>
          </div>
          ) : (
            <>
              <div className="dashboard-kpi-row">
                <div className="dashboard-kpi-card kpi-blue">
                  <div className="kpi-label">Tasks Due Today</div>
                  <div className="kpi-value">{metrics.today}</div>
                </div>
                <div className="dashboard-kpi-card kpi-yellow">
                  <div className="kpi-label">Overdue Tasks</div>
                  <div className="kpi-value">{metrics.overdue}</div>
                </div>
                <div className="dashboard-kpi-card kpi-dark">
                  <div className="kpi-label">Follow-ups Pending</div>
                  <div className="kpi-value">{metrics.followups}</div>
                </div>
                <div className="dashboard-kpi-card kpi-outline">
                  <div className="kpi-label">Proposals Created</div>
                  <div className="kpi-value">{metrics.proposalsCreated}</div>
                </div>
                <div className="dashboard-kpi-card kpi-outline">
                  <div className="kpi-label">Proposals Sent</div>
                  <div className="kpi-value">{metrics.proposalsSent}</div>
                </div>
                <div className="dashboard-kpi-card kpi-outline">
                  <div className="kpi-label">Signed Proposals</div>
                  <div className="kpi-value">{metrics.proposalsSigned}</div>
                </div>
                <div className="dashboard-kpi-card kpi-outline">
                  <div className="kpi-label">Proposal Conversion</div>
                  <div className="kpi-value">{metrics.proposalConversion}%</div>
                </div>
                <div className="dashboard-kpi-card kpi-outline">
                  <div className="kpi-label">Avg. Proposal Value</div>
                  <div className="kpi-value">${metrics.avgValue}</div>
                </div>
              </div>
              <div className="dashboard-sections">
                <section className="dashboard-section">
                  <h2>Pipeline Funnel</h2>
                  <div className="dashboard-pipeline-funnel">
                    <div className="funnel-card">
                      <div className="funnel-label">Created</div>
                      <div className="funnel-value">{metrics.proposalsCreated}</div>
                    </div>
                    <div className="funnel-arrow">→</div>
                    <div className="funnel-card">
                      <div className="funnel-label">Sent</div>
                      <div className="funnel-value">{metrics.proposalsSent}</div>
                    </div>
                    <div className="funnel-arrow">→</div>
                    <div className="funnel-card">
                      <div className="funnel-label">Signed</div>
                      <div className="funnel-value">{metrics.proposalsSigned}</div>
                    </div>
                  </div>
                </section>
                <section className="dashboard-section">
                  <h2>Service Mix</h2>
                  <div className="dashboard-service-mix">
                    {Object.keys(metrics.financingMix).length === 0 ? (
                      <div className="service-mix-empty">No financing data yet.</div>
                    ) : (
                      Object.entries(metrics.financingMix as Record<string, number | string>).map(([k, v]) => (
                        <div className="service-mix-card" key={k}>
                          <span className="service-mix-label">{k}</span>
                          <span className="service-mix-value">{String(v)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </section>
                <section className="dashboard-section ai-section">
                  <h2>AI Insights</h2>
                  <div className="ai-card">
                    <div className="ai-icon">🤖</div>
                    <div className="ai-message">AI-powered insights coming soon for your pipeline and proposals.</div>
                  </div>
                </section>
              </div>
            </>
          )}
        </main>
        <style jsx>{`
          .dashboard-root {
            display: flex;
            min-height: 100vh;
            background: #f4f6fa;
          }
          .dashboard-sidebar {
            background: #1a1d2e;
            color: #fff;
            min-width: 220px;
            width: 220px;
            padding: 2.5rem 1.2rem 1.2rem 1.2rem;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }
          .dashboard-logo-row {
            display: flex;
            align-items: center;
            gap: 0.7rem;
            margin-bottom: 2.5rem;
          }
          .dashboard-logo-circle {
            background: #fff;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(43,57,144,0.10);
            padding: 0.3rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .dashboard-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #fbb040;
            letter-spacing: -0.5px;
          }
          .dashboard-nav {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            width: 100%;
          }
          .dashboard-nav-link {
            color: #fff;
            text-decoration: none;
            font-size: 1.08rem;
            font-weight: 500;
            padding: 0.7em 1em;
            border-radius: 7px;
            transition: background 0.16s;
          }
          .dashboard-nav-link.active, .dashboard-nav-link:hover {
            background: #2b3990;
            color: #fbb040;
          }
          .dashboard-main {
            flex: 1;
            padding: 2.5rem 2.5rem 2.5rem 2.5rem;
            min-width: 0;
            display: flex;
            flex-direction: column;
          }
          .dashboard-heading {
            font-size: 2rem;
            font-weight: 700;
            color: #2b3990;
            margin-bottom: 2.2rem;
          }
          .dashboard-kpi-row {
            display: flex;
            flex-wrap: wrap;
            gap: 1.5rem;
            margin-bottom: 2.5rem;
          }
          .dashboard-kpi-card {
            background: #fff;
            border-radius: 14px;
            box-shadow: 0 2px 12px rgba(43,57,144,0.07);
            padding: 1.2rem 2.2rem;
            min-width: 110px;
            flex: 1 1 180px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            border: none;
          }
          .kpi-blue {
            background: linear-gradient(90deg, #2b3990 80%, #fbb040 100%);
            color: #fff;
          }
          .kpi-yellow {
            background: linear-gradient(90deg, #fbb040 80%, #2b3990 100%);
            color: #2b3990;
          }
          .kpi-dark {
            background: #1a1d2e;
            color: #fff;
          }
          .kpi-outline {
            border: 1.5px solid #2b3990;
            background: #fff;
            color: #2b3990;
          }
          .kpi-label {
            font-size: 1.02rem;
            font-weight: 500;
            margin-bottom: 0.3em;
          }
          .kpi-value {
            font-size: 2.1rem;
            font-weight: 700;
          }
          .dashboard-sections {
            display: flex;
            flex-wrap: wrap;
            gap: 2.5rem;
            margin-top: 2.5rem;
          }
          .dashboard-section {
            background: #fff;
            border-radius: 14px;
            box-shadow: 0 2px 12px rgba(43,57,144,0.07);
            padding: 2rem 2rem 1.5rem 2rem;
            min-width: 320px;
            flex: 1 1 340px;
            display: flex;
            flex-direction: column;
          }
          .dashboard-section h2 {
            color: #2b3990;
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 1.2rem;
          }
          .dashboard-pipeline-funnel {
            display: flex;
            align-items: center;
            gap: 1.2rem;
          }
          .funnel-card {
            background: #e9edf7;
            border-radius: 10px;
            padding: 1.1rem 1.7rem;
            text-align: center;
            min-width: 90px;
          }
          .funnel-label {
            color: #2b3990;
            font-size: 1.01rem;
            font-weight: 600;
          }
          .funnel-value {
            color: #1a1d2e;
            font-size: 1.5rem;
            font-weight: 700;
          }
          .funnel-arrow {
            font-size: 2rem;
            color: #b0b6d1;
          }
          .dashboard-service-mix {
            display: flex;
            flex-wrap: wrap;
            gap: 1.1rem;
          }
          .service-mix-card {
            background: #e9edf7;
            border-radius: 8px;
            padding: 0.8em 1.3em;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            min-width: 90px;
          }
          .service-mix-label {
            color: #2b3990;
            font-size: 1.01rem;
            font-weight: 600;
          }
          .service-mix-value {
            color: #1a1d2e;
            font-size: 1.2rem;
            font-weight: 700;
          }
          .service-mix-empty {
            color: #b0b6d1;
            font-size: 1.1rem;
          }
          .ai-section {
            min-width: 320px;
            flex: 1 1 340px;
          }
          .ai-card {
            background: #e9edf7;
            border-radius: 10px;
            padding: 1.5rem 1.2rem;
            display: flex;
            align-items: center;
            gap: 1.2rem;
          }
          .ai-icon {
            font-size: 2.2rem;
          }
          .ai-message {
            color: #2b3990;
            font-size: 1.1rem;
            font-weight: 500;
          }
          .dashboard-error {
            background: #fff3f3;
            color: #b00020;
            padding: 1.5rem 2rem;
            border-radius: 10px;
            margin: 2rem 0;
            text-align: center;
          }
          .dashboard-error-title {
            font-weight: 700;
            font-size: 1.2rem;
          }
          .dashboard-error-msg {
            margin: 1em 0;
          }
          .dashboard-btn {
            background: #2b3990;
            color: #fff;
            border: none;
            padding: 0.7em 1.5em;
            border-radius: 7px;
            font-weight: 600;
            font-size: 1.05rem;
            margin-top: 1em;
            transition: background 0.18s;
          }
          .dashboard-btn:hover {
            background: #fbb040;
            color: #2b3990;
          }
          @media (max-width: 900px) {
            .dashboard-root {
              flex-direction: column;
            }
            .dashboard-sidebar {
              position: static;
              width: 100vw;
              min-width: unset;
              flex-direction: row;
              align-items: center;
              justify-content: flex-start;
              padding: 1.2rem 0.7rem;
              gap: 1.5rem;
            }
            .dashboard-logo-row {
              margin-bottom: 0;
            }
            .dashboard-nav {
              flex-direction: row;
              gap: 0.5rem;
            }
            .dashboard-main {
              padding: 1.2rem 0.7rem;
            }
            .dashboard-kpi-row {
              gap: 0.7rem;
            }
            .dashboard-section {
              padding: 1.2rem 0.7rem 1rem 0.7rem;
              min-width: 90vw;
              border-radius: 10px;
            }
          }
        `}</style>
      </div>
    );
  }
