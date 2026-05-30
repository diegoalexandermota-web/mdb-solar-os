import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/router';
import SkeletonTable from '../components/SkeletonTable';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

function groupTasks(tasks: any[]) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const week = new Date();
  week.setDate(today.getDate() + 7);

  const isSameDay = (d1: string, d2: Date) => {
    const d = new Date(d1);
    return d.getFullYear() === d2.getFullYear() && d.getMonth() === d2.getMonth() && d.getDate() === d2.getDate();
  };

  return {
    Overdue: tasks.filter(t => !t.completed && new Date(t.due_date) < today),
    Today: tasks.filter(t => !t.completed && isSameDay(t.due_date, today)),
    Tomorrow: tasks.filter(t => !t.completed && isSameDay(t.due_date, tomorrow)),
    'This Week': tasks.filter(t => !t.completed && new Date(t.due_date) > tomorrow && new Date(t.due_date) <= week),
    Completed: tasks.filter(t => t.completed),
  };
}

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [toast, setToast] = useState<string|null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('tasks').select('*').order('due_date', { ascending: true });
    if (!error) setTasks(data || []);
    else setError(error.message || 'Unable to load tasks');
    setLoading(false);
  }

  async function markComplete(id: string, completed: boolean) {
    await supabase.from('tasks').update({ completed: !completed }).eq('id', id);
    setToast('Task updated');
    fetchTasks();
  }

  async function handleDelete(id: string) {
    await supabase.from('tasks').delete().eq('id', id);
    setToast('Task deleted');
    fetchTasks();
  }

  function openLead(lead_id: string) {
    router.push(`/leads/${lead_id}`);
  }

  const grouped = groupTasks(tasks);

  return (
    <div className="tasks-root">
      {/* Command Center Header */}
      <div className="tasks-header card">
        <div className="tasks-header-main">
          <div className="tasks-header-title-row">
            <svg width="32" height="32" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="19" cy="19" r="19" fill="#2b3990"/>
              <path d="M19 8L24.5 28H13.5L19 8Z" fill="#fbb040"/>
            </svg>
            <span className="tasks-header-title">Task Command Center</span>
          </div>
        </div>
      </div>
      {toast && <div className="dashboard-toast" style={{position:'fixed',top:10,right:10,zIndex:1000}}>{toast}</div>}
      {loading ? (
        <SkeletonTable rows={6} cols={4} />
      ) : error ? (
        <ErrorState message="Unable to load tasks." error={error} onRetry={fetchTasks} />
      ) : (
        <div className="tasks-groups">
          {Object.entries(grouped).map(([group, groupTasks]) => (
            <div key={group} className="tasks-group-section card">
              <div className="tasks-group-title-row">
                <span className="tasks-group-title">{group}</span>
              </div>
              <ul className="tasks-list">
                {groupTasks.length === 0 && <EmptyState icon="📝" message="No tasks in this group." />}
                {groupTasks.map((task: any) => (
                  <li key={task.id} className="tasks-list-item">
                    <div className="tasks-list-row">
                      <span className="tasks-list-title">{task.title}</span>
                      <span className={`tasks-priority-badge priority-${(task.priority||'').toLowerCase()}`}>{task.priority}</span>
                    </div>
                    <div className="tasks-list-meta">{task.type} &bull; {task.due_date} {task.due_time}</div>
                    <div className="tasks-list-actions">
                      <button className="tasks-action-btn" onClick={() => markComplete(task.id, task.completed)}>{task.completed ? 'Mark Incomplete' : 'Mark Complete'}</button>
                      <button className="tasks-action-btn" onClick={() => openLead(task.lead_id)}>Open Lead</button>
                      <button className="tasks-action-btn" onClick={() => handleDelete(task.id)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <style jsx>{`
        .tasks-root {
          max-width: 900px;
          margin: 0 auto;
          padding: 2.5rem 1rem 3rem 1rem;
        }
        .card {
          margin-bottom: 1.7rem;
        }
        .tasks-header {
          background: #fff;
          box-shadow: 0 2px 12px rgba(43,57,144,0.07);
          border-radius: 0 0 18px 18px;
          padding: 2.2rem 2.2rem 1.2rem 2.2rem;
          margin-bottom: 1.5rem;
        }
        .tasks-header-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .tasks-header-title-row {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }
        .tasks-header-title {
          font-size: 1.45rem;
          font-weight: 700;
          color: #2b3990;
          letter-spacing: -0.5px;
        }
        .tasks-groups {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }
        .tasks-group-section {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          padding: 1.2rem 1.1rem;
        }
        .tasks-group-title-row {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }
        .tasks-group-title {
          font-size: 1.13rem;
          font-weight: 700;
          color: #2b3990;
        }
        .tasks-list {
          padding: 0;
          margin: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tasks-list-item {
          background: #f4f6fa;
          border-radius: 8px;
          padding: 0.7em 1em;
          box-shadow: 0 1px 4px rgba(43,57,144,0.04);
        }
        .tasks-list-row {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }
        .tasks-list-title {
          font-weight: 700;
          color: #2b3990;
        }
        .tasks-priority-badge {
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
        .tasks-list-meta {
          color: #444;
          font-size: 0.98rem;
        }
        .tasks-list-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-top: 4px;
        }
        .tasks-action-btn {
          border-radius: 7px;
          font-weight: 600;
          font-size: 0.97rem;
          padding: 0.5em 1em;
          border: none;
          box-shadow: 0 1px 4px rgba(43,57,144,0.04);
          transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.13s;
        }
        .tasks-action-btn:active {
          background: #1a1d2e;
          color: #fff;
          transform: scale(0.97);
        }
        @media (max-width: 900px) {
          .tasks-root {
            padding: 1.2rem 0.2rem 2rem 0.2rem;
          }
          .card {
            padding: 1.1rem;
          }
        }
        @media (max-width: 600px) {
          .tasks-root {
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
