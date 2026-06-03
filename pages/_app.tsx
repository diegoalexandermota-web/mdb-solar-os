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

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  if (!needsShell(router.pathname)) {
    return <Component {...pageProps} />;
  }

  return (
    <AppShell>
      <Component {...pageProps} />
    </AppShell>
  );
}
