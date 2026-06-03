import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Search,
  Filter,
  X,
  Phone,
  Mail,
  MessageSquare,
  ExternalLink,
  Flame,
  Clock,
  ShieldCheck,
  FileText,
  AlertTriangle,
  DollarSign,
  Sun,
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { ServicePill, Topbar } from '../components/layout/Topbar';

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
  city?: string | null;
  pipeline_stage: string | null;
  priority: string | null;
  service_type: string | null;
  utility_company: string | null;
  created_at?: string | null;
};

function fmtCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}

function stageValue(stage: string) {
  const map: Record<string, number> = {
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
  return map[stage] || 18000;
}

function priorityClass(p: string | null) {
  const s = (p || '').toLowerCase();
  if (s.includes('high')) return 'high';
  if (s.includes('med')) return 'medium';
  return 'low';
}

export default function Pipeline() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [service, setService] = useState('');
  const [priority, setPriority] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  useEffect(() => {
    void fetchPipeline();
  }, []);

  async function fetchPipeline() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('leads')
      .select('id,name,email,phone,city,pipeline_stage,priority,service_type,utility_company,created_at,archived')
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (error) setError(error.message || 'Unable to load pipeline.');
    else setLeads((data || []) as Lead[]);

    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const stage = lead.pipeline_stage || 'New Lead';
      if (service && (lead.service_type || '') !== service) return false;
      if (priority && (lead.priority || '') !== priority) return false;
      if (stageFilter && stage !== stageFilter) return false;
      if (!q) return true;
      const hay = `${lead.name || ''} ${lead.phone || ''} ${lead.email || ''} ${lead.utility_company || ''} ${lead.city || ''} ${stage}`.toLowerCase();
      return hay.includes(q);
    });
  }, [leads, priority, query, service, stageFilter]);

  const services = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.service_type) set.add(l.service_type);
    });
    return Array.from(set.values()).sort();
  }, [leads]);

  const activeFilters = [service, priority, stageFilter].filter(Boolean).length;

  const totalValue = filtered.reduce((sum, lead) => sum + stageValue(lead.pipeline_stage || 'New Lead'), 0);

  const byStage = useMemo(() => {
    return STAGES.map((stage) => ({
      stage,
      items: filtered.filter((lead) => (lead.pipeline_stage || 'New Lead') === stage),
    }));
  }, [filtered]);

  const insights = {
    followUpToday: filtered.filter((l) => (l.pipeline_stage || '') !== 'Commission Paid' && (l.pipeline_stage || '') !== 'Installed').length,
    hotStuck: filtered.filter((l) => priorityClass(l.priority) === 'high' && ['Contacted', 'Appointment Set', 'Proposal Sent'].includes(l.pipeline_stage || '')).length,
    creditReady: filtered.filter((l) => ['Proposal Sent', 'Credit Approved'].includes(l.pipeline_stage || '')).length,
    atRisk: filtered.filter((l) => (l.pipeline_stage || '') === 'Permit' || priorityClass(l.priority) === 'high').length,
    commissions: filtered.filter((l) => (l.pipeline_stage || '') === 'PTO').length,
  };

  function clearFilters() {
    setService('');
    setPriority('');
    setStageFilter('');
  }

  if (loading) {
    return (
      <div className="pipeline-wrap">
        <Topbar
          eyebrow="Sales Operations"
          title="Pipeline"
          subtitle="Loading live board state and activity indicators."
        />
        <div className="loading-box">Loading leads...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-box">
        <h2>Pipeline unavailable</h2>
        <p>{error}</p>
        <button type="button" onClick={fetchPipeline}>Retry</button>
      </div>
    );
  }

  return (
    <div className="pipeline-wrap">
      <Topbar
        eyebrow="Sales · Command Center"
        title="Pipeline"
        subtitle={`${filtered.length} leads · ${fmtCurrency(totalValue)} weighted value · synced with project tracker`}
      />

      <section className="search-card">
        <div className="search-row">
          <Search size={15} className="search-icon" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, phone, email, city, utility, or stage..."
          />
          {query && (
            <button type="button" className="clear-btn" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filter-row">
          <div className="filter-label"><Filter size={13} /> Filters {activeFilters > 0 ? <span className="count">{activeFilters}</span> : null}</div>
          <select value={service} onChange={(e) => setService(e.target.value)}>
            <option value="">Service: All</option>
            {services.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">Priority: All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
            <option value="">Stage: All</option>
            {STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
          </select>
          {activeFilters > 0 && <button type="button" className="clear-all" onClick={clearFilters}>Clear all</button>}
        </div>
      </section>

      <section className="insights">
        <div className="insight-head">
          <div className="sun"><Sun size={14} /></div>
          <div>
            <strong>MDB AI · Pipeline Brief</strong>
            <p>Live analysis from your visible board</p>
          </div>
        </div>
        <div className="insight-grid">
          <div className="insight-chip"><Clock size={13} /> {insights.followUpToday} Follow up today</div>
          <div className="insight-chip danger"><Flame size={13} /> {insights.hotStuck} Hot and stuck</div>
          <div className="insight-chip success"><ShieldCheck size={13} /> {insights.creditReady} Credit ready</div>
          <div className="insight-chip gold"><FileText size={13} /> {insights.creditReady} Proposals to close</div>
          <div className="insight-chip danger"><AlertTriangle size={13} /> {insights.atRisk} Projects at risk</div>
          <div className="insight-chip gold"><DollarSign size={13} /> {insights.commissions} Commission pending</div>
        </div>
      </section>

      <section className="board-scroll">
        <div className="board" style={{ minWidth: `${STAGES.length * 294}px` }}>
          {byStage.map((col) => {
            const colValue = col.items.reduce((sum, lead) => sum + stageValue(lead.pipeline_stage || 'New Lead'), 0);
            return (
              <article key={col.stage} className="column">
                <header className="col-head">
                  <div className="name">{col.stage}</div>
                  <div className="pill">{col.items.length}</div>
                </header>
                <div className="col-sub">{fmtCurrency(colValue)} pipeline</div>
                <div className="col-body">
                  {col.items.length === 0 && <div className="empty">No leads</div>}
                  {col.items.map((lead) => (
                    <div key={lead.id} className="lead-card" role="button" tabIndex={0} onClick={() => router.push(`/leads/${lead.id}`)}>
                      <div className="lead-head">
                        <div className="lead-title">{lead.name || 'Unnamed Lead'}</div>
                        <span className={`priority ${priorityClass(lead.priority)}`}>{lead.priority || 'Low'}</span>
                      </div>

                      <div className="line"><ServicePill service={lead.service_type || 'Solar'} /><span>· {lead.utility_company || 'Unknown Utility'}</span></div>
                      <div className="meta">{lead.city || 'City unavailable'}</div>

                      <div className="actions">
                        <button type="button" title="Call" onClick={(e) => { e.stopPropagation(); if (lead.phone) window.open(`tel:${lead.phone}`); }}><Phone size={13} /></button>
                        <button type="button" title="SMS" onClick={(e) => { e.stopPropagation(); if (lead.phone) window.open(`sms:${lead.phone}`); }}><MessageSquare size={13} /></button>
                        <button type="button" title="Email" onClick={(e) => { e.stopPropagation(); if (lead.email) window.open(`mailto:${lead.email}`); }}><Mail size={13} /></button>
                        <Link href={`/proposals?lead_id=${lead.id}`} onClick={(e) => e.stopPropagation()} title="Proposal"><FileText size={13} /></Link>
                        <button type="button" title="Open" onClick={(e) => { e.stopPropagation(); router.push(`/leads/${lead.id}`); }}><ExternalLink size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <style jsx>{`
        .pipeline-wrap {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .search-card {
          border: 1px solid var(--mdb-border);
          border-radius: var(--mdb-radius);
          background: var(--mdb-card);
          padding: 10px;
          box-shadow: var(--mdb-shadow-card);
        }
        .search-row {
          position: relative;
          margin-bottom: 8px;
        }
        .search-row input {
          width: 100%;
          border: 1px solid var(--mdb-border);
          border-radius: 8px;
          padding: 9px 32px;
          margin: 0;
          background: color-mix(in srgb, var(--mdb-secondary) 42%, white);
        }
        .search-icon {
          position: absolute;
          left: 10px;
          top: 10px;
          color: var(--mdb-muted);
        }
        .clear-btn {
          position: absolute;
          right: 7px;
          top: 6px;
          border: none;
          background: transparent;
          color: var(--mdb-muted);
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: grid;
          place-items: center;
        }
        .filter-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 7px;
        }
        .filter-label {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--mdb-muted);
          font-weight: 700;
          margin-right: 2px;
        }
        .count {
          width: 16px;
          height: 16px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: var(--mdb-primary);
          color: #fff;
          font-size: 10px;
        }
        select {
          border: 1px solid var(--mdb-border);
          border-radius: 8px;
          margin: 0;
          font-size: 12px;
          padding: 6px 8px;
          background: var(--mdb-card);
        }
        .clear-all {
          border: none;
          background: transparent;
          color: var(--mdb-primary);
          font-size: 12px;
          font-weight: 700;
          margin-left: auto;
        }
        .insights {
          border-radius: var(--mdb-radius);
          padding: 12px;
          background: linear-gradient(120deg, var(--mdb-navy), var(--mdb-primary));
          color: #fff;
          border: 1px solid color-mix(in srgb, var(--mdb-navy) 65%, #fff);
          box-shadow: var(--mdb-shadow-elegant);
        }
        .insight-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .sun {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          background: color-mix(in srgb, var(--mdb-gold) 80%, white);
          color: #111827;
          display: grid;
          place-items: center;
        }
        .insight-head strong {
          font-size: 0.84rem;
        }
        .insight-head p {
          margin: 2px 0 0;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          opacity: 0.75;
        }
        .insight-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 7px;
        }
        .insight-chip {
          background: color-mix(in srgb, #fff 12%, transparent);
          border: 1px solid color-mix(in srgb, #fff 25%, transparent);
          border-radius: 9px;
          padding: 8px;
          font-size: 11px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .insight-chip.danger {
          color: #fecaca;
        }
        .insight-chip.success {
          color: #bbf7d0;
        }
        .insight-chip.gold {
          color: #fde68a;
        }
        .board-scroll {
          overflow-x: auto;
          margin: 0 -16px;
          padding: 0 16px 10px;
        }
        .board {
          display: flex;
          gap: 8px;
        }
        .column {
          width: 286px;
          flex-shrink: 0;
          border: 1px solid var(--mdb-border);
          border-radius: var(--mdb-radius);
          background: color-mix(in srgb, var(--mdb-secondary) 38%, white);
          display: flex;
          flex-direction: column;
          max-height: calc(100vh - 275px);
          min-height: 450px;
        }
        .col-head {
          padding: 10px 10px 5px;
          border-bottom: 1px solid var(--mdb-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .name {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 800;
          color: var(--mdb-foreground);
        }
        .pill {
          min-width: 20px;
          text-align: center;
          border-radius: 6px;
          border: 1px solid var(--mdb-border);
          padding: 2px 6px;
          font-size: 11px;
          font-weight: 700;
          background: var(--mdb-card);
        }
        .col-sub {
          padding: 6px 10px;
          color: var(--mdb-muted);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-bottom: 1px solid var(--mdb-border);
        }
        .col-body {
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          overflow-y: auto;
        }
        .empty {
          border: 1px dashed var(--mdb-border);
          border-radius: 8px;
          color: var(--mdb-muted);
          font-size: 12px;
          text-align: center;
          padding: 18px 8px;
        }
        .lead-card {
          border: 1px solid var(--mdb-border);
          border-left: 3px solid color-mix(in srgb, var(--mdb-primary) 45%, var(--mdb-border));
          border-radius: 10px;
          background: var(--mdb-card);
          padding: 9px;
          box-shadow: var(--mdb-shadow-card);
          cursor: pointer;
        }
        .lead-head {
          display: flex;
          justify-content: space-between;
          gap: 7px;
          align-items: flex-start;
        }
        .lead-title {
          font-size: 0.86rem;
          color: var(--mdb-foreground);
          font-weight: 700;
        }
        .priority {
          border-radius: 999px;
          padding: 2px 7px;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 800;
          border: 1px solid transparent;
          white-space: nowrap;
        }
        .priority.high {
          color: #b91c1c;
          background: color-mix(in srgb, #ef4444 18%, white);
          border-color: color-mix(in srgb, #ef4444 35%, var(--mdb-border));
        }
        .priority.medium {
          color: #92400e;
          background: color-mix(in srgb, var(--mdb-gold) 18%, white);
          border-color: color-mix(in srgb, var(--mdb-gold) 35%, var(--mdb-border));
        }
        .priority.low {
          color: var(--mdb-muted);
          background: color-mix(in srgb, var(--mdb-secondary) 55%, white);
          border-color: var(--mdb-border);
        }
        .line {
          margin-top: 7px;
          display: flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
        }
        .line span {
          font-size: 11px;
          color: var(--mdb-muted);
        }
        .meta {
          margin-top: 5px;
          font-size: 11px;
          color: var(--mdb-muted);
        }
        .actions {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid var(--mdb-border);
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .actions button,
        .actions :global(a) {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          border: none;
          color: var(--mdb-muted);
          background: transparent;
          display: grid;
          place-items: center;
        }
        .actions button:hover,
        .actions :global(a:hover) {
          color: var(--mdb-primary);
          background: color-mix(in srgb, var(--mdb-primary) 9%, white);
        }
        .loading-box,
        .error-box {
          border: 1px solid var(--mdb-border);
          border-radius: var(--mdb-radius);
          background: var(--mdb-card);
          padding: 16px;
        }
        .error-box {
          border-color: color-mix(in srgb, #ef4444 30%, var(--mdb-border));
          background: color-mix(in srgb, #ef4444 8%, white);
        }
        .error-box h2 {
          margin: 0;
          color: #991b1b;
          font-size: 1rem;
        }
        .error-box p {
          margin: 8px 0 10px;
          color: #b91c1c;
        }
        .error-box button {
          border: 1px solid #fca5a5;
          border-radius: 8px;
          padding: 7px 10px;
          background: #fff;
          color: #991b1b;
          font-weight: 700;
        }
        @media (max-width: 1280px) {
          .insight-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 900px) {
          .board-scroll {
            margin: 0 -12px;
            padding: 0 12px 8px;
          }
          .insight-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 620px) {
          .insight-grid {
            grid-template-columns: 1fr;
          }
          .filter-row select {
            flex: 1 1 100%;
          }
        }
      `}</style>
    </div>
  );
}
