
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../utils/supabaseClient';

type AuthMode = 'password' | 'magic' | 'signup';

function validateEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
}

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const bootstrapAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (data.session) {
        router.replace('/dashboard');
        return;
      }

      const authState = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.replace('/dashboard');
        }
      });
      subscription = authState.data.subscription;
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
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

  function resetForm() {
    setError('');
    setSuccessMsg('');
    setPassword('');
  }

  function switchMode(next: AuthMode) {
    resetForm();
    setMode(next);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  async function handleEmailPasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    console.log('LOGIN_HANDLER_START');
    if (saving) return;
    setError('');
    if (!email.trim() || !validateEmail(email)) {
      setError('Valid email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    setSaving(true);
    try {
      const { error: supaError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (supaError) {
        console.log('LOGIN_ERROR', supaError);
        setError(supaError.message);
        showToast('Sign in failed');
      } else {
        console.log('LOGIN_SUCCESS');
        router.push('/dashboard');
      }
    } catch (err) {
      console.log('LOGIN_ERROR', err);
      setError('Unexpected login error');
      showToast('Sign in failed');
    }
    setSaving(false);
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setError('');
    if (!email.trim() || !validateEmail(email)) {
      setError('Valid email is required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    const { error: supaError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (supaError) {
      setError(supaError.message);
      showToast('Account creation failed');
    } else {
      setSuccessMsg('Account created! Check your email to confirm, then sign in.');
      showToast('Account created — check your email');
      setPassword('');
    }
    setSaving(false);
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setError('');
    if (!email.trim() || !validateEmail(email)) {
      setError('Valid email is required');
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
      showToast('Unable to send magic link');
    } else {
      setSuccessMsg('Magic link sent! Check your inbox.');
      showToast('Magic link sent!');
    }
    setSaving(false);
  }

  async function handleForgotPasswordRequest() {
    if (saving) return;
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !validateEmail(email)) {
      setError('Enter a valid email first to reset your password.');
      return;
    }

    setSaving(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (resetError) {
      setError(resetError.message);
      showToast('Unable to send recovery email');
    } else {
      setSuccessMsg('Password recovery email sent. Check your inbox for the reset link.');
      showToast('Recovery email sent');
    }
    setSaving(false);
  }

  const headingMap: Record<AuthMode, string> = {
    password: 'Sign in to your account',
    magic: 'Sign in with Magic Link',
    signup: 'Create your account',
  };

  return (
    <div className="login-bg">
      <div className="login-container">
        <div className="login-card">
          {/* Logo */}
          <div className="login-logo-row">
            <div className="login-logo-circle">
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="19" cy="19" r="19" fill="#2b3990"/>
                <path d="M19 8L24.5 28H13.5L19 8Z" fill="#fbb040"/>
              </svg>
            </div>
            <span className="login-title">MDB Solar OS</span>
          </div>

          <h2 className="login-heading">{headingMap[mode]}</h2>

          {toast && <div className="login-toast">{toast}</div>}
          {successMsg && <div className="login-success">{successMsg}</div>}

          {/* Mode tabs */}
          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab${mode === 'password' ? ' active' : ''}`}
              onClick={() => switchMode('password')}
            >
              Email &amp; Password
            </button>
            <button
              type="button"
              className={`login-tab${mode === 'magic' ? ' active' : ''}`}
              onClick={() => switchMode('magic')}
            >
              Magic Link
            </button>
          </div>

          {/* Email & Password sign-in */}
          {mode === 'password' && (
            <form className="login-form" onSubmit={handleEmailPasswordLogin} autoComplete="on">
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
                autoComplete="email"
              />
              <label htmlFor="password" className="login-label">Password</label>
              <input
                id="password"
                type="password"
                className="login-input"
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={saving}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-inline-link"
                onClick={handleForgotPasswordRequest}
                disabled={saving}
              >
                Forgot password?
              </button>
              {error && <div className="login-error">{error}</div>}
              <button type="submit" className="login-btn" disabled={saving}>
                {saving ? 'Signing in...' : 'Sign In'}
              </button>
              <button type="button" className="login-link-btn" onClick={() => switchMode('signup')}>
                Don&apos;t have an account? Create one
              </button>
            </form>
          )}

          {/* Magic Link */}
          {mode === 'magic' && (
            <form className="login-form" onSubmit={handleMagicLink} autoComplete="off">
              <label htmlFor="email-magic" className="login-label">Email address</label>
              <input
                id="email-magic"
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
              <button type="button" className="login-link-btn" onClick={() => switchMode('signup')}>
                Don&apos;t have an account? Create one
              </button>
            </form>
          )}

          {/* Sign up */}
          {mode === 'signup' && (
            <form className="login-form" onSubmit={handleSignUp} autoComplete="on">
              <label htmlFor="email-signup" className="login-label">Email address</label>
              <input
                id="email-signup"
                type="email"
                className="login-input"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={saving}
                autoFocus
                autoComplete="email"
              />
              <label htmlFor="password-signup" className="login-label">Password <span className="login-hint">(min. 8 characters)</span></label>
              <input
                id="password-signup"
                type="password"
                className="login-input"
                placeholder="Create a strong password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={saving}
                autoComplete="new-password"
              />
              {error && <div className="login-error">{error}</div>}
              <button type="submit" className="login-btn" disabled={saving}>
                {saving ? 'Creating account...' : 'Create Account'}
              </button>
              <button type="button" className="login-link-btn" onClick={() => switchMode('password')}>
                Already have an account? Sign in
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
          max-width: 390px;
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
          margin-bottom: 1rem;
          text-align: center;
        }
        .login-tabs {
          display: flex;
          width: 100%;
          gap: 0;
          margin-bottom: 1.3rem;
          border-radius: 8px;
          overflow: hidden;
          border: 1.5px solid #dbe2f3;
        }
        .login-tab {
          flex: 1;
          background: #f4f6fa;
          border: none;
          padding: 0.6em 0;
          font-size: 0.98rem;
          font-weight: 600;
          color: #2b3990;
          cursor: pointer;
          transition: background 0.18s, color 0.18s;
        }
        .login-tab.active {
          background: #2b3990;
          color: #fff;
        }
        .login-tab:not(:last-child) {
          border-right: 1.5px solid #dbe2f3;
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
        .login-hint {
          font-size: 0.88em;
          font-weight: 400;
          color: #7a88b8;
        }
        .login-input {
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
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(43,57,144,0.04);
          transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.13s;
          min-width: 120px;
          width: 100%;
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
        .login-link-btn {
          background: none;
          border: none;
          color: #2b3990;
          font-size: 0.97rem;
          cursor: pointer;
          padding: 0.3em 0;
          text-decoration: underline;
          text-underline-offset: 2px;
          text-align: center;
        }
        .login-link-btn:hover {
          color: #fbb040;
        }
        .login-inline-link {
          align-self: flex-start;
          background: none;
          border: none;
          color: #2b3990;
          cursor: pointer;
          font-size: 0.94rem;
          text-decoration: underline;
          text-underline-offset: 2px;
          padding: 0;
          margin-top: -0.2em;
        }
        .login-inline-link:hover {
          color: #fbb040;
        }
        .login-inline-link:disabled {
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
          width: 100%;
          box-sizing: border-box;
        }
        .login-success {
          color: #1a6632;
          background: #e6f4ec;
          border: 1.5px solid #7bc99b;
          border-radius: 7px;
          padding: 0.8em 1em;
          text-align: center;
          font-size: 1rem;
          margin-bottom: 0.8em;
          width: 100%;
          box-sizing: border-box;
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
