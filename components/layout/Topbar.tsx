import type { ReactNode } from 'react';

export function Topbar({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div className="header-copy">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="header-actions">{actions}</div>}

      <style jsx>{`
        .page-header {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 16px;
        }
        .header-copy {
          min-width: 0;
        }
        .eyebrow {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--mdb-primary);
        }
        h1 {
          margin: 8px 0 0;
          font-size: 1.78rem;
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: var(--mdb-foreground);
        }
        p {
          margin: 8px 0 0;
          font-size: 0.92rem;
          color: var(--mdb-muted);
          max-width: 820px;
        }
        .header-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}

export function StageBadge({ stage }: { stage: string }) {
  const map: Record<string, string> = {
    'New Lead': 'stage secondary',
    Contacted: 'stage primary',
    'Appointment Set': 'stage primary',
    'Proposal Sent': 'stage gold',
    'Credit Approved': 'stage success',
    'Contract Signed': 'stage success',
    'Site Survey': 'stage primary',
    Permit: 'stage warning',
    'Install Scheduled': 'stage primary',
    Installed: 'stage success',
    PTO: 'stage success',
    'Commission Paid': 'stage gold',
  };
  return <span className={map[stage] || 'stage secondary'}>{stage}</span>;
}

export function ServicePill({ service }: { service: string }) {
  const map: Record<string, string> = {
    Solar: 'service gold',
    Water: 'service sky',
    Roofing: 'service orange',
    HVAC: 'service emerald',
    Battery: 'service violet',
    'EV Charger': 'service cyan',
  };
  return <span className={map[service] || 'service gray'}>{service}</span>;
}
