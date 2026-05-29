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
    <div>
      <h1>Tasks</h1>
      {toast && <div style={{position:'fixed',top:10,right:10,background:'#2b3990',color:'#fff',padding:'0.5rem 1rem',borderRadius:4}}>{toast}</div>}
      {loading ? (
        <SkeletonTable rows={6} cols={4} />
      ) : error ? (
        <ErrorState message="Unable to load tasks." error={error} onRetry={fetchTasks} />
      ) : (
        Object.entries(grouped).map(([group, groupTasks]) => (
          <div key={group} style={{marginBottom:24}}>
            <h2>{group}</h2>
            <ul>
              {groupTasks.length === 0 && <EmptyState icon="📝" message="No tasks in this group." />}
              {groupTasks.map((task: any) => (
                <li key={task.id} style={{marginBottom:8}}>
                  <b>{task.title}</b> ({task.type}) - {task.due_date} {task.due_time} [{task.priority}]
                  <button onClick={() => markComplete(task.id, task.completed)}>{task.completed ? 'Mark Incomplete' : 'Mark Complete'}</button>
                  <button onClick={() => openLead(task.lead_id)}>Open Lead</button>
                  <button onClick={() => handleDelete(task.id)}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
