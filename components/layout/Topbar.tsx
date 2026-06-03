import type { ReactNode } from 'react';

type TopbarProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export default function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <header className="shell-topbar">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="shell-topbar-actions">{actions}</div>}

      <style jsx>{`
        .shell-topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 18px;
        }
        .shell-topbar h1 {
          margin: 0;
          color: #0f172a;
          font-size: 1.55rem;
          letter-spacing: -0.03em;
        }
        .shell-topbar p {
          margin: 6px 0 0;
          color: #475569;
          font-size: 0.95rem;
        }
        .shell-topbar-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        @media (max-width: 860px) {
          .shell-topbar {
            flex-direction: column;
            align-items: stretch;
          }
          .shell-topbar-actions {
            justify-content: flex-start;
          }
        }
      `}</style>
    </header>
  );
}
