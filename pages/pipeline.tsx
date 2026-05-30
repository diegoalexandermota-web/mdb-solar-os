
export default function Pipeline() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  // Example pipeline data for mobile audit
  const [data, setData] = useState<any[]>([
    { stage: 'New Lead', leads: [
      { id: 1, name: 'Jane Doe', phone: '+15555550123', email: 'jane@example.com', actions: ['call','sms','whatsapp','open'], priority: 'High' },
      { id: 2, name: 'John Smith', phone: '+15555550124', email: 'john@example.com', actions: ['call','sms','open'], priority: 'Medium' },
    ] },
    { stage: 'Proposal Sent', leads: [
      { id: 3, name: 'Alice Solar', phone: '+15555550125', email: 'alice@example.com', actions: ['call','sms','whatsapp','open'], priority: 'Low' },
    ] },
    { stage: 'Installed', leads: [] },
  ]);

  useEffect(() => {
    setLoading(false);
  }, []);

  const STAGES = data.map(col => col.stage);

  return (
    <div className="pipeline-root">
      <header className="pipeline-header">
        <div className="pipeline-header-main">
          <div className="pipeline-header-title-row">
            <svg width="32" height="32" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="19" cy="19" r="19" fill="#2b3990"/>
              <path d="M19 8L24.5 28H13.5L19 8Z" fill="#fbb040"/>
            </svg>
            <span className="pipeline-header-title">Pipeline Command Center</span>
          </div>
          <div className="pipeline-header-actions">
            <input className="pipeline-search" type="text" placeholder="Search leads..." />
            <select className="pipeline-filter">
              <option>All Stages</option>
              {STAGES.map(stage => <option key={stage}>{stage}</option>)}
            </select>
          </div>
        </div>
        <div className="pipeline-brief">
          <div className="pipeline-brief-icon">🤖</div>
          <div className="pipeline-brief-content">
            <div className="pipeline-brief-title">AI Pipeline Brief</div>
            <div className="pipeline-brief-desc">AI-powered pipeline insights coming soon. Stay tuned for smart recommendations and lead prioritization.</div>
          </div>
        </div>
      </header>
      {loading ? (
        <div className="pipeline-loading"><SkeletonCard count={3} /></div>
      ) : error ? (
        <EmptyState icon="⚠️" message="Unable to load pipeline." />
      ) : data.length === 0 ? (
        <EmptyState icon="📈" message="No pipeline data yet. Create your first lead to begin." />
      ) : (
        <div className="pipeline-board">
          {data.map((col, idx) => (
            <div key={col.stage} className="pipeline-column">
              <div className="pipeline-stage-header">{col.stage}</div>
              <div className="pipeline-card-stack">
                {col.leads.length === 0 ? (
                  <div className="pipeline-no-leads">No leads</div>
                ) : col.leads.map(lead => (
                  <div key={lead.id} className="pipeline-lead-card">
                    <div className="lead-card-row">
                      <span className="lead-card-name">{lead.name}</span>
                      {lead.priority && <span className={`lead-card-priority priority-${lead.priority.toLowerCase()}`}>{lead.priority}</span>}
                    </div>
                    <div className="lead-card-email">{lead.email}</div>
                    <div className="lead-card-actions">
                      {lead.actions.includes('call') && <button className="lead-action-btn call" onClick={()=>window.open(`tel:${lead.phone}`)}>Call</button>}
                      {lead.actions.includes('sms') && <button className="lead-action-btn sms" onClick={()=>window.open(`sms:${lead.phone}`)}>SMS</button>}
                      {lead.actions.includes('whatsapp') && <button className="lead-action-btn whatsapp" onClick={()=>window.open(`https://wa.me/${lead.phone.replace(/\D/g,'')}`)}>WhatsApp</button>}
                      {lead.actions.includes('open') && <button className="lead-action-btn open" onClick={()=>window.open(`/leads/${lead.id}`)}>Open Lead</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <style jsx>{`
        .pipeline-root {
          background: #f4f6fa;
          min-height: 100vh;
          padding-bottom: 2.5rem;
        }
        .pipeline-header {
          background: #fff;
          box-shadow: 0 2px 12px rgba(43,57,144,0.07);
          border-radius: 0 0 18px 18px;
          padding: 2.2rem 2.2rem 1.2rem 2.2rem;
          margin-bottom: 1.5rem;
        }
        .pipeline-header-main {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
        }
        .pipeline-header-title-row {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }
        .pipeline-header-title {
          font-size: 1.45rem;
          font-weight: 700;
          color: #2b3990;
          letter-spacing: -0.5px;
        }
        .pipeline-header-actions {
          display: flex;
          gap: 0.7rem;
        }
        .pipeline-search {
          border: 1.5px solid #dbe2f3;
          border-radius: 7px;
          padding: 0.6em 1em;
          font-size: 1rem;
          outline: none;
          min-width: 180px;
        }
        .pipeline-search:focus {
          border-color: #2b3990;
        }
        .pipeline-filter {
          border: 1.5px solid #dbe2f3;
          border-radius: 7px;
          padding: 0.6em 1em;
          font-size: 1rem;
          outline: none;
        }
        .pipeline-brief {
          display: flex;
          align-items: center;
          gap: 1.1rem;
          margin-top: 1.7rem;
          background: #e9edf7;
          border-radius: 10px;
          padding: 1.2rem 1.2rem;
        }
        .pipeline-brief-icon {
          font-size: 2.1rem;
        }
        .pipeline-brief-title {
          color: #2b3990;
          font-size: 1.13rem;
          font-weight: 700;
        }
        .pipeline-brief-desc {
          color: #1a1d2e;
          font-size: 1.01rem;
          font-weight: 500;
        }
        .pipeline-board {
          display: flex;
          gap: 1.3rem;
          min-width: 600px;
          max-width: 100vw;
          overflow-x: auto;
          padding: 0 2.2rem;
          scrollbar-width: thin;
        }
        .pipeline-column {
          flex: 0 0 270px;
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 2px 8px rgba(43,57,144,0.06);
          min-height: 340px;
          display: flex;
          flex-direction: column;
          padding: 1.1rem 0.7rem 1.1rem 0.7rem;
        }
        .pipeline-stage-header {
          position: sticky;
          top: 0;
          z-index: 2;
          background: #fff;
          padding: 0.5rem 0;
          font-weight: 700;
          color: #2b3990;
          font-size: 1.13rem;
          border-bottom: 1px solid #eee;
        }
        .pipeline-card-stack {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 13px;
        }
        .pipeline-no-leads {
          color: #aaa;
          font-size: 0.98rem;
          padding: 1.5rem 0;
          text-align: center;
        }
        .pipeline-lead-card {
          background: #f4f6fa;
          border-radius: 10px;
          padding: 1.1rem 1rem;
          box-shadow: 0 1px 4px rgba(43,57,144,0.04);
          display: flex;
          flex-direction: column;
          gap: 7px;
          border-left: 6px solid #2b3990;
          position: relative;
        }
        .lead-card-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.7rem;
        }
        .lead-card-name {
          font-weight: 700;
          font-size: 1.08rem;
          color: #2b3990;
        }
        .lead-card-priority {
          font-size: 0.93rem;
          font-weight: 700;
          padding: 0.18em 0.7em;
          border-radius: 7px;
          margin-left: 0.2em;
        }
        .priority-high {
          background: #b00020;
          color: #fff;
        }
        .priority-medium {
          background: #fbb040;
          color: #2b3990;
        }
        .priority-low {
          background: #b0b6d1;
          color: #fff;
        }
        .lead-card-email {
          font-size: 0.97rem;
          color: #444;
        }
        .lead-card-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-top: 4px;
        }
        .lead-action-btn {
          border-radius: 7px;
          font-weight: 600;
          font-size: 0.97rem;
          padding: 0.5em 1em;
          border: none;
          box-shadow: 0 1px 4px rgba(43,57,144,0.04);
          transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.13s;
        }
        .lead-action-btn.call, .lead-action-btn.sms {
          background: #2b3990;
          color: #fff;
        }
        .lead-action-btn.whatsapp {
          background: #25d366;
          color: #fff;
        }
        .lead-action-btn.open {
          background: #fbb040;
          color: #2b3990;
        }
        .lead-action-btn:active {
          background: #1a1d2e;
          color: #fff;
          transform: scale(0.97);
        }
        @media (max-width: 900px) {
          .pipeline-header {
            padding: 1.2rem 0.7rem 1rem 0.7rem;
            border-radius: 0 0 13px 13px;
          }
          .pipeline-board {
            min-width: 600px;
            padding: 0 0.7rem;
          }
          .pipeline-column {
            min-width: 90vw;
            max-width: 98vw;
            padding: 0.7rem 0.3rem 0.7rem 0.3rem;
          }
        }
        @media (max-width: 600px) {
          .pipeline-header {
            padding: 0.7rem 0.2rem 0.7rem 0.2rem;
            border-radius: 0 0 10px 10px;
          }
          .pipeline-board {
            min-width: 400px;
            padding: 0 0.2rem;
          }
          .pipeline-column {
            min-width: 96vw;
            max-width: 99vw;
            padding: 0.3rem 0.1rem 0.3rem 0.1rem;
          }
          .pipeline-lead-card {
            padding: 0.75rem 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
