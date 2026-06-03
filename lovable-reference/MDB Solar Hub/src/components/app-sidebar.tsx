import { useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Kanban, CheckSquare, FileText, HardHat, Trophy, Sun, LogOut,
  Shield, Wallet, Users, Calendar, UserSquare2, Banknote, FileSignature,
  Wrench, Stamp, ClipboardCheck, Zap, LifeBuoy, FolderOpen, Sparkles, Bot,
  Megaphone, MessageCircle, BarChart3, PieChart, Gauge, Plug, Bell, Settings,
  PanelLeftClose, PanelLeftOpen, Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";

type Item = { to: string; label: string; icon: any; soon?: boolean };
type Group = { label: string; items: Item[] };

const GROUPS: Group[] = [
  {
    label: "Main",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/pipeline", label: "Pipeline", icon: Kanban },
      { to: "/leads/L-1000", label: "Leads", icon: UserSquare2 },
      { to: "/tasks", label: "Tasks", icon: CheckSquare },
      { to: "#calendar", label: "Calendar", icon: Calendar, soon: true },
    ],
  },
  {
    label: "Sales",
    items: [
      { to: "/proposals", label: "Proposal Builder", icon: FileText },
      { to: "#financing", label: "Financing", icon: Banknote, soon: true },
      { to: "#contracts", label: "Contracts", icon: FileSignature, soon: true },
      { to: "/commissions", label: "Commissions", icon: Wallet },
      { to: "/rep", label: "Sales Rep", icon: Trophy },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/projects", label: "Project Tracker", icon: HardHat },
      { to: "#install-queue", label: "Install Queue", icon: Wrench, soon: true },
      { to: "#permits", label: "Permits", icon: Stamp, soon: true },
      { to: "#inspections", label: "Inspections", icon: ClipboardCheck, soon: true },
      { to: "#pto", label: "PTO Tracker", icon: Zap, soon: true },
    ],
  },
  {
    label: "Customer",
    items: [
      { to: "/portal", label: "Customer Portal", icon: Users },
      { to: "#support", label: "Support Center", icon: LifeBuoy, soon: true },
      { to: "#documents", label: "Documents", icon: FolderOpen, soon: true },
    ],
  },
  {
    label: "AI & Automation",
    items: [
      { to: "#ai", label: "MDB AI Assistant", icon: Sparkles, soon: true },
      { to: "#automations", label: "Automations", icon: Bot, soon: true },
      { to: "#campaigns", label: "Campaigns", icon: Megaphone, soon: true },
      { to: "#followups", label: "Follow-Ups", icon: MessageCircle, soon: true },
    ],
  },
  {
    label: "Management",
    items: [
      { to: "#reports", label: "Reports", icon: BarChart3, soon: true },
      { to: "#analytics", label: "Analytics", icon: PieChart, soon: true },
      { to: "/admin", label: "Admin Console", icon: Shield },
      { to: "#team", label: "Team Performance", icon: Gauge, soon: true },
    ],
  },
  {
    label: "System",
    items: [
      { to: "#integrations", label: "Integrations", icon: Plug, soon: true },
      { to: "#notifications", label: "Notifications", icon: Bell, soon: true },
      { to: "#settings", label: "Settings", icon: Settings, soon: true },
    ],
  },
];

function NavRow({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: Item;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const base = cn(
    "group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all",
    collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
    active
      ? "bg-gradient-to-r from-sidebar-accent to-sidebar-accent/40 text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--gold)]"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:translate-x-[1px]",
  );

  const content = (
    <>
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active ? "text-gold" : "text-sidebar-foreground/60 group-hover:text-gold",
        )}
      />
      {!collapsed && (
        <>
          <span className="truncate flex-1">{item.label}</span>
          {item.soon && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sidebar-accent text-sidebar-foreground/60">
              soon
            </span>
          )}
        </>
      )}
    </>
  );

  if (item.soon) {
    return (
      <button
        type="button"
        title={collapsed ? item.label : undefined}
        className={cn(base, "cursor-default opacity-80 w-full text-left")}
      >
        {content}
      </button>
    );
  }

  return (
    <Link to={item.to} onClick={onNavigate} title={collapsed ? item.label : undefined} className={base}>
      {content}
    </Link>
  );
}

function SidebarBody({
  pathname,
  collapsed,
  onNavigate,
}: {
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const isActive = (to: string) => {
    if (to.startsWith("#")) return false;
    if (to === "/dashboard") return pathname === "/dashboard";
    // /leads/L-1000 — match any /leads/*
    if (to.startsWith("/leads/")) return pathname.startsWith("/leads/");
    return pathname === to || pathname.startsWith(to + "/");
  };

  return (
    <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 scrollbar-thin">
      {GROUPS.map((g) => (
        <div key={g.label} className="space-y-0.5">
          {!collapsed ? (
            <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-sidebar-foreground/40">
              {g.label}
            </div>
          ) : (
            <div className="mx-2 my-2 border-t border-sidebar-border/60" />
          )}
          {g.items.map((item) => (
            <NavRow
              key={item.label}
              item={item}
              active={isActive(item.to)}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 border-b border-sidebar-border",
        collapsed ? "px-3 py-4 justify-center" : "px-4 py-4",
      )}
    >
      <div className="size-9 rounded-lg bg-gradient-to-br from-gold to-warning grid place-items-center shadow-elegant shrink-0">
        <Sun className="size-5 text-gold-foreground" strokeWidth={2.5} />
      </div>
      {!collapsed && (
        <div className="leading-tight min-w-0">
          <div className="font-bold tracking-tight text-sidebar-foreground truncate">MDB Solar OS</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/50">AI Operating System</div>
        </div>
      )}
    </div>
  );
}

function UserCard({ collapsed }: { collapsed: boolean }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const fullName = (user?.user_metadata?.full_name as string | undefined) || user?.email || "Diego Mota";
  const initials = fullName
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "DM";
  const role = "Founder · MDB Admin";

  async function handleLogout() {
    await signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className={cn("border-t border-sidebar-border", collapsed ? "p-2" : "p-3")}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg",
          collapsed ? "justify-center p-1" : "p-2 bg-sidebar-accent/40",
        )}
      >
        <div className="size-8 rounded-full bg-gradient-to-br from-gold to-primary-glow grid place-items-center text-xs font-bold text-navy shrink-0">
          {initials}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 leading-tight min-w-0">
              <div className="text-sm font-semibold truncate text-sidebar-foreground">{fullName}</div>
              <div className="text-[10px] text-sidebar-foreground/55 truncate uppercase tracking-wider">
                {role}
              </div>
            </div>
            <button onClick={handleLogout} title="Sign out" className="text-sidebar-foreground/50 hover:text-gold transition-colors">
              <LogOut className="size-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-12 bg-sidebar text-sidebar-foreground border-b border-sidebar-border flex items-center justify-between px-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className="size-9 grid place-items-center rounded-md hover:bg-sidebar-accent">
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-sidebar text-sidebar-foreground border-sidebar-border">
            <div className="flex flex-col h-full">
              <Brand collapsed={false} />
              <SidebarBody pathname={pathname} collapsed={false} onNavigate={() => setMobileOpen(false)} />
              <UserCard collapsed={false} />
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-gold grid place-items-center">
            <Sun className="size-4 text-gold-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm">MDB Solar OS</span>
        </div>
        <ThemeToggle />
      </div>
      {/* Spacer so mobile top bar doesn't overlap content */}
      <div className="md:hidden h-12 shrink-0" aria-hidden />

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-[width] duration-200",
          collapsed ? "w-[68px]" : "w-64",
        )}
      >
        <Brand collapsed={collapsed} />
        <SidebarBody pathname={pathname} collapsed={collapsed} />
        <div className="px-2 pb-2">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "w-full flex items-center gap-2 rounded-md text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/55 hover:text-gold hover:bg-sidebar-accent/40 transition-colors",
              collapsed ? "justify-center py-2" : "px-3 py-2",
            )}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <><PanelLeftClose className="size-4" /> Collapse</>}
          </button>
        </div>
        <UserCard collapsed={collapsed} />
      </aside>
    </>
  );
}