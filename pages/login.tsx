
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../utils/supabaseClient';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const redirectIfSessionExists = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (data.session) {
        router.replace('/dashboard');
      }
    };

    redirectIfSessionExists();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.replace('/dashboard');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!router.isReady) return;
    const rawError = router.query.error;
    const authError = Array.isArray(rawError) ? rawError[0] : rawError;
    if (authError) {
      setError(authError);
      setToast('Authentication failed, please try again');
      setTimeout(() => setToast(null), 3000);
    }
  }, [router.isReady, router.query.error]);

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
    const { error: supaError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
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
    <div className="login-bg">
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo-row">
            <div className="login-logo-circle">
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="19" cy="19" r="19" fill="#2b3990"/>
                <path d="M19 8L24.5 28H13.5L19 8Z" fill="#fbb040"/>
              </svg>
            </div>
            <span className="login-title">MDB Solar OS</span>
          </div>
          <h2 className="login-heading">Sign in to your account</h2>
          {toast && <div className="login-toast">{toast}</div>}
          {sent ? (
            <div className="login-success">Check your email for the login link.</div>
          ) : (
            <form className="login-form" onSubmit={handleLogin} autoComplete="off">
              <label htmlFor="email" className="login-label">Email address</label>
              <input
                id="email"
                type="email"
                className="login-input"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={saving}
                autoFocus
              />
              {error && <div className="login-error">{error}</div>}
              <button type="submit" className="login-btn" disabled={saving}>
                {saving ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          )}
        </div>
        <div className="login-footer">&copy; {new Date().getFullYear()} MDB Solar. All rights reserved.</div>
      </div>
      <style jsx>{`
        .login-bg {
          min-height: 100vh;
          background: linear-gradient(120deg, #f4f6fa 0%, #e9edf7 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-container {
          width: 100vw;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .login-card {
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 4px 32px rgba(43,57,144,0.13);
          padding: 2.5rem 2.2rem 2.2rem 2.2rem;
          max-width: 370px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .login-logo-row {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          margin-bottom: 1.2rem;
        }
        .login-logo-circle {
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(43,57,144,0.10);
          padding: 0.4rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #2b3990;
          letter-spacing: -0.5px;
        }
        .login-heading {
          font-size: 1.15rem;
          font-weight: 600;
          color: #1a1d2e;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        .login-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }
        .login-label {
          font-size: 1rem;
          font-weight: 500;
          color: #2b3990;
        }
        .login-input {
          border: 1.5px solid #dbe2f3;
          border-radius: 7px;
          padding: 0.7em 1em;
          background: #fff;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.18s;
        }
        .login-input:focus {
          border-color: #2b3990;
        }
        .login-error {
          color: #b00020;
          font-size: 0.97em;
          margin-bottom: 0.2em;
          text-align: left;
        }
        .login-btn {
          background: linear-gradient(90deg, #2b3990 60%, #fbb040 100%);
          color: #fff;
          border: none;
          border-radius: 7px;
          font-weight: 700;
          font-size: 1.08rem;
          padding: 0.8em 0;
          margin-top: 0.2em;
          box-shadow: 0 1px 4px rgba(43,57,144,0.04);
          transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.13s;
          min-width: 120px;
        }
        .login-btn:active {
          background: #1a1d2e;
          color: #fff;
          transform: scale(0.97);
        }
        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .login-toast {
          margin-bottom: 1.1em;
          background: #2b3990;
          color: #fff;
          padding: 0.7em 1.3em;
          border-radius: 7px;
          font-size: 1.05rem;
          box-shadow: 0 2px 8px rgba(43,57,144,0.10);
          text-align: center;
          animation: fadein 0.3s;
        }
        .login-success {
          color: #2b3990;
          background: #e9edf7;
          border-radius: 7px;
          padding: 1.2em 1em;
          text-align: center;
          font-size: 1.08rem;
          margin-bottom: 1em;
        }
        .login-footer {
          margin-top: 2.5rem;
          color: #b0b6d1;
          font-size: 0.98rem;
          text-align: center;
        }
        @media (max-width: 600px) {
          .login-card {
            padding: 1.2rem 0.7rem 1.2rem 0.7rem;
            max-width: 98vw;
            border-radius: 13px;
          }
          .login-footer {
            margin-top: 1.2rem;
            font-size: 0.93rem;
          }
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
