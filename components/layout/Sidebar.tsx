import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Kanban,
  CheckSquare,
  FileText,
  HardHat,
  Trophy,
  Sun,
  Shield,
  Wallet,
  Users,
  Calendar,
  UserSquare2,
  Banknote,
  FileSignature,
  Wrench,
  Stamp,
  ClipboardCheck,
  Zap,
  LifeBuoy,
  FolderOpen,
  Sparkles,
  Bot,
  Megaphone,
  MessageCircle,
  BarChart3,
  PieChart,
  Gauge,
  Plug,
  Bell,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
} from 'lucide-react';

type Item = { href: string; label: string; icon: any; soon?: boolean };
type Group = { label: string; items: Item[] };

const GROUPS: Group[] = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/pipeline', label: 'Pipeline', icon: Kanban },
      { href: '/leads', label: 'Leads', icon: UserSquare2 },
      { href: '/tasks', label: 'Tasks', icon: CheckSquare },
      { href: '/calendar', label: 'Calendar', icon: Calendar, soon: true },
    ],
  },
  {
    label: 'Sales',
    items: [
      { href: '/proposals', label: 'Proposal Builder', icon: FileText },
      { href: '/financing', label: 'Financing', icon: Banknote, soon: true },
      { href: '/contracts', label: 'Contracts', icon: FileSignature, soon: true },
      { href: '/commissions', label: 'Commissions', icon: Wallet },
      { href: '/rep', label: 'Sales Rep', icon: Trophy, soon: true },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/projects', label: 'Project Tracker', icon: HardHat },
      { href: '/install-queue', label: 'Install Queue', icon: Wrench, soon: true },
      { href: '/permits', label: 'Permits', icon: Stamp, soon: true },
      { href: '/inspections', label: 'Inspections', icon: ClipboardCheck, soon: true },
      { href: '/pto-tracker', label: 'PTO Tracker', icon: Zap, soon: true },
    ],
  },
  {
    label: 'Customer',
    items: [
      { href: '/customer-portal', label: 'Customer Portal', icon: Users },
      { href: '/support-center', label: 'Support Center', icon: LifeBuoy, soon: true },
      { href: '/documents', label: 'Documents', icon: FolderOpen, soon: true },
      { href: '/solar-design-studio', label: 'Solar Design Studio', icon: Sun },
    ],
  },
  {
    label: 'AI & Automation',
    items: [
      { href: '/ai-assistant', label: 'MDB AI Assistant', icon: Sparkles, soon: true },
      { href: '/automations', label: 'Automations', icon: Bot, soon: true },
      { href: '/campaigns', label: 'Campaigns', icon: Megaphone, soon: true },
      { href: '/followups', label: 'Follow-Ups', icon: MessageCircle, soon: true },
    ],
  },
  {
    label: 'Management',
    items: [
      { href: '/reports', label: 'Reports', icon: BarChart3, soon: true },
      { href: '/analytics', label: 'Analytics', icon: PieChart, soon: true },
      { href: '/admin', label: 'Admin Console', icon: Shield },
      { href: '/team-performance', label: 'Team Performance', icon: Gauge, soon: true },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/integrations', label: 'Integrations', icon: Plug, soon: true },
      { href: '/notifications', label: 'Notifications', icon: Bell, soon: true },
      { href: '/settings', label: 'Settings', icon: Settings, soon: true },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  if (href === '/leads') return pathname === '/leads' || pathname.startsWith('/leads/');
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarBody({ pathname, collapsed, onNavigate }: { pathname: string; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav className="sidebar-body">
      {GROUPS.map((group) => (
        <div key={group.label} className="group-wrap">
          {!collapsed ? <div className="group-title">{group.label}</div> : <div className="divider" />}
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = !item.soon && isActive(pathname, item.href);
            const content = (
              <>
                <Icon className={`nav-icon${active ? ' active' : ''}`} size={16} />
                {!collapsed && (
                  <>
                    <span className="label">{item.label}</span>
                    {item.soon && <span className="soon">soon</span>}
                  </>
                )}
              </>
            );
            if (item.soon) {
              return (
                <button key={item.label} type="button" className="nav-row disabled" title={collapsed ? item.label : undefined}>
                  {content}
                </button>
              );
            }
            return (
              <Link key={item.label} href={item.href} className={`nav-row${active ? ' active' : ''}`} onClick={onNavigate} title={collapsed ? item.label : undefined}>
                {content}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export default function Sidebar() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="mobile-topbar">
        <button type="button" className="icon-btn" onClick={() => setMobileOpen(true)}>
          <Menu size={18} />
        </button>
        <div className="mobile-brand"><Sun size={16} /> MDB Solar OS</div>
      </div>

      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)}>
          <aside className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="brand-row">
              <div className="brand-badge"><Sun size={16} /></div>
              <div>
                <div className="brand-title">MDB Solar OS</div>
                <div className="brand-subtitle">AI Operating System</div>
              </div>
            </div>
            <SidebarBody pathname={router.pathname} collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <aside className={`desktop-sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="brand-row">
          <div className="brand-badge"><Sun size={16} /></div>
          {!collapsed && (
            <div>
              <div className="brand-title">MDB Solar OS</div>
              <div className="brand-subtitle">AI Operating System</div>
            </div>
          )}
        </div>

        <SidebarBody pathname={router.pathname} collapsed={collapsed} />

        <div className="sidebar-footer">
          <button type="button" className="collapse-btn" onClick={() => setCollapsed((v) => !v)}>
            {collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} /> Collapse</>}
          </button>
        </div>
      </aside>

      <style jsx>{`
        .mobile-topbar {
          display: none;
        }
        .mobile-overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.55);
          z-index: 60;
        }
        .mobile-drawer {
          width: 265px;
          height: 100vh;
          background: var(--mdb-sidebar);
          border-right: 1px solid var(--mdb-sidebar-border);
          overflow-y: auto;
        }
        .desktop-sidebar {
          display: none;
        }
        .brand-row {
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid var(--mdb-sidebar-border);
          padding: 14px 14px;
        }
        .brand-badge {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--mdb-gold), #f59e0b);
          display: grid;
          place-items: center;
          color: var(--mdb-navy);
          box-shadow: var(--mdb-shadow-elegant);
          flex-shrink: 0;
        }
        .brand-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--mdb-sidebar-foreground);
        }
        .brand-subtitle {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: color-mix(in srgb, var(--mdb-sidebar-foreground) 55%, transparent);
        }
        .sidebar-body {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .group-wrap {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .group-title {
          font-size: 10px;
          font-weight: 700;
          color: color-mix(in srgb, var(--mdb-sidebar-foreground) 45%, transparent);
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 2px 10px 4px;
        }
        .divider {
          margin: 6px 10px;
          border-top: 1px solid color-mix(in srgb, var(--mdb-sidebar-border) 80%, transparent);
        }
        .nav-row {
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 10px;
          padding: 8px 10px;
          color: color-mix(in srgb, var(--mdb-sidebar-foreground) 74%, transparent);
          text-decoration: none;
          border: 1px solid transparent;
          transition: all 0.18s ease;
          background: transparent;
          cursor: pointer;
        }
        .nav-row:hover {
          background: color-mix(in srgb, var(--mdb-sidebar-accent) 60%, transparent);
          color: var(--mdb-sidebar-foreground);
          transform: translateX(1px);
        }
        .nav-row.active {
          background: linear-gradient(90deg, color-mix(in srgb, var(--mdb-sidebar-accent) 90%, transparent), color-mix(in srgb, var(--mdb-sidebar-accent) 45%, transparent));
          border-color: color-mix(in srgb, var(--mdb-gold) 35%, transparent);
          box-shadow: inset 2px 0 0 0 var(--mdb-gold);
          color: var(--mdb-sidebar-foreground);
        }
        .nav-row.disabled {
          opacity: 0.76;
          cursor: default;
        }
        .nav-icon {
          color: color-mix(in srgb, var(--mdb-sidebar-foreground) 58%, transparent);
          flex-shrink: 0;
        }
        .nav-icon.active {
          color: var(--mdb-gold);
        }
        .label {
          font-size: 0.86rem;
          font-weight: 500;
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .soon {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-radius: 999px;
          padding: 2px 6px;
          border: 1px solid color-mix(in srgb, var(--mdb-gold) 35%, transparent);
          color: var(--mdb-gold);
          background: color-mix(in srgb, var(--mdb-gold) 13%, transparent);
        }
        .sidebar-footer {
          border-top: 1px solid var(--mdb-sidebar-border);
          padding: 8px;
        }
        .collapse-btn {
          width: 100%;
          border: none;
          background: transparent;
          color: color-mix(in srgb, var(--mdb-sidebar-foreground) 58%, transparent);
          border-radius: 8px;
          padding: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
        }
        .collapse-btn:hover {
          background: color-mix(in srgb, var(--mdb-sidebar-accent) 45%, transparent);
          color: var(--mdb-gold);
        }
        .icon-btn {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          border: 1px solid color-mix(in srgb, var(--mdb-sidebar-border) 80%, transparent);
          background: color-mix(in srgb, var(--mdb-sidebar-accent) 50%, transparent);
          color: var(--mdb-sidebar-foreground);
        }
        .mobile-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--mdb-sidebar-foreground);
          font-size: 0.9rem;
          font-weight: 700;
        }
        @media (max-width: 980px) {
          .mobile-topbar {
            display: flex;
            position: sticky;
            top: 0;
            z-index: 35;
            align-items: center;
            justify-content: space-between;
            background: var(--mdb-sidebar);
            border-bottom: 1px solid var(--mdb-sidebar-border);
            padding: 8px 10px;
            margin: -14px -14px 10px -14px;
          }
        }
        @media (min-width: 981px) {
          .desktop-sidebar {
            display: flex;
            flex-direction: column;
            height: 100vh;
            position: sticky;
            top: 0;
            width: 256px;
            background: var(--mdb-sidebar);
            border-right: 1px solid var(--mdb-sidebar-border);
          }
          .desktop-sidebar.collapsed {
            width: 72px;
          }
          .desktop-sidebar.collapsed .brand-row {
            justify-content: center;
          }
          .desktop-sidebar.collapsed .nav-row {
            justify-content: center;
            padding: 9px 8px;
          }
          .desktop-sidebar.collapsed .label,
          .desktop-sidebar.collapsed .soon {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
