import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

type AppShellProps = {
  activePath: string;
  title: string;
  subtitle?: string;
  topbarActions?: ReactNode;
  children: ReactNode;
};

export default function AppShell({ activePath, title, subtitle, topbarActions, children }: AppShellProps) {
  return (
    <div className="shell-root">
      <div className="shell-sidebar-wrap">
        <Sidebar activePath={activePath} />
      </div>

      <div className="shell-content-wrap">
        <Topbar title={title} subtitle={subtitle} actions={topbarActions} />
        <div className="shell-body">{children}</div>
      </div>

      <style jsx>{`
        .shell-root {
          min-height: 100vh;
          background: #0b1120;
          display: grid;
          grid-template-columns: 252px minmax(0, 1fr);
        }
        .shell-sidebar-wrap {
          min-width: 0;
        }
        .shell-content-wrap {
          min-width: 0;
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 20px;
        }
        .shell-body {
          min-width: 0;
        }
        @media (max-width: 980px) {
          .shell-root {
            grid-template-columns: 1fr;
          }
          .shell-sidebar-wrap {
            display: none;
          }
          .shell-content-wrap {
            padding: 14px;
          }
        }
      `}</style>
    </div>
  );
}
