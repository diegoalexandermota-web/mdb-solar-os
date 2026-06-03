import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users, CalendarCheck, FileText, FileSignature, HardHat, DollarSign, TrendingUp, Activity,
  ArrowUpRight, Sun, Droplets, Flame,
} from "lucide-react";
import { PageHeader, StageBadge, ServicePill } from "@/components/page-header";
import { LEADS, fmtCurrency } from "@/lib/mdb-data";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MDB Solar OS" }] }),
  component: Dashboard,
});

function Kpi({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: string; sub: string; accent?: "gold" | "primary" | "success" }) {
  const accentCls = accent === "gold" ? "bg-gold/15 text-navy" : accent === "success" ? "bg-success/15 text-success" : "bg-primary/10 text-primary";
  return (
    <div className="bg-card rounded-xl p-3.5 border border-border shadow-card hover:shadow-elegant hover:border-primary/30 transition-all">
      <div className="flex items-center justify-between">
        <div className={`size-8 rounded-md grid place-items-center ${accentCls}`}>
          <Icon className="size-4" />
        </div>
        <div className="text-[10px] text-success font-semibold flex items-center gap-0.5">
          <ArrowUpRight className="size-3" /> {sub}
        </div>
      </div>
      <div className="mt-2.5 text-xl font-bold tracking-tight text-foreground leading-none">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1 truncate">{label}</div>
    </div>
  );
}

function Dashboard() {
  const installed = LEADS.filter((l) => ["Installed", "PTO", "Commission Paid"].includes(l.stage)).length;
  const proposals = LEADS.filter((l) => ["Proposal Sent", "Credit Approved", "Contract Signed", "Site Survey", "Permit", "Install Scheduled", "Installed", "PTO", "Commission Paid"].includes(l.stage)).length;
  const contracts = LEADS.filter((l) => ["Contract Signed", "Site Survey", "Permit", "Install Scheduled", "Installed", "PTO", "Commission Paid"].includes(l.stage)).length;
  const appointments = LEADS.filter((l) => l.stage !== "New Lead" && l.stage !== "Contacted").length;
  const recent = LEADS.slice(0, 6);
  const monthlyRev = contracts * 28400;
  const pendingComm = (contracts - installed) * 1980;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <PageHeader
        eyebrow="Operations · This month"
        title="Good morning, Diego ☀️"
        subtitle="Here's how MDB Solar is performing today. Pipeline is healthy — focus your follow-ups on Credit Approved and Proposal Sent."
        actions={
          <Link
            to="/pipeline"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
          >
            Open pipeline <ArrowUpRight className="size-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 2xl:grid-cols-8 gap-3">
        <Kpi icon={Users} label="Total leads" value={String(LEADS.length)} sub="+12%" accent="primary" />
        <Kpi icon={CalendarCheck} label="Appointments booked" value={String(appointments)} sub="+8%" accent="primary" />
        <Kpi icon={FileText} label="Proposals sent" value={String(proposals)} sub="+22%" accent="gold" />
        <Kpi icon={FileSignature} label="Contracts signed" value={String(contracts)} sub="+5%" accent="success" />
        <Kpi icon={HardHat} label="Installed projects" value={String(installed)} sub="+3" accent="success" />
        <Kpi icon={DollarSign} label="Pending commissions" value={fmtCurrency(pendingComm)} sub="+$4.2k" accent="gold" />
        <Kpi icon={TrendingUp} label="Monthly revenue est." value={fmtCurrency(monthlyRev)} sub="+18%" accent="primary" />
        <Kpi icon={Activity} label="Conversion rate" value="24.6%" sub="+1.4pt" accent="success" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Funnel */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Pipeline funnel</h3>
              <p className="text-xs text-muted-foreground">Drag-and-drop in the Pipeline view.</p>
            </div>
            <Link to="/pipeline" className="text-xs font-medium text-primary hover:underline">View all →</Link>
          </div>
          <div className="space-y-2.5">
            {[
              { label: "New Lead → Contacted", n: 28, w: 100 },
              { label: "Contacted → Appointment Set", n: 22, w: 78 },
              { label: "Appointment → Proposal Sent", n: 17, w: 60 },
              { label: "Proposal → Credit Approved", n: 12, w: 42 },
              { label: "Credit → Contract Signed", n: 9, w: 32 },
              { label: "Contract → Installed", n: 7, w: 25 },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <div className="w-56 text-xs text-muted-foreground shrink-0">{row.label}</div>
                <div className="flex-1 h-7 bg-secondary rounded-md overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary-glow flex items-center justify-end px-2 text-[11px] font-semibold text-primary-foreground"
                    style={{ width: `${row.w}%` }}
                  >
                    {row.n}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service mix */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-1">Service mix</h3>
          <p className="text-xs text-muted-foreground mb-5">Bundled deals lift commission 38%.</p>
          <div className="space-y-3">
            {[
              { icon: Sun, label: "Solar", n: 14, pct: 58, color: "bg-gold" },
              { icon: Droplets, label: "Water treatment", n: 7, pct: 29, color: "bg-primary" },
              { icon: Flame, label: "HVAC / Roof", n: 4, pct: 17, color: "bg-success" },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <s.icon className="size-3.5 text-primary" /> {s.label}
                  </div>
                  <span className="text-muted-foreground">{s.n} deals</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-navy to-primary text-primary-foreground">
            <div className="text-[10px] uppercase tracking-widest opacity-70">MDB AI Insight</div>
            <p className="text-sm mt-1.5 leading-relaxed">
              7 leads with "Proposal Sent" haven't been touched in 4+ days.{" "}
              <span className="text-gold font-semibold">Draft follow-ups →</span>
            </p>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-card rounded-xl border border-border shadow-card">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Recent leads</h3>
          <Link to="/pipeline" className="text-xs font-medium text-primary hover:underline">All leads →</Link>
        </div>
        <div className="divide-y divide-border">
          {recent.map((l) => (
            <Link
              key={l.id}
              to="/leads/$leadId"
              params={{ leadId: l.id }}
              className="flex items-center gap-4 px-6 py-3.5 hover:bg-secondary/50 transition-colors"
            >
              <div className="size-9 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground grid place-items-center text-xs font-semibold">
                {l.name.split(" ").map((p) => p[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{l.name}</div>
                <div className="text-xs text-muted-foreground truncate">{l.address} · {l.utility} · {fmtCurrency(l.bill)}/mo</div>
              </div>
              <ServicePill service={l.service} />
              <StageBadge stage={l.stage} />
              <div className="text-xs text-muted-foreground hidden md:block w-24 truncate text-right">{l.rep}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}