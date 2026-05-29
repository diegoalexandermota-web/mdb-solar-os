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
    <div>
      <h1>Proposals</h1>
      <button onClick={() => { setModalOpen(true); setEditProposal(null); }}>New Proposal</button>
      <ProposalModal open={modalOpen || !!editProposal} onClose={() => { setModalOpen(false); setEditProposal(null); }} onSave={handleSave} proposal={editProposal} />
      {toast && <div style={{position:'fixed',top:10,right:10,background:'#2b3990',color:'#fff',padding:'0.5rem 1rem',borderRadius:4}}>{toast}</div>}
      {loading ? (
        <SkeletonTable rows={6} cols={4} />
      ) : error ? (
        <ErrorState message="Unable to load proposals." error={error} onRetry={fetchProposals} />
      ) : proposals.filter(p => !p.archived).length === 0 ? (
        <EmptyState icon="📄" message="No proposals found. Create your first proposal to begin." action actionLabel="New Proposal" onAction={() => setModalOpen(true)} />
      ) : (
        <ul>
          {proposals.filter(p => !p.archived).map(proposal => (
            <li key={proposal.id} style={{marginBottom:8,background:'#fff',padding:8,borderRadius:4}}>
              <b>{proposal.customer_name}</b> ({proposal.status})
              <span style={{marginLeft:8}}>Lead: <button onClick={() => openLead(proposal.lead_id)}>Open</button></span>
              <button onClick={() => { setEditProposal(proposal); setModalOpen(false); }}>Edit</button>
              <button onClick={() => handleArchive(proposal.id)}>Archive</button>
              <button onClick={() => handleDuplicate(proposal)}>Duplicate</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
