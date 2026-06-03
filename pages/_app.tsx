import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import AppShell from '../components/layout/AppShell';

function needsShell(pathname: string) {
  return [
    '/dashboard',
    '/pipeline',
    '/leads',
    '/proposals',
    '/tasks',
    '/customer-portal',
    '/solar-design-studio',
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function titleForPath(pathname: string) {
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/pipeline')) return 'Pipeline';
  if (pathname.startsWith('/leads')) return 'Leads';
  if (pathname.startsWith('/proposals')) return 'Proposals';
  if (pathname.startsWith('/tasks')) return 'Tasks';
  if (pathname.startsWith('/customer-portal')) return 'Customer Portal';
  if (pathname.startsWith('/solar-design-studio')) return 'Solar Design Studio';
  return 'MDB Solar OS';
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  if (!needsShell(router.pathname)) {
    return <Component {...pageProps} />;
  }

  return (
    <AppShell
      activePath={router.pathname}
      title={titleForPath(router.pathname)}
      subtitle="Lovable-inspired enterprise command interface"
    >
      <Component {...pageProps} />
    </AppShell>
  );
}
