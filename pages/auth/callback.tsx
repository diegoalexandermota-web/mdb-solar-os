import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const exchangeCode = async () => {
      // Supabase recovery and hash-based auth links provide tokens in the URL hash.
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (type === 'recovery') {
            window.location.replace('/reset-password');
          } else {
            window.location.replace('/dashboard');
          }
          return;
        }
      }

      const rawCode = router.query.code;
      const code = Array.isArray(rawCode) ? rawCode[0] : rawCode;

      if (!code) {
        router.replace('/login?error=Missing%20authorization%20code');
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        router.replace(`/login?error=${encodeURIComponent(error.message)}`);
        return;
      }

      router.replace('/dashboard');
    };

    exchangeCode();
  }, [router]);

  return null;
}