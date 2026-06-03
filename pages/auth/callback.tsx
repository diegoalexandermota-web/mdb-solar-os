import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const exchangeCode = async () => {
      // Password recovery links commonly arrive with tokens in the URL hash.
      if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
        router.replace(`/reset-password${window.location.hash}`);
        return;
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