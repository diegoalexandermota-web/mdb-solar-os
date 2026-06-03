import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../utils/supabaseClient';
import EmptyState from '../components/EmptyState';
import SkeletonCard from '../components/SkeletonCard';
import AIAssistantPanel from '../components/ai/AIAssistantPanel';

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
];

type Lead = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  pipeline_stage: string | null;
  priority: string | null;
  service_type: string | null;
  utility_company: string | null;
};

function priorityTone(priority: string | null) {
  if (!priority) return 'low';
  const p = priority.toLowerCase();
  if (p.includes('high')) return 'high';
  if (p.includes('med')) return 'med';
  return 'low';
}

export default function Pipeline() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All Stages');

  useEffect(() => {
    fetchPipeline();
  }, []);

  async function fetchPipeline() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('leads')
      .select('id,name,email,phone,pipeline_stage,priority,service_type,utility_company,archived')
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message || 'Unable to load pipeline.');
    } else {
      setLeads((data || []) as Lead[]);
    }
    setLoading(false);
  }

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = leads.filter((lead) => {
      const stage = lead.pipeline_stage || 'New Lead';
      if (stageFilter !== 'All Stages' && stage !== stageFilter) return false;
      if (!q) return true;
      return [lead.name, lead.email, lead.phone, lead.service_type, lead.utility_company, stage]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });

    return STAGES.map((stage) => ({
      stage,
      items: filtered.filter((lead) => (lead.pipeline_stage || 'New Lead') === stage),
    })).filter((column) => stageFilter === 'All Stages' || column.stage === stageFilter || column.items.length > 0);
  }, [leads, search, stageFilter]);

  return (
    <div className="pipeline-page">
      <section className="pipeline-header">
        <div>
          <h2>Pipeline Command Center</h2>
          <p>Review stage distribution, search quickly, and prioritize high-intent leads.</p>
        </div>
        <div className="pipeline-actions">
          <input
            className="input"
            type="text"
            placeholder="Search leads, email, stage..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="select" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
            <option>All Stages</option>
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </div>
      </section>

      {loading ? (
        <div className="loading-wrap"><SkeletonCard count={4} /></div>
      ) : error ? (
        <EmptyState icon="⚠️" message={error} action actionLabel="Retry" onAction={fetchPipeline} />
      ) : (
        <div className="pipeline-main-grid">
          <section className="board-wrap">
            <div className="board-scroll">
              {grouped.length === 0 ? (
                <div className="column empty">
                  <EmptyState icon="📉" message="No leads matched your filters." />
                </div>
              ) : (
                grouped.map((column) => (
                  <article key={column.stage} className="column">
                    <header className="column-head">
                      <div className="column-title">{column.stage}</div>
                      <div className="column-count">{column.items.length}</div>
                    </header>

                    <div className="column-body">
                      {column.items.length === 0 ? (
                        <p className="muted">No leads</p>
                      ) : (
                        column.items.map((lead) => (
                          <div key={lead.id} className="lead-card">
                            <div className="lead-top">
                              <strong>{lead.name || 'Unnamed Lead'}</strong>
                              <span className={`badge ${priorityTone(lead.priority)}`}>{lead.priority || 'Low'}</span>
                            </div>
                            <div className="meta">{lead.email || '-'}</div>
                            <div className="meta">{lead.service_type || 'Service N/A'} • {lead.utility_company || 'Utility N/A'}</div>

                            <div className="lead-actions">
                              <button
                                type="button"
                                className="act"
                                onClick={() => lead.phone && window.open(`tel:${lead.phone}`)}
                                disabled={!lead.phone}
                              >
                                Call
                              </button>
                              <button
                                type="button"
                                className="act"
                                onClick={() => lead.phone && window.open(`sms:${lead.phone}`)}
                                disabled={!lead.phone}
                              >
                                SMS
                              </button>
                              <button
                                type="button"
                                className="act open"
                                onClick={() => router.push(`/leads/${lead.id}`)}
                              >
                                Open
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <AIAssistantPanel
            title="AI Pipeline Brief"
            description="Suggested next actions based on current stage distribution and engagement patterns."
            bullets={[
              'Prioritize New Lead and Proposal Sent columns first',
              'Contact high-priority leads missing a same-day follow-up',
              'Escalate stalled Contract Signed leads to install prep tasks',
            ]}
            actionLabel="Generate Pipeline Brief"
          />
        </div>
      )}

      <style jsx>{`
        .pipeline-page {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pipeline-header {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          box-shadow: 0 8px 24px -20px rgba(15, 23, 42, 0.45);
          padding: 14px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .pipeline-header h2 {
          margin: 0;
          font-size: 1.2rem;
          color: #0f172a;
        }
        .pipeline-header p {
          margin: 6px 0 0;
          color: #475569;
          font-size: 0.9rem;
        }
        .pipeline-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .input,
        .select {
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 9px 10px;
          font-size: 0.9rem;
          background: #fff;
          min-width: 190px;
        }
        .input:focus,
        .select:focus {
          outline: none;
          border-color: #2563eb;
        }
        .loading-wrap {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 16px;
        }
        .pipeline-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 12px;
          align-items: start;
        }
        .board-wrap {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          box-shadow: 0 8px 24px -20px rgba(15, 23, 42, 0.45);
          padding: 12px;
        }
        .board-scroll {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(250px, 250px);
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .column {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          max-height: 72vh;
        }
        .column.empty {
          grid-column: span 2;
          min-height: 220px;
          justify-content: center;
        }
        .column-head {
          position: sticky;
          top: 0;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 12px 12px 0 0;
        }
        .column-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #0f172a;
        }
        .column-count {
          font-size: 0.76rem;
          padding: 3px 8px;
          border-radius: 999px;
          background: #e2e8f0;
          color: #334155;
          font-weight: 700;
        }
        .column-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 10px;
          overflow-y: auto;
        }
        .lead-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px;
          box-shadow: 0 6px 16px -18px rgba(15, 23, 42, 0.5);
        }
        .lead-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          margin-bottom: 6px;
        }
        .lead-top strong {
          color: #0f172a;
          font-size: 0.9rem;
        }
        .meta {
          color: #475569;
          font-size: 0.8rem;
          margin-bottom: 4px;
        }
        .badge {
          font-size: 0.67rem;
          border-radius: 999px;
          padding: 2px 8px;
          font-weight: 700;
          color: #fff;
        }
        .badge.high {
          background: #dc2626;
        }
        .badge.med {
          background: #d97706;
        }
        .badge.low {
          background: #475569;
        }
        .lead-actions {
          display: flex;
          gap: 6px;
          margin-top: 8px;
        }
        .act {
          border: none;
          border-radius: 8px;
          padding: 6px 8px;
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
          color: #0f172a;
          background: #e2e8f0;
        }
        .act.open {
          background: linear-gradient(135deg, #1d4ed8, #2563eb);
          color: #fff;
        }
        .act:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .muted {
          margin: 0;
          color: #64748b;
          font-size: 0.82rem;
        }
        @media (max-width: 1280px) {
          .pipeline-main-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .input,
          .select {
            min-width: 100%;
          }
          .board-scroll {
            grid-auto-columns: minmax(88vw, 88vw);
          }
        }
      `}</style>
    </div>
  );
}
