
import EmptyState from '../../components/EmptyState';
import SkeletonTable from '../../components/SkeletonTable';
import ErrorState from '../../components/ErrorState';
import AIAssistantPanel from '../../components/AIAssistantPanel';
import EditLeadModal from '../../components/EditLeadModal';
import TaskModal from '../../components/TaskModal';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

export default function LeadDetail() {
  const router = useRouter();
  const { id } = router.query;
  const leadId = Array.isArray(id) ? id[0] : id;

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);

  // Edit lead handler
  const handleEdit = async (updatedLead: any) => {
    if (!leadId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .update({
        ...updatedLead,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .select()
      .single();

    setLoading(false);

    if (error) {
      setToast('Unable to update lead');
      return;
    }

    setLead(data);
    setEditModalOpen(false);
    setToast('Lead updated successfully');
  };

  // Archive the lead
  const handleArchive = async () => {
    if (!leadId) return;
    setLoading(true);
    const { error } = await supabase
      .from('leads')
      .update({ archived: true, updated_at: new Date().toISOString() })
      .eq('id', leadId);
    if (!error) {
      setLead((prev: any) => ({ ...prev, archived: true }));
      setToast('Lead archived');
    } else {
      setToast('Error archiving lead');
    }
    setLoading(false);
  };

  // Change pipeline stage
  const handleStageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!leadId) return;
    const newStage = e.target.value;
    setLoading(true);
    const { error } = await supabase
      .from('leads')
      .update({ pipeline_stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', leadId);
    if (!error) {
      setLead((prev: any) => ({ ...prev, pipeline_stage: newStage }));
      setToast('Stage updated');
    } else {
      setToast('Error updating stage');
    }
    setLoading(false);
  };

  // Fetch lead details
  const fetchLead = async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('leads').select('*').eq('id', leadId).single();
      if (!error) setLead(data);
      else setLead(null);
    } catch (e) {
      setLead(null);
    }
    setLoading(false);
  };

  // Fetch tasks for this lead
  const fetchTasks = async () => {
    if (!leadId) return;
    setTasksLoading(true);
    setTasksError(null);
    const { data, error } = await supabase.from('tasks').select('*').eq('lead_id', leadId).order('due_date', { ascending: true });
    if (!error) setTasks(data || []);
    else setTasksError(error.message || 'Unable to load tasks');
    setTasksLoading(false);
  };

  useEffect(() => {
    if (!leadId) return;
    fetchLead();
    fetchTasks();
    // eslint-disable-next-line
  }, [leadId]);

  // Save task handler
  async function handleSaveTask(task: any) {
    const { error } = await supabase.from('tasks').insert([{ ...task, lead_id: leadId }]);
    if (!error) setToast('Task created');
    else setToast('Error creating task');
    setTaskModalOpen(false);
    fetchTasks();
  }

  // Action handler
  function handleAction(type: string) {
    if (!lead) return;
    if (type === 'call') window.open(`tel:${lead.phone}`);
    else if (type === 'sms') window.open(`sms:${lead.phone}`);
    else if (type === 'whatsapp') window.open(`https://wa.me/${lead.phone?.replace(/\D/g, '')}`);
    else if (type === 'email') window.open(`mailto:${lead.email}`);
    else if (type === 'schedule_task') setTaskModalOpen(true);
    else setToast('Coming soon.');
  }

  if (loading) return <SkeletonTable rows={4} cols={2} />;
  if (!lead) return <ErrorState message="Lead not found" error={null} onRetry={null} />;

  return (
    <div>
      <h1>Lead Detail</h1>
      <button onClick={() => setEditModalOpen(true)}>Edit</button>
      <button onClick={handleArchive} disabled={lead.archived}>Archive</button>
      <label style={{ marginLeft: 8 }}>Pipeline Stage:
        <select value={lead.pipeline_stage} onChange={handleStageChange}>
          {['New Lead', 'Contacted', 'Appointment Set', 'Proposal Sent', 'Credit Approved', 'Contract Signed', 'Site Survey', 'Permit', 'Install Scheduled', 'Installed', 'PTO', 'Commission Paid'].map(stage => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>
      </label>
      <div style={{ marginTop: 16 }}>
        <b>Name:</b> {lead.name}<br />
        <b>Email:</b> {lead.email}<br />
        <b>Phone:</b> {lead.phone}<br />
        <b>Address:</b> {lead.address}<br />
        <b>City:</b> {lead.city}<br />
        <b>Utility Company:</b> {lead.utility_company}<br />
        <b>Service Type:</b> {lead.service_type}<br />
        <b>Priority:</b> {lead.priority}<br />
        <b>Status:</b> {lead.status}<br />
      </div>
      <div className="lead-actions-row" style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button className="touch-target" onClick={() => handleAction('call')} disabled={!lead.phone}>Call</button>
        <button className="touch-target" onClick={() => handleAction('sms')} disabled={!lead.phone}>SMS</button>
        <button className="touch-target" onClick={() => handleAction('whatsapp')} disabled={!lead.phone}>WhatsApp</button>
        <button className="touch-target" onClick={() => handleAction('email')} disabled={!lead.email}>Email</button>
        <button className="touch-target" onClick={() => handleAction('schedule_task')}>Schedule Task</button>
        <button className="touch-target" onClick={() => setToast('Coming soon.')}>Create Proposal</button>
      </div>

      <TaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} onSave={handleSaveTask} leadId={leadId as string} />

      <div style={{ marginTop: 32 }}>
        <h3>Tasks</h3>
        {tasksLoading ? (
          <SkeletonTable rows={3} cols={2} />
        ) : tasksError ? (
          <ErrorState message="Unable to load tasks." error={tasksError} onRetry={fetchTasks} />
        ) : tasks.length === 0 ? (
          <EmptyState icon="📝" message="No tasks yet. Schedule your first task for this lead." action actionLabel="Schedule Task" onAction={() => setTaskModalOpen(true)} />
        ) : (
          <ul className="task-list">
            {tasks.map(task => (
              <li key={task.id} style={{ marginBottom: 8, padding: '0.5em 0.5em', borderRadius: 6, background: '#f4f6fa' }}>
                <b>{task.title}</b> ({task.type}) - {task.due_date} {task.due_time} [{task.priority}]
                <span style={{ marginLeft: 8 }}>{task.completed ? '✅' : ''}</span>
              </li>
            ))}
          </ul>
        )}
        <style jsx>{`
          .lead-actions-row button {
            min-width: 44px;
            min-height: 44px;
            margin-bottom: 6px;
            font-size: 1rem;
          }
          .task-list {
            padding: 0;
            margin: 0;
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          @media (max-width: 700px) {
            .lead-actions-row {
              flex-direction: column;
              gap: 6px;
            }
            .task-list li {
              font-size: 0.98rem;
              padding: 0.5em 0.5em;
            }
          }
        `}</style>
      </div>
      <div style={{ marginTop: 32 }}>
        <AIAssistantPanel context={{ lead, tasks }} />
      </div>
      <EditLeadModal open={editModalOpen} onClose={() => setEditModalOpen(false)} onSave={handleEdit} lead={lead} />
      {toast && <div style={{ position: 'fixed', top: 10, right: 10, background: '#2b3990', color: '#fff', padding: '0.5rem 1rem', borderRadius: 4 }}>{toast}</div>}
    </div>
  );
}
