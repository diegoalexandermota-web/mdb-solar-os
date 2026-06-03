import Link from 'next/link';

type NavItem = {
  label: string;
  href: string;
  soon?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Command Center',
    items: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Pipeline', href: '/pipeline' },
      { label: 'Leads', href: '/leads' },
      { label: 'Proposals', href: '/proposals' },
      { label: 'Tasks', href: '/tasks' },
    ],
  },
  {
    title: 'Experience',
    items: [
      { label: 'Customer Portal', href: '/customer-portal' },
      { label: 'Solar Design Studio', href: '/solar-design-studio' },
      { label: 'Commissions', href: '/commissions', soon: true },
    ],
  },
];

function isActiveRoute(activePath: string, href: string) {
  if (activePath === href) return true;
  if (href !== '/' && activePath.startsWith(`${href}/`)) return true;
  return false;
}

export default function Sidebar({ activePath }: { activePath: string }) {
  return (
    <aside className="shell-sidebar">
      <div className="shell-brand-row">
        <div className="shell-logo">
          <svg width="36" height="36" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="19" cy="19" r="19" fill="#0f172a" />
            <path d="M19 8L24.5 28H13.5L19 8Z" fill="#f59e0b" />
          </svg>
        </div>
        <div>
          <div className="shell-brand-title">MDB Solar OS</div>
          <div className="shell-brand-subtitle">Enterprise Hub</div>
        </div>
      </div>

      <nav className="shell-nav">
        {NAV_GROUPS.map((group) => (
          <section key={group.title} className="shell-nav-group">
            <div className="shell-nav-title">{group.title}</div>
            {group.items.map((item) => {
              const active = isActiveRoute(activePath, item.href);
              return (
                <Link key={item.href} href={item.href} className={`shell-nav-link${active ? ' active' : ''}`}>
                  <span>{item.label}</span>
                  {item.soon && <i className="soon-badge">Soon</i>}
                </Link>
              );
            })}
          </section>
        ))}
      </nav>

      <style jsx>{`
        .shell-sidebar {
          height: 100vh;
          position: sticky;
          top: 0;
          overflow-y: auto;
          background: linear-gradient(180deg, #020617 0%, #0f172a 58%, #111827 100%);
          border-right: 1px solid rgba(148, 163, 184, 0.24);
          padding: 20px 14px;
        }
        .shell-brand-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding: 8px 6px;
        }
        .shell-logo {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: linear-gradient(135deg, #f59e0b, #f97316);
          box-shadow: 0 8px 18px -8px rgba(249, 115, 22, 0.8);
        }
        .shell-brand-title {
          color: #f8fafc;
          font-size: 0.98rem;
          font-weight: 700;
          letter-spacing: 0.01em;
        }
        .shell-brand-subtitle {
          color: #94a3b8;
          font-size: 0.75rem;
        }
        .shell-nav {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .shell-nav-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .shell-nav-title {
          color: #64748b;
          font-size: 0.74rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
          padding: 0 8px;
          margin-bottom: 4px;
        }
        .shell-nav-link {
          color: #cbd5e1;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 11px;
          font-size: 0.92rem;
          transition: background-color 0.18s, color 0.18s, transform 0.12s;
        }
        .shell-nav-link:hover {
          background: rgba(30, 41, 59, 0.95);
          color: #fff;
          transform: translateX(2px);
        }
        .shell-nav-link.active {
          background: linear-gradient(90deg, rgba(29, 78, 216, 0.35), rgba(37, 99, 235, 0.2));
          border: 1px solid rgba(96, 165, 250, 0.4);
          color: #fff;
        }
        .soon-badge {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.35);
          border-radius: 999px;
          padding: 2px 7px;
          font-size: 0.66rem;
          font-style: normal;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
      `}</style>
    </aside>
  );
}
