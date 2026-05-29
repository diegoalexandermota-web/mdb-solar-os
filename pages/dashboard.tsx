
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import SkeletonLoader from '../components/SkeletonLoader';

export default function Dashboard() {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div>
      <h1>Dashboard</h1>
      {loading ? (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <SkeletonLoader height={80} width={180} count={3} />
          <SkeletonLoader height={80} width={180} count={3} />
        </div>
      ) : error ? (
        <div
          style={{
            background: '#fff3f3',
            color: '#b00020',
            padding: '1rem 2rem',
            borderRadius: 8,
            margin: '2rem 0',
            textAlign: 'center'
          }}
        >
          <div style={{ fontWeight: 600 }}>Unable to load dashboard metrics.</div>
          <div style={{ margin: '1em 0' }}>{error}</div>
          <button
            onClick={fetchMetrics}
            style={{
              background: '#2b3990',
              color: '#fff',
              border: 'none',
              padding: '0.5em 1.5em',
              borderRadius: 4
            }}
          >
            Try Again
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ background: '#2b3990', color: '#fff', padding: '1rem 2rem', borderRadius: 8, minWidth: 180 }}>
            <h2>{metrics.today}</h2>
            <div>Tasks Due Today</div>
          </div>
          <div style={{ background: '#fbb040', color: '#2b3990', padding: '1rem 2rem', borderRadius: 8, minWidth: 180 }}>
            <h2>{metrics.overdue}</h2>
            <div>Overdue Tasks</div>
          </div>
          <div style={{ background: '#1a1d2e', color: '#fff', padding: '1rem 2rem', borderRadius: 8, minWidth: 180 }}>
            <h2>{metrics.followups}</h2>
            <div>Follow-ups Pending</div>
          </div>
          <div style={{ background: '#fff', color: '#2b3990', padding: '1rem 2rem', borderRadius: 8, border: '1px solid #2b3990', minWidth: 180 }}>
            <h2>{metrics.proposalsCreated}</h2>
            <div>Proposals Created</div>
          </div>
          <div style={{ background: '#fff', color: '#2b3990', padding: '1rem 2rem', borderRadius: 8, border: '1px solid #2b3990', minWidth: 180 }}>
            <h2>{metrics.proposalsSent}</h2>
            <div>Proposals Sent</div>
          </div>
          <div style={{ background: '#fff', color: '#2b3990', padding: '1rem 2rem', borderRadius: 8, border: '1px solid #2b3990', minWidth: 180 }}>
            <h2>{metrics.proposalsSigned}</h2>
            <div>Signed Proposals</div>
          </div>
          <div style={{ background: '#fff', color: '#2b3990', padding: '1rem 2rem', borderRadius: 8, border: '1px solid #2b3990', minWidth: 180 }}>
            <h2>{metrics.proposalConversion}%</h2>
            <div>Proposal Conversion Rate</div>
          </div>
          <div style={{ background: '#fff', color: '#2b3990', padding: '1rem 2rem', borderRadius: 8, border: '1px solid #2b3990', minWidth: 180 }}>
            <h2>${metrics.avgValue}</h2>
            <div>Avg. Proposal Value</div>
          </div>
          <div style={{ background: '#fff', color: '#2b3990', padding: '1rem 2rem', borderRadius: 8, border: '1px solid #2b3990', minWidth: 180 }}>
            <h2>Financing Mix</h2>
            <div>
              {Object.keys(metrics.financingMix).length === 0 ? (
                <div style={{ color: '#888' }}>No financing data yet.</div>
              ) : (
                Object.entries(metrics.financingMix as Record<string, number | string>).map(([k, v]) => (
                  <div key={k}>
                    {k}: {String(v)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
