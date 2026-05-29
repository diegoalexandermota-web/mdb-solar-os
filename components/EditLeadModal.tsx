import { useState, useEffect } from 'react';

type Lead = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  utility_company?: string;
  service_type?: string;
  priority?: string;
  pipeline_stage?: string;
};

type EditLeadModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (lead: Lead) => void | Promise<void>;
  lead?: Lead | null;
};

export default function EditLeadModal({ open, onClose, onSave, lead }: EditLeadModalProps) {

  const [form, setForm] = useState<Lead>({ name: '', email: '', phone: '', address: '', city: '', utility_company: '', service_type: '', priority: '', pipeline_stage: 'New Lead' });
  const [errors, setErrors] = useState<{[k: string]: string}>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string|null>(null);

  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        address: lead.address || '',
        city: lead.city || '',
        utility_company: lead.utility_company || '',
        service_type: lead.service_type || '',
        priority: lead.priority || '',
        pipeline_stage: lead.pipeline_stage || 'New Lead',
      });
    } else {
      setForm({ name: '', email: '', phone: '', address: '', city: '', utility_company: '', service_type: '', priority: '', pipeline_stage: 'New Lead' });
    }
  }, [lead]);

  function validate() {
    const errs: {[k: string]: string} = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errs.email = 'Valid email required';
    if (!form.phone.trim()) errs.phone = 'Phone number required';
    else if (!/^\+?\d{10,15}$/.test(form.phone.replace(/[^\d]/g, ''))) errs.phone = 'Valid phone required';
    return errs;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
      await onSave(form);
      setToast('Lead updated successfully');
      setTimeout(() => setToast(null), 2000);
      onClose();
    } catch (e) {
      setToast('Unable to save lead');
    }
    setSaving(false);
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Edit Lead</h2>
        <form onSubmit={handleSubmit} autoComplete="off">
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} disabled={saving} />
          {errors.name && <div className="error-msg">{errors.name}</div>}
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} disabled={saving} />
          {errors.email && <div className="error-msg">{errors.email}</div>}
          <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} disabled={saving} />
          {errors.phone && <div className="error-msg">{errors.phone}</div>}
          <input name="address" placeholder="Address" value={form.address} onChange={handleChange} disabled={saving} />
          <input name="city" placeholder="City" value={form.city} onChange={handleChange} disabled={saving} />
          <input name="utility_company" placeholder="Utility Company" value={form.utility_company} onChange={handleChange} disabled={saving} />
          <input name="service_type" placeholder="Service Type" value={form.service_type} onChange={handleChange} disabled={saving} />
          <input name="priority" placeholder="Priority" value={form.priority} onChange={handleChange} disabled={saving} />
          <label>Pipeline Stage:
            <select name="pipeline_stage" value={form.pipeline_stage} onChange={handleChange} disabled={saving}>
              {['New Lead','Contacted','Appointment Set','Proposal Sent','Credit Approved','Contract Signed','Site Survey','Permit','Install Scheduled','Installed','PTO','Commission Paid'].map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={saving} style={{minWidth:100}}>
            {saving ? 'Saving...' : 'Save'}
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
