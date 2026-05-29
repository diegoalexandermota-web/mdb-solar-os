import { useState, useEffect } from 'react';

const statuses = ['Draft','Sent','Viewed','Customer Reviewing','Negotiating','Approved','Signed','Expired'];

export default function ProposalModal({ open, onClose, onSave, proposal, lead }: { open: boolean; onClose: () => void; onSave: (proposal: any) => void; proposal?: any; lead?: any }) {
  const [form, setForm] = useState({
    customer_name: '',
    address: '',
    utility_company: '',
    monthly_bill: '',
    annual_usage: '',
    financing_preference: '',
    status: 'Draft',
  });
  const [errors, setErrors] = useState<{[k: string]: string}>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string|null>(null);

  useEffect(() => {
    if (proposal) setForm({
      customer_name: proposal.customer_name || '',
      address: proposal.address || '',
      utility_company: proposal.utility_company || '',
      monthly_bill: proposal.monthly_bill || '',
      annual_usage: proposal.annual_usage || '',
      financing_preference: proposal.financing_preference || '',
      status: proposal.status || 'Draft',
    });
    else if (lead) setForm(f => ({ ...f, customer_name: lead.name || '', address: lead.address || '', utility_company: lead.utility_company || '' }));
  }, [proposal, lead]);

  function validate() {
    const errs: {[k: string]: string} = {};
    if (!form.customer_name.trim()) errs.customer_name = 'Customer name is required';
    if (form.monthly_bill && (isNaN(Number(form.monthly_bill)) || Number(form.monthly_bill) <= 0)) errs.monthly_bill = 'Monthly bill must be greater than 0';
    if (form.annual_usage && (isNaN(Number(form.annual_usage)) || Number(form.annual_usage) <= 0)) errs.annual_usage = 'Annual usage must be greater than 0';
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
      setToast('Proposal saved successfully');
      setTimeout(() => setToast(null), 2000);
      onClose();
    } catch (e) {
      setToast('Unable to save proposal');
    }
    setSaving(false);
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>{proposal ? 'Edit Proposal' : 'New Proposal'}</h2>
        <form onSubmit={handleSubmit} autoComplete="off">
          <input name="customer_name" placeholder="Customer Name" value={form.customer_name} onChange={handleChange} disabled={saving} />
          {errors.customer_name && <div className="error-msg">{errors.customer_name}</div>}
          <input name="address" placeholder="Address" value={form.address} onChange={handleChange} disabled={saving} />
          <input name="utility_company" placeholder="Utility Company" value={form.utility_company} onChange={handleChange} disabled={saving} />
          <input name="monthly_bill" placeholder="Monthly Bill" type="number" value={form.monthly_bill} onChange={handleChange} disabled={saving} />
          {errors.monthly_bill && <div className="error-msg">{errors.monthly_bill}</div>}
          <input name="annual_usage" placeholder="Annual Usage (kWh)" type="number" value={form.annual_usage} onChange={handleChange} disabled={saving} />
          {errors.annual_usage && <div className="error-msg">{errors.annual_usage}</div>}
          <input name="financing_preference" placeholder="Financing Preference" value={form.financing_preference} onChange={handleChange} disabled={saving} />
          <label>Status:
            <select name="status" value={form.status} onChange={handleChange} disabled={saving}>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <button type="submit" disabled={saving} style={{minWidth:100}}>
            {saving ? 'Saving...' : 'Save Proposal'}
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
