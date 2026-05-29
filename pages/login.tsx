import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string|null>(null);

  function validate() {
    if (!email.trim()) return 'Email is required';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'Valid email required';
    return '';
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setError('');
    const err = validate();
    if (err) {
      setError(err);
      setToast('Please complete required fields');
      setTimeout(() => setToast(null), 2500);
      return;
    }
    setSaving(true);
    const { error: supaError } = await supabase.auth.signInWithOtp({ email });
    if (supaError) {
      setError(supaError.message);
      setToast('Unable to send magic link');
    } else {
      setSent(true);
      setToast('Magic link sent!');
    }
    setSaving(false);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div style={{maxWidth:400,margin:'0 auto',padding:24}}>
      <h1>Login</h1>
      {toast && <div className="toast">{toast}</div>}
      {sent ? <div>Check your email for the login link.</div> : (
        <form onSubmit={handleLogin} autoComplete="off">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} disabled={saving} />
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" disabled={saving} style={{minWidth:120}}>{saving ? 'Sending...' : 'Send Magic Link'}</button>
        </form>
      )}
      <style jsx>{`
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
