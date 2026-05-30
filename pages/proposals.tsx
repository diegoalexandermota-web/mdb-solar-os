import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import ProposalModal from '../components/ProposalModal';
import { useRouter } from 'next/router';
import SkeletonTable from '../components/SkeletonTable';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

export default function Proposals() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProposal, setEditProposal] = useState<any>(null);
  const [toast, setToast] = useState<string|null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchProposals();
  }, []);

  async function fetchProposals() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('proposals').select('*').order('created_at', { ascending: false });
    if (!error) setProposals(data || []);
    else setError(error.message || 'Unable to load proposals');
    setLoading(false);
  }

  async function handleSave(proposal: any) {
    if (editProposal) {
      await supabase.from('proposals').update(proposal).eq('id', editProposal.id);
      setToast('Proposal updated');
    } else {
      await supabase.from('proposals').insert([proposal]);
      setToast('Proposal created');
    }
    setModalOpen(false);
    setEditProposal(null);
    fetchProposals();
  }

  async function handleArchive(id: string) {
    await supabase.from('proposals').update({ archived: true }).eq('id', id);
    setToast('Proposal archived');
    fetchProposals();
  }

  async function handleDuplicate(proposal: any) {
    const { id, created_at, updated_at, ...rest } = proposal;
    await supabase.from('proposals').insert([{ ...rest, status: 'Draft' }]);
    setToast('Proposal duplicated');
    fetchProposals();
  }

  function openLead(lead_id: string) {
    router.push(`/leads/${lead_id}`);
  }

  return (
    <div className="proposals-root">
      {/* Command Center Header */}
      <div className="proposals-header card">
        <div className="proposals-header-main">
          <div className="proposals-header-title-row">
            <svg width="32" height="32" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="19" cy="19" r="19" fill="#2b3990"/>
              <path d="M19 8L24.5 28H13.5L19 8Z" fill="#fbb040"/>
            </svg>
            <span className="proposals-header-title">Proposal Command Center</span>
          </div>
          <button className="proposals-new-btn" onClick={() => { setModalOpen(true); setEditProposal(null); }}>New Proposal</button>
        </div>
      </div>
      <ProposalModal open={modalOpen || !!editProposal} onClose={() => { setModalOpen(false); setEditProposal(null); }} onSave={handleSave} proposal={editProposal} />
      {toast && <div className="dashboard-toast" style={{position:'fixed',top:10,right:10,zIndex:1000}}>{toast}</div>}
      {loading ? (
        <SkeletonTable rows={6} cols={4} />
      ) : error ? (
        <ErrorState message="Unable to load proposals." error={error} onRetry={fetchProposals} />
      ) : proposals.filter(p => !p.archived).length === 0 ? (
        <EmptyState icon="📄" message="No proposals found. Create your first proposal to begin." action actionLabel="New Proposal" onAction={() => setModalOpen(true)} />
      ) : (
        <div className="proposals-list">
          {proposals.filter(p => !p.archived).map(proposal => (
            <div key={proposal.id} className="proposal-card card">
              <div className="proposal-card-header">
                <span className="proposal-customer-name">{proposal.customer_name}</span>
                <span className="proposal-status">{proposal.status}</span>
              </div>
              <div className="proposal-card-meta">
                <span>Lead: <button className="proposal-lead-btn" onClick={() => openLead(proposal.lead_id)}>Open</button></span>
                <span>Created: {proposal.created_at?.slice(0,10)}</span>
              </div>
              <div className="proposal-card-actions">
                <button className="proposal-action-btn" onClick={() => { setEditProposal(proposal); setModalOpen(false); }}>Edit</button>
                <button className="proposal-action-btn" onClick={() => handleArchive(proposal.id)}>Archive</button>
                <button className="proposal-action-btn" onClick={() => handleDuplicate(proposal)}>Duplicate</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <style jsx>{`
        .proposals-root {
          max-width: 900px;
          margin: 0 auto;
          padding: 2.5rem 1rem 3rem 1rem;
        }
        .card {
          margin-bottom: 1.7rem;
        }
        .proposals-header {
          background: #fff;
          box-shadow: 0 2px 12px rgba(43,57,144,0.07);
          border-radius: 0 0 18px 18px;
          padding: 2.2rem 2.2rem 1.2rem 2.2rem;
          margin-bottom: 1.5rem;
        }
        .proposals-header-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .proposals-header-title-row {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }
        .proposals-header-title {
          font-size: 1.45rem;
          font-weight: 700;
          color: #2b3990;
          letter-spacing: -0.5px;
        }
        .proposals-new-btn {
          background: #fbb040;
          color: #2b3990;
          border: none;
          border-radius: 7px;
          font-weight: 700;
          font-size: 1.07rem;
          padding: 0.7em 1.3em;
          box-shadow: 0 1px 4px rgba(43,57,144,0.04);
          transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.13s;
        }
        .proposals-list {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }
        .proposal-card {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          padding: 1.2rem 1.1rem;
        }
        .proposal-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .proposal-customer-name {
          font-size: 1.13rem;
          font-weight: 700;
          color: #2b3990;
        }
        .proposal-status {
          background: #b0b6d1;
          color: #fff;
          border-radius: 7px;
          padding: 0.18em 0.7em;
          font-size: 0.93rem;
          font-weight: 700;
        }
        .proposal-card-meta {
          display: flex;
          gap: 1.2rem;
          color: #444;
          font-size: 1.01rem;
        }
        .proposal-card-actions {
          display: flex;
          gap: 0.7rem;
        }
        .proposal-action-btn, .proposal-lead-btn {
          border-radius: 7px;
          font-weight: 600;
          font-size: 0.97rem;
          padding: 0.5em 1em;
          border: none;
          box-shadow: 0 1px 4px rgba(43,57,144,0.04);
          transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.13s;
        }
        .proposal-action-btn:active, .proposal-lead-btn:active {
          background: #1a1d2e;
          color: #fff;
          transform: scale(0.97);
        }
        @media (max-width: 900px) {
          .proposals-root {
            padding: 1.2rem 0.2rem 2rem 0.2rem;
          }
          .card {
            padding: 1.1rem;
          }
        }
        @media (max-width: 600px) {
          .proposals-root {
            padding: 0.7rem 0.1rem 1.2rem 0.1rem;
          }
          .card {
            padding: 0.7rem 0.3rem;
          }
        }
      `}</style>
    </div>
  );
}
