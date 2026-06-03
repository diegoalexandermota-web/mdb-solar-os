import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div className="space-y-1.5 min-w-0">
        {eyebrow && (
          <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">{eyebrow}</div>
        )}
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StageBadge({ stage }: { stage: string }) {
  const map: Record<string, string> = {
    "New Lead": "bg-secondary text-secondary-foreground",
    "Contacted": "bg-primary/10 text-primary",
    "Appointment Set": "bg-primary/15 text-primary",
    "Proposal Sent": "bg-gold/20 text-navy",
    "Credit Approved": "bg-success/15 text-success",
    "Contract Signed": "bg-success/20 text-success",
    "Site Survey": "bg-primary-glow/15 text-primary",
    "Permit": "bg-warning/20 text-navy",
    "Install Scheduled": "bg-primary/15 text-primary",
    "Installed": "bg-success/20 text-success",
    "PTO": "bg-success/25 text-success",
    "Commission Paid": "bg-gold/30 text-navy",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${map[stage] ?? "bg-secondary"}`}>
      {stage}
    </span>
  );
}

export function ServicePill({ service }: { service: string }) {
  const map: Record<string, string> = {
    Solar: "bg-gold/20 text-navy border-gold/40",
    Water: "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950 dark:text-sky-200",
    Roofing: "bg-orange-100 text-orange-900 border-orange-300",
    HVAC: "bg-emerald-100 text-emerald-900 border-emerald-300",
    Battery: "bg-violet-100 text-violet-900 border-violet-300",
    "EV Charger": "bg-cyan-100 text-cyan-900 border-cyan-300",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${map[service] ?? "bg-secondary"}`}>
      {service}
    </span>
  );
}