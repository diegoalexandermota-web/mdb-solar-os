import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users, Briefcase, DollarSign, HardHat, AlertTriangle, Clock,
  TrendingUp, PieChart, Wallet, ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { LEADS, REP_LEADERBOARD, TASKS, COMMISSIONS, fmtCurrency } from "@/lib/mdb-data";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Admin Console — MDB Solar OS" }] }),
  component: AdminConsole,
});

function AdminConsole() {
  const installed = LEADS.filter((l) => ["Installed", "PTO", "Commission Paid"].includes(l.stage)).length;
  const pipelineValue = LEADS.length * 28400;
  const pendingComm = COMMISSIONS.filter((c) => c.status !== "Paid").reduce((s, c) => s + c.commission, 0);
  const atRisk = LEADS.filter((l) => l.badges.includes("Install Risk") || l.badges.includes("Missing Documents")).length;
  const overdue = TASKS.filter((t) => !t.done && (t.due === "Today" || t.due === "Tomorrow")).length;
  const revenueEst = installed * 32800;

  const mix = ["Solar", "Water", "Roofing", "HVAC", "Battery", "EV Charger"].map((s) => ({
    s,
    n: LEADS.filter((l) => l.service === s).length,
  }));
  const mixTotal = mix.reduce((a, b) => a + b.n, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        eyebrow="Admin · Diego Mota"
        title="Admin Console"
        subtitle="Company-wide view of MDB operations. Drill into reps, projects, commissions, and risk."
        actions={
          <Link to="/pipeline" className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium">
            View pipeline <ArrowUpRight className="size-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi icon={Users} label="Company-wide leads" val={String(LEADS.length)} sub="+12%" />
        <Kpi icon={TrendingUp} label="Pipeline value" val={fmtCurrency(pipelineValue)} sub="open deals" accent="primary" />
        <Kpi icon={HardHat} label="Installed projects" val={String(installed)} sub="PTO + done" accent="success" />
        <Kpi icon={Wallet} label="Pending commissions" val={fmtCurrency(pendingComm)} sub={`${COMMISSIONS.filter(c=>c.status!=="Paid").length} reps`} accent="gold" />
        <Kpi icon={AlertTriangle} label="Projects at risk" val={String(atRisk)} sub="docs / install" accent="warning" />
        <Kpi icon={Clock} label="Tasks overdue" val={String(overdue)} sub="today + tomorrow" accent="warning" />
        <Kpi icon={DollarSign} label="Revenue estimate" val={fmtCurrency(revenueEst)} sub="MTD" accent="success" />
        <Kpi icon={Briefcase} label="Active reps" val={String(REP_LEADERBOARD.length)} sub="this month" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Rep performance */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-card">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Rep performance</h3>
            <Link to="/commissions" className="text-xs font-medium text-primary hover:underline">Commissions →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wide text-muted-foreground bg-secondary/40">
                <tr>
                  <th className="text-left px-5 py-2.5 font-semibold">Rep</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Deals</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Revenue</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Commission</th>
                  <th className="text-right px-5 py-2.5 font-semibold">Quota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {REP_LEADERBOARD.map((r, i) => {
                  const quota = Math.min(100, Math.round((r.deals / 14) * 100));
                  return (
                    <tr key={r.rep} className="hover:bg-secondary/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-full bg-primary/10 text-primary grid place-items-center text-[10px] font-bold">
                            {r.rep.split(" ").map(p => p[0]).join("")}
                          </div>
                          <span className="font-medium text-foreground">{r.rep}</span>
                          {i === 0 && <span className="text-[10px] font-bold text-navy bg-gold/30 px-1.5 rounded">#1</span>}
                        </div>
                      </td>
                      <td className="text-right px-3 py-3 text-foreground">{r.deals}</td>
                      <td className="text-right px-3 py-3 text-foreground">{fmtCurrency(r.revenue)}</td>
                      <td className="text-right px-3 py-3 font-semibold text-success">{fmtCurrency(r.commission)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary to-primary-glow" style={{ width: `${quota}%` }} />
                          </div>
                          <span className="text-[11px] text-muted-foreground w-9 text-right">{quota}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Service mix */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <PieChart className="size-4 text-primary" />
            <h3 className="font-semibold text-foreground">Service mix</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">All MDB services across active leads.</p>
          <div className="space-y-3">
            {mix.map((m) => (
              <div key={m.s}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-foreground font-medium">{m.s}</span>
                  <span className="text-muted-foreground">{m.n} leads</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary-glow" style={{ width: `${(m.n / mixTotal) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk panel */}
      <div className="bg-card border border-border rounded-xl shadow-card">
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
          <AlertTriangle className="size-4 text-destructive" />
          <h3 className="font-semibold text-foreground">Projects at risk</h3>
          <span className="ml-auto text-xs text-muted-foreground">Auto-flagged by MDB AI</span>
        </div>
        <div className="divide-y divide-border">
          {LEADS.filter((l) => l.badges.some((b) => ["Install Risk","Missing Documents"].includes(b))).slice(0,6).map((l) => (
            <Link key={l.id} to="/leads/$leadId" params={{ leadId: l.id }} className="flex items-center gap-4 px-5 py-3 hover:bg-secondary/50">
              <div className="size-9 rounded-full bg-destructive/10 text-destructive grid place-items-center text-xs font-bold">
                {l.name.split(" ").map(p => p[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{l.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">{l.address} · {l.utility}</div>
              </div>
              <div className="hidden sm:flex gap-1">
                {l.badges.filter(b => ["Install Risk","Missing Documents"].includes(b)).map(b => (
                  <span key={b} className="text-[10px] font-bold uppercase tracking-wide bg-destructive/15 text-destructive border border-destructive/30 px-1.5 py-0.5 rounded">{b}</span>
                ))}
              </div>
              <div className="text-xs text-muted-foreground w-28 truncate text-right hidden md:block">{l.rep}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, val, sub, accent }: { icon: any; label: string; val: string; sub: string; accent?: "primary" | "gold" | "success" | "warning" }) {
  const cls = accent === "gold" ? "bg-gold/15 text-navy" : accent === "success" ? "bg-success/15 text-success" : accent === "warning" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary";
  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-card">
      <div className={`size-9 rounded-md grid place-items-center mb-3 ${cls}`}><Icon className="size-4" /></div>
      <div className="text-2xl font-bold tracking-tight text-foreground">{val}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label} · {sub}</div>
    </div>
  );
}