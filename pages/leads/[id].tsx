import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import EditLeadModal from '../../components/EditLeadModal';
import TaskModal from '../../components/TaskModal';
import AIAssistantPanel from '../../components/AIAssistantPanel';
import SkeletonTable from '../../components/SkeletonTable';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string|null>(null);
  useEffect(() => {
    if (id) fetchLead();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (id) fetchTasks();
    // eslint-disable-next-line
  }, [id]);
  async function fetchTasks() {
    setTasksLoading(true);
    setTasksError(null);
    const { data, error } = await supabase.from('tasks').select('*').eq('lead_id', id).order('due_date', { ascending: true });
    if (!error) setTasks(data || []);
    else setTasksError(error.message || 'Unable to load tasks');
    setTasksLoading(false);
  }
  async function handleSaveTask(task: any) {
    const { error } = await supabase.from('tasks').insert([{ ...task, lead_id: id }]);
    if (!error) setToast('Task created');
    else setToast('Error creating task');
    setTaskModalOpen(false);
    fetchTasks();
  return (
    <div>
      <h1>Lead Detail</h1>
      <button onClick={() => setEditModalOpen(true)}>Edit</button>
      <button onClick={handleArchive} disabled={lead.archived}>Archive</button>
      <label style={{marginLeft:8}}>Pipeline Stage:
        <select value={lead.pipeline_stage} onChange={handleStageChange}>
          {['New Lead','Contacted','Appointment Set','Proposal Sent','Credit Approved','Contract Signed','Site Survey','Permit','Install Scheduled','Installed','PTO','Commission Paid'].map(stage => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>
      </label>
      <div className="lead-actions-row" style={{marginTop:16,display:'flex',flexWrap:'wrap',gap:8}}>
        <button className="touch-target" onClick={() => handleAction('call')} disabled={!lead.phone}>Call</button>
        <button className="touch-target" onClick={() => handleAction('sms')} disabled={!lead.phone}>SMS</button>
        <button className="touch-target" onClick={() => handleAction('whatsapp')} disabled={!lead.phone}>WhatsApp</button>
        <button className="touch-target" onClick={() => handleAction('email')} disabled={!lead.email}>Email</button>
        <button className="touch-target" onClick={() => handleAction('schedule_task')}>Schedule Task</button>
        <button className="touch-target" onClick={() => setToast('Coming soon.')}>Create Proposal</button>
      </div>

      <TaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} onSave={handleSaveTask} leadId={id as string} />

      <div style={{marginTop:32}}>
        <h3>Tasks</h3>
        {tasks.length === 0 && <div>No tasks yet.</div>}
        <ul>
          {tasks.map(task => (
            <li key={task.id} style={{marginBottom:8}}>
              <b>{task.title}</b> ({task.type}) - {task.due_date} {task.due_time} [{task.priority}]
              <span style={{marginLeft:8}}>{task.completed ? '✅' : ''}</span>
            </li>
          ))}
        </ul>
      </div>

      <AIAssistantPanel context={{lead, tasks}} />

      <EditLeadModal open={editModalOpen} onClose={() => setEditModalOpen(false)} onSave={handleEdit} lead={lead} />
      {toast && <div style={{position:'fixed',top:10,right:10,background:'#2b3990',color:'#fff',padding:'0.5rem 1rem',borderRadius:4}}>{toast}</div>}
    </div>
  );
    fetchLead();
  }

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
      <label style={{marginLeft:8}}>Pipeline Stage:
        <select value={lead.pipeline_stage} onChange={handleStageChange}>
          {['New Lead','Contacted','Appointment Set','Proposal Sent','Credit Approved','Contract Signed','Site Survey','Permit','Install Scheduled','Installed','PTO','Commission Paid'].map(stage => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>
      </label>
      <div style={{marginTop:16}}>
        <b>Name:</b> {lead.name}<br/>
        <b>Email:</b> {lead.email}<br/>
        <b>Phone:</b> {lead.phone}<br/>
        <b>Address:</b> {lead.address}<br/>
        <b>City:</b> {lead.city}<br/>
        <b>Utility Company:</b> {lead.utility_company}<br/>
        <b>Service Type:</b> {lead.service_type}<br/>
        <b>Priority:</b> {lead.priority}<br/>
        <b>Status:</b> {lead.status}<br/>
      </div>
      <div style={{marginTop:16}}>
        <button onClick={() => handleAction('call')} disabled={!lead.phone}>Call</button>
        <button onClick={() => handleAction('sms')} disabled={!lead.phone}>SMS</button>
        <button onClick={() => handleAction('whatsapp')} disabled={!lead.phone}>WhatsApp</button>
        <button onClick={() => handleAction('email')} disabled={!lead.email}>Email</button>
        <button onClick={() => handleAction('schedule_task')}>Schedule Task</button>
        <button onClick={() => setToast('Coming soon.')}>Create Proposal</button>
      </div>

      <TaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} onSave={handleSaveTask} leadId={id as string} />

      <div style={{marginTop:32}}>
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
              <li key={task.id} style={{marginBottom:8,padding:'0.5em 0.5em',borderRadius:6,background:'#f4f6fa'}}>
                <b>{task.title}</b> ({task.type}) - {task.due_date} {task.due_time} [{task.priority}]
                <span style={{marginLeft:8}}>{task.completed ? '✅' : ''}</span>
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
      <div style={{marginTop:32}}>
        <AIAssistantPanel context={{lead, tasks}} />
      </div>
      <EditLeadModal open={editModalOpen} onClose={() => setEditModalOpen(false)} onSave={handleEdit} lead={lead} />
      {toast && <div style={{position:'fixed',top:10,right:10,background:'#2b3990',color:'#fff',padding:'0.5rem 1rem',borderRadius:4}}>{toast}</div>}
    </div>
  );
}
