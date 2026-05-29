import { useState } from 'react';

const priorities = ['Low', 'Medium', 'High'];
const types = ['Call', 'SMS', 'WhatsApp', 'Email', 'Appointment', 'Site Survey', 'Document Request', 'Other'];

export default function TaskModal({ open, onClose, onSave, leadId, assignedTo }: { open: boolean; onClose: () => void; onSave: (task: any) => void; leadId?: string; assignedTo?: string }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    due_date: '',
    due_time: '',
    priority: 'Medium',
    type: 'Call',
    assigned_to: assignedTo || '',
    lead_id: leadId || '',
  });
  const [errors, setErrors] = useState<{[k: string]: string}>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string|null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  function validate() {
    const errs: {[k: string]: string} = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.due_date) errs.due_date = 'Due date is required';
    // Optionally add more validation for assigned_to, etc.
    return errs;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setToast('Please complete required fields');
      setTimeout(() => setToast(null), 2500);
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...form, due_date: form.due_date, due_time: form.due_time });
      setToast('Task saved successfully');
      setForm({
        title: '',
        description: '',
        due_date: '',
        due_time: '',
        priority: 'Medium',
        type: 'Call',
        assigned_to: assignedTo || '',
        lead_id: leadId || '',
      });
      setErrors({});
      setTimeout(() => setToast(null), 2000);
      onClose();
    } catch (e) {
      setToast('Unable to save task');
    }
    setSaving(false);
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Schedule Task</h2>
        <form onSubmit={handleSubmit} autoComplete="off">
          <input name="title" placeholder="Title" value={form.title} onChange={handleChange} disabled={saving} />
          {errors.title && <div className="error-msg">{errors.title}</div>}
          <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} disabled={saving} />
          <input name="due_date" type="date" value={form.due_date} onChange={handleChange} disabled={saving} />
          {errors.due_date && <div className="error-msg">{errors.due_date}</div>}
          <input name="due_time" type="time" value={form.due_time} onChange={handleChange} disabled={saving} />
          <label>Priority:
            <select name="priority" value={form.priority} onChange={handleChange} disabled={saving}>
              {priorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label>Type:
            <select name="type" value={form.type} onChange={handleChange} disabled={saving}>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <input name="assigned_to" placeholder="Assigned To (user id)" value={form.assigned_to} onChange={handleChange} disabled={saving} />
          <button type="submit" disabled={saving} style={{minWidth:100}}>
            {saving ? 'Saving...' : 'Save Task'}
          </button>
          <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
        </form>
        {toast && <div className="toast">{toast}</div>}
      </div>
      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal {
          background: #fff;
          padding: 2rem;
          border-radius: 8px;
          min-width: 320px;
        }
        .error-msg {
          color: #b00020;
          font-size: 0.95em;
          margin-bottom: 0.5em;
        }
        .toast {
          margin-top: 1em;
          background: #2b3990;
          color: #fff;
          padding: 0.5em 1em;
          border-radius: 4px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
