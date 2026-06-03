import type { ReactNode } from 'react';
import { Plus, Sun } from 'lucide-react';
import Sidebar from './Sidebar';
import AIAssistantPanel from '../ai/AIAssistantPanel';

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="shell-root">
      <Sidebar />
      <main className="shell-main">
        <div className="shell-top-strip">
          <button type="button" className="quick-btn primary" title="Coming soon">
            <Plus size={14} /> New Lead
          </button>
          <button type="button" className="quick-btn" title="Coming soon">
            <Sun size={14} /> Theme
          </button>
        </div>
        <div className="shell-content">{children}</div>
      </main>
      <AIAssistantPanel />

      <style jsx>{`
        .shell-root {
          min-height: 100vh;
          background: var(--mdb-background);
          color: var(--mdb-foreground);
          display: flex;
          width: 100%;
        }
        .shell-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          overflow-x: hidden;
        }
        .shell-top-strip {
          height: 48px;
          flex-shrink: 0;
          border-bottom: 1px solid var(--mdb-border);
          background: color-mix(in srgb, var(--mdb-background) 88%, white);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 30;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          padding: 0 14px;
        }
        .quick-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 8px;
          border: 1px solid var(--mdb-border);
          background: var(--mdb-card);
          color: var(--mdb-foreground);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 7px 10px;
        }
        .quick-btn.primary {
          background: color-mix(in srgb, var(--mdb-primary) 15%, white);
          border-color: color-mix(in srgb, var(--mdb-primary) 35%, var(--mdb-border));
          color: var(--mdb-primary);
        }
        .shell-content {
          min-width: 0;
          flex: 1;
          padding: 16px;
        }
        @media (max-width: 980px) {
          .shell-content {
            padding: 12px;
          }
          .shell-top-strip {
            top: 52px;
          }
        }
      `}</style>
    </div>
  );
}
