import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../utils/supabaseClient';

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    let mounted = true;

    const resolveSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setHasRecoverySession(!!data.session);
      setReady(true);
    };

    resolveSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setHasRecoverySession(!!session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    setError('');
    setSuccessMsg('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccessMsg('Password updated successfully. Redirecting...');
    setSaving(false);
    setTimeout(() => {
      router.replace('/dashboard');
    }, 1200);
  }

  return (
    <div className="reset-bg">
      <div className="reset-container">
        <div className="reset-card">
          <div className="reset-logo-row">
            <div className="reset-logo-circle">
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="19" cy="19" r="19" fill="#2b3990"/>
                <path d="M19 8L24.5 28H13.5L19 8Z" fill="#fbb040"/>
              </svg>
            </div>
            <span className="reset-title">MDB Solar OS</span>
          </div>

          <h2 className="reset-heading">Reset your password</h2>

          {!ready && <div className="reset-info">Checking recovery session...</div>}

          {ready && !hasRecoverySession && (
            <div className="reset-info">
              This recovery link is invalid or expired. Please request a new reset link from login.
              <button className="reset-link-btn" type="button" onClick={() => router.replace('/login')}>
                Back to Login
              </button>
            </div>
          )}

          {ready && hasRecoverySession && (
            <form className="reset-form" onSubmit={handleUpdatePassword} autoComplete="on">
              <label htmlFor="new-password" className="reset-label">New password</label>
              <input
                id="new-password"
                type="password"
                className="reset-input"
                placeholder="Enter new password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={saving}
                autoFocus
                autoComplete="new-password"
              />

              <label htmlFor="confirm-password" className="reset-label">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                className="reset-input"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={saving}
                autoComplete="new-password"
              />

              {error && <div className="reset-error">{error}</div>}
              {successMsg && <div className="reset-success">{successMsg}</div>}

              <button type="submit" className="reset-btn" disabled={saving}>
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>

        <div className="reset-footer">&copy; {new Date().getFullYear()} MDB Solar. All rights reserved.</div>
      </div>

      <style jsx>{`
        .reset-bg {
          min-height: 100vh;
          background: linear-gradient(120deg, #f4f6fa 0%, #e9edf7 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .reset-container {
          width: 100vw;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .reset-card {
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 4px 32px rgba(43,57,144,0.13);
          padding: 2.5rem 2.2rem 2.2rem 2.2rem;
          max-width: 390px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .reset-logo-row {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          margin-bottom: 1.2rem;
        }
        .reset-logo-circle {
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(43,57,144,0.10);
          padding: 0.4rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .reset-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #2b3990;
          letter-spacing: -0.5px;
        }
        .reset-heading {
          font-size: 1.15rem;
          font-weight: 600;
          color: #1a1d2e;
          margin-bottom: 1rem;
          text-align: center;
        }
        .reset-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }
        .reset-label {
          font-size: 1rem;
          font-weight: 500;
          color: #2b3990;
        }
        .reset-input {
          border: 1.5px solid #dbe2f3;
          border-radius: 7px;
          padding: 0.7em 1em;
          background: #fff;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.18s;
          width: 100%;
          box-sizing: border-box;
        }
        .reset-input:focus {
          border-color: #2b3990;
        }
        .reset-btn {
          background: linear-gradient(90deg, #2b3990 60%, #fbb040 100%);
          color: #fff;
          border: none;
          border-radius: 7px;
          font-weight: 700;
          font-size: 1.08rem;
          padding: 0.8em 0;
          margin-top: 0.2em;
          cursor: pointer;
          width: 100%;
        }
        .reset-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .reset-error {
          color: #b00020;
          font-size: 0.97em;
        }
        .reset-success {
          color: #1a6632;
          background: #e6f4ec;
          border: 1.5px solid #7bc99b;
          border-radius: 7px;
          padding: 0.8em 1em;
          text-align: center;
          font-size: 1rem;
        }
        .reset-info {
          width: 100%;
          color: #2b3990;
          background: #e9edf7;
          border-radius: 7px;
          padding: 1em;
          text-align: center;
          font-size: 1rem;
        }
        .reset-link-btn {
          margin-top: 0.8em;
          background: none;
          border: none;
          color: #2b3990;
          text-decoration: underline;
          text-underline-offset: 2px;
          cursor: pointer;
          font-size: 0.97rem;
        }
        .reset-link-btn:hover {
          color: #fbb040;
        }
        .reset-footer {
          margin-top: 2.5rem;
          color: #b0b6d1;
          font-size: 0.98rem;
          text-align: center;
        }
        @media (max-width: 600px) {
          .reset-card {
            padding: 1.2rem 0.7rem 1.2rem 0.7rem;
            max-width: 98vw;
            border-radius: 13px;
          }
          .reset-footer {
            margin-top: 1.2rem;
            font-size: 0.93rem;
          }
        }
      `}</style>
    </div>
  );
}
