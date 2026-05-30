
import EmptyState from '../../components/EmptyState';
import SkeletonTable from '../../components/SkeletonTable';
import ErrorState from '../../components/ErrorState';
import AIAssistantPanel from '../../components/AIAssistantPanel';
import EditLeadModal from '../../components/EditLeadModal';
import TaskModal from '../../components/TaskModal';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';
import { useState, useEffect } from 'react';
import RelatedSolarDesigns from '../../components/RelatedSolarDesigns';



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
    <div className="lead-detail-root">
      {/* Customer Profile Header */}
      <div className="lead-profile-header card">
        <div className="lead-profile-main">
          <div className="lead-avatar">
            <span>{lead.name?.[0] || '?'}</span>
          </div>
          <div className="lead-profile-info">
            <div className="lead-profile-name-row">
              <span className="lead-profile-name">{lead.name}</span>
              {lead.archived && <span className="lead-archived-badge">Archived</span>}
            </div>
            <div className="lead-profile-contact">
              <span>{lead.email}</span> &bull; <span>{lead.phone}</span>
            </div>
            <div className="lead-profile-address">{lead.address}, {lead.city}</div>
          </div>
        </div>
        <div className="lead-profile-actions">
          <button className="lead-action-btn" onClick={() => setEditModalOpen(true)}>Edit</button>
          <button className="lead-action-btn" onClick={handleArchive} disabled={lead.archived}>Archive</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="lead-quick-actions card">
        <button className="lead-action-btn call" onClick={() => handleAction('call')} disabled={!lead.phone}>Call</button>
        <button className="lead-action-btn sms" onClick={() => handleAction('sms')} disabled={!lead.phone}>SMS</button>
        <button className="lead-action-btn whatsapp" onClick={() => handleAction('whatsapp')} disabled={!lead.phone}>WhatsApp</button>
        <button className="lead-action-btn email" onClick={() => handleAction('email')} disabled={!lead.email}>Email</button>
        <button className="lead-action-btn" onClick={() => handleAction('schedule_task')}>Schedule Task</button>
        <button className="lead-action-btn proposal" onClick={() => setToast('Coming soon.')}>Create Proposal</button>
      </div>

      {/* Pipeline Stage Card */}
      <div className="lead-stage-card card">
        <div className="lead-stage-label">Pipeline Stage</div>
        <select value={lead.pipeline_stage} onChange={handleStageChange} className="lead-stage-select">
          {['New Lead', 'Contacted', 'Appointment Set', 'Proposal Sent', 'Credit Approved', 'Contract Signed', 'Site Survey', 'Permit', 'Install Scheduled', 'Installed', 'PTO', 'Commission Paid'].map(stage => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>
        <div className="lead-stage-meta">
          <span><b>Priority:</b> {lead.priority}</span>
          <span><b>Status:</b> {lead.status}</span>
          <span><b>Service:</b> {lead.service_type}</span>
          <span><b>Utility:</b> {lead.utility_company}</span>
        </div>
      </div>


      {/* Solar Design Actions */}
      <div className="lead-solar-design-actions card">
        <div className="lead-proposal-title">Solar Designs</div>
        <div style={{marginBottom:8}}>Create or view solar designs for this lead.</div>
        <button className="lead-action-btn proposal" onClick={() => router.push(`/solar-design-studio?lead_id=${leadId}`)}>Create Solar Design</button>
      </div>


      {/* Related Solar Designs */}
      {<RelatedSolarDesigns leadId={leadId} />}


      {/* Notes & Tasks Section */}
      <div className="lead-tasks-section card">
        <div className="lead-tasks-header-row">
          <span className="lead-tasks-title">Tasks & Notes</span>
          <button className="lead-action-btn" onClick={() => setTaskModalOpen(true)}>+ Add Task</button>
        </div>
        {tasksLoading ? (
          <SkeletonTable rows={3} cols={2} />
        ) : tasksError ? (
          <ErrorState message="Unable to load tasks." error={tasksError} onRetry={fetchTasks} />
        ) : tasks.length === 0 ? (
          <EmptyState icon="📝" message="No tasks yet. Schedule your first task for this lead." action actionLabel="Schedule Task" onAction={() => setTaskModalOpen(true)} />
        ) : (
          <ul className="lead-task-list">
            {tasks.map(task => (
              <li key={task.id} className="lead-task-item">
                <div className="lead-task-title-row">
                  <span className="lead-task-title">{task.title}</span>
                  <span className={`lead-task-priority priority-${(task.priority||'').toLowerCase()}`}>{task.priority}</span>
                </div>
                <div className="lead-task-meta">{task.type} &bull; {task.due_date} {task.due_time} {task.completed ? '✅' : ''}</div>
                <div className="lead-task-desc">{task.description}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* AI Copilot Panel */}
      <div className="lead-ai-panel card">
        <AIAssistantPanel context={{ lead, tasks }} />
      </div>

      <TaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} onSave={handleSaveTask} leadId={leadId as string} />
      <EditLeadModal open={editModalOpen} onClose={() => setEditModalOpen(false)} onSave={handleEdit} lead={lead} />
      {toast && <div className="dashboard-toast" style={{ position: 'fixed', top: 10, right: 10, zIndex: 1000 }}>{toast}</div>}

      <style jsx>{`
        .lead-detail-root {
          max-width: 820px;
          margin: 0 auto;
          padding: 2.5rem 1rem 3rem 1rem;
        }
        .card {
          margin-bottom: 1.7rem;
        }
        .lead-profile-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1.5rem;
        }
        .lead-profile-main {
          display: flex;
          align-items: center;
          gap: 1.2rem;
        }
        .lead-avatar {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: #e9edf7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.1rem;
          font-weight: 700;
          color: #2b3990;
        }
        .lead-profile-info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .lead-profile-name-row {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }
        .lead-profile-name {
          font-size: 1.35rem;
          font-weight: 700;
          color: #2b3990;
        }
        .lead-archived-badge {
          background: #b0b6d1;
          color: #fff;
          border-radius: 7px;
          padding: 0.18em 0.7em;
          font-size: 0.93rem;
          font-weight: 700;
        }
        .lead-profile-contact {
          color: #444;
          font-size: 1.01rem;
        }
        .lead-profile-address {
          color: #888;
          font-size: 0.98rem;
        }
        .lead-profile-actions {
          display: flex;
          gap: 0.7rem;
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
        .lead-action-btn.email {
          background: #1a1d2e;
          color: #fff;
        }
        .lead-action-btn.proposal {
          background: #fbb040;
          color: #2b3990;
        }
        .lead-action-btn:active {
          background: #1a1d2e;
          color: #fff;
          transform: scale(0.97);
        }
        .lead-action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .lead-quick-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.7rem;
          justify-content: flex-start;
        }
        .lead-stage-card {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }
        .lead-stage-label {
          font-weight: 700;
          color: #2b3990;
        }
        .lead-stage-select {
          max-width: 260px;
        }
        .lead-stage-meta {
          display: flex;
          gap: 1.2rem;
          flex-wrap: wrap;
          color: #444;
          font-size: 1.01rem;
        }
        .lead-proposal-shortcut {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: flex-start;
        }
        .lead-proposal-title {
          font-weight: 700;
          color: #2b3990;
        }
        .lead-proposal-desc {
          color: #444;
        }
        .lead-tasks-section {
          margin-top: 2.2rem;
        }
        .lead-tasks-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.1rem;
        }
        .lead-tasks-title {
          font-size: 1.13rem;
          font-weight: 700;
          color: #2b3990;
        }
        .lead-task-list {
          padding: 0;
          margin: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .lead-task-item {
          background: #f4f6fa;
          border-radius: 8px;
          padding: 0.7em 1em;
          box-shadow: 0 1px 4px rgba(43,57,144,0.04);
        }
        .lead-task-title-row {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }
        .lead-task-title {
          font-weight: 700;
          color: #2b3990;
        }
        .lead-task-priority {
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
        .lead-task-meta {
          color: #444;
          font-size: 0.98rem;
        }
        .lead-task-desc {
          color: #888;
          font-size: 0.97rem;
        }
        .lead-ai-panel {
          margin-top: 2.2rem;
        }
        @media (max-width: 900px) {
          .lead-detail-root {
            padding: 1.2rem 0.2rem 2rem 0.2rem;
          }
          .card {
            padding: 1.1rem;
          }
        }
        @media (max-width: 600px) {
          .lead-detail-root {
            padding: 0.7rem 0.1rem 1.2rem 0.1rem;
          }
          .card {
            padding: 0.7rem 0.3rem;
          }
          .lead-profile-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.7rem;
          }
          .lead-profile-main {
            gap: 0.7rem;
          }
          .lead-quick-actions {
            gap: 0.4rem;
          }
          .lead-stage-meta {
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}
