import { useState } from 'react';

export default function NewLeadModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (lead: any) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{[k: string]: string}>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string|null>(null);

  function validate() {
    const errs: {[k: string]: string} = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errs.email = 'Valid email required';
    if (!phone.trim()) errs.phone = 'Phone number required';
    else if (!/^\+?\d{10,15}$/.test(phone.replace(/[^\d]/g, ''))) errs.phone = 'Valid phone required';
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
      await onCreate({ name, email, phone });
      setToast('Lead saved successfully');
      setName('');
      setEmail('');
      setPhone('');
      setErrors({});
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
        <h2>New Lead</h2>
        <form onSubmit={handleSubmit} autoComplete="off">
          <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} disabled={saving} />
          {errors.name && <div className="error-msg">{errors.name}</div>}
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} disabled={saving} />
          {errors.email && <div className="error-msg">{errors.email}</div>}
          <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} disabled={saving} />
          {errors.phone && <div className="error-msg">{errors.phone}</div>}
          <button type="submit" disabled={saving} style={{minWidth:100}}>
            {saving ? 'Saving...' : 'Create'}
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
