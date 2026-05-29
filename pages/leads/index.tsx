import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import NewLeadModal from '../../components/NewLeadModal';
import EditLeadModal from '../../components/EditLeadModal';
import SkeletonTable from '../../components/SkeletonTable';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ pipeline_stage: '', archived: false });
  const [toast, setToast] = useState<string|null>(null);

  useEffect(() => {
    fetchLeads();
  }, [filters]);

  async function fetchLeads() {
    setLoading(true);
    setError(null);
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (!filters.archived) query = query.eq('archived', false);
    if (filters.pipeline_stage) query = query.eq('pipeline_stage', filters.pipeline_stage);
    const { data, error } = await query;
    if (!error) setLeads(data || []);
    else setError(error.message || 'Unable to load leads');
    setLoading(false);
  }

  async function handleCreate(lead: any) {
    await supabase.from('leads').insert([lead]);
    setToast('Lead created');
    fetchLeads();
  }

  async function handleEdit(lead: any) {
    if (!selectedLead) return;
    const { error } = await supabase.from('leads').update(lead).eq('id', selectedLead.id);
    if (!error) setToast('Lead updated');
    else setToast('Error updating lead');
    setEditModalOpen(false);
    setSelectedLead(null);
    fetchLeads();
  }

  async function handleArchive(id: string) {
    await supabase.from('leads').update({ archived: true }).eq('id', id);
    setToast('Lead archived');
    fetchLeads();
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
  }

  function handleFilterChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  }

  function handleShowArchived() {
    setFilters(f => ({ ...f, archived: !f.archived }));
  }

  function filteredLeads() {
    let filtered = leads;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(l =>
        (l.name || '').toLowerCase().includes(s) ||
        (l.email || '').toLowerCase().includes(s) ||
        (l.phone || '').toLowerCase().includes(s) ||
        (l.address || '').toLowerCase().includes(s) ||
        (l.city || '').toLowerCase().includes(s) ||
        (l.utility_company || '').toLowerCase().includes(s)
      );
    }
    return filtered;
  }

  function handleAction(type: string, lead: any) {
    if (type === 'call') window.open(`tel:${lead.phone}`);
    else if (type === 'sms') window.open(`sms:${lead.phone}`);
    else if (type === 'whatsapp') window.open(`https://wa.me/${lead.phone?.replace(/\D/g, '')}`);
    else if (type === 'email') window.open(`mailto:${lead.email}`);
    else setToast('Coming soon.');
  }

  return (
    <div>
      <h1>Leads</h1>
      <button onClick={() => setModalOpen(true)}>New Lead</button>
      <button onClick={handleShowArchived}>{filters.archived ? 'Hide Archived' : 'Show Archived'}</button>
      <input placeholder="Search" value={search} onChange={handleSearchChange} style={{marginLeft:8}} />
      <select name="pipeline_stage" value={filters.pipeline_stage} onChange={handleFilterChange}>
        <option value="">All Stages</option>
        {['New Lead','Contacted','Appointment Set','Proposal Sent','Credit Approved','Contract Signed','Site Survey','Permit','Install Scheduled','Installed','PTO','Commission Paid'].map(stage => (
          <option key={stage} value={stage}>{stage}</option>
        ))}
      </select>
      <NewLeadModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} />
      <EditLeadModal open={editModalOpen} onClose={() => { setEditModalOpen(false); setSelectedLead(null); }} onSave={handleEdit} lead={selectedLead} />
      {toast && <div style={{position:'fixed',top:10,right:10,background:'#2b3990',color:'#fff',padding:'0.5rem 1rem',borderRadius:4}}>{toast}</div>}
      {loading ? (
        <SkeletonTable rows={6} cols={4} />
      ) : error ? (
        <ErrorState message="Unable to load leads." error={error} onRetry={fetchLeads} />
      ) : filteredLeads().length === 0 ? (
        <EmptyState icon="📇" message="No leads found. Create your first lead to begin." action actionLabel="New Lead" onAction={() => setModalOpen(true)} />
      ) : (
        <ul>
          {filteredLeads().map(lead => (
            <li key={lead.id} style={{marginBottom:8,background:lead.archived?'#eee':'#fff',padding:8,borderRadius:4}}>
              <b>{lead.name}</b> ({lead.email})
              <span style={{marginLeft:8}}>Stage: {lead.pipeline_stage}</span>
              <button onClick={() => { setSelectedLead(lead); setEditModalOpen(true); }}>Edit</button>
              <button onClick={() => handleArchive(lead.id)} disabled={lead.archived}>Archive</button>
              <button onClick={() => handleAction('call', lead)} disabled={!lead.phone}>Call</button>
              <button onClick={() => handleAction('sms', lead)} disabled={!lead.phone}>SMS</button>
              <button onClick={() => handleAction('whatsapp', lead)} disabled={!lead.phone}>WhatsApp</button>
              <button onClick={() => handleAction('email', lead)} disabled={!lead.email}>Email</button>
              <button onClick={() => setToast('Coming soon.')}>Schedule Task</button>
              <button onClick={() => setToast('Coming soon.')}>Create Proposal</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
