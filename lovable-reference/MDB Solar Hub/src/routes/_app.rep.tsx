import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, DollarSign, Calendar, Target, GraduationCap, Crown } from "lucide-react";
import { PageHeader, StageBadge, ServicePill } from "@/components/page-header";
import { LEADS, REP_LEADERBOARD, TRAINING_SCRIPTS, fmtCurrency } from "@/lib/mdb-data";

export const Route = createFileRoute("/_app/rep")({
  head: () => ({ meta: [{ title: "Sales Rep — MDB Solar OS" }] }),
  component: RepDashboard,
});

function RepDashboard() {
  const me = "Diego Mota";
  const myLeads = LEADS.filter((l) => l.rep === me);
  const myAppts = myLeads.filter((l) => !["New Lead", "Contacted"].includes(l.stage));
  const myDeals = myLeads.filter((l) => ["Contract Signed", "Site Survey", "Permit", "Install Scheduled", "Installed", "PTO", "Commission Paid"].includes(l.stage));
  const myCommission = myDeals.length * 1980;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        eyebrow="My performance"
        title="Sales rep dashboard"
        subtitle="Track your pipeline, commissions, and where you stand on the MDB leaderboard."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RepKpi icon={Target} label="My leads" val={String(myLeads.length)} sub="this month" />
        <RepKpi icon={Calendar} label="My appointments" val={String(myAppts.length)} sub="scheduled" />
        <RepKpi icon={Trophy} label="Deals closed" val={String(myDeals.length)} sub="MTD" accent />
        <RepKpi icon={DollarSign} label="Commissions" val={fmtCurrency(myCommission)} sub="pending + paid" accent />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* My leads */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-card">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">My active leads</h3>
            <Link to="/pipeline" className="text-xs font-medium text-primary hover:underline">Open pipeline →</Link>
          </div>
          <div className="divide-y divide-border">
            {myLeads.slice(0, 8).map((l) => (
              <Link
                key={l.id}
                to="/leads/$leadId"
                params={{ leadId: l.id }}
                className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/50"
              >
                <div className="size-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
                  {l.name.split(" ").map((p) => p[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{l.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{l.address}</div>
                </div>
                <ServicePill service={l.service} />
                <StageBadge stage={l.stage} />
              </Link>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-card border border-border rounded-xl shadow-card">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <Crown className="size-4 text-gold" />
            <h3 className="font-semibold text-foreground">Leaderboard — November</h3>
          </div>
          <div className="p-2">
            {REP_LEADERBOARD.map((r, i) => (
              <div key={r.rep} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${r.rep === me ? "bg-gold/15 border border-gold/40" : ""}`}>
                <div className={`size-7 rounded-full grid place-items-center text-xs font-bold ${i === 0 ? "bg-gold text-gold-foreground" : i === 1 ? "bg-secondary text-foreground" : i === 2 ? "bg-orange-100 text-orange-900" : "bg-muted text-muted-foreground"}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{r.rep}{r.rep === me && " (you)"}</div>
                  <div className="text-[11px] text-muted-foreground">{r.deals} deals · {fmtCurrency(r.revenue)}</div>
                </div>
                <div className="text-xs font-bold text-success">{fmtCurrency(r.commission)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Training */}
      <div className="bg-card border border-border rounded-xl shadow-card">
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
          <GraduationCap className="size-4 text-primary" />
          <h3 className="font-semibold text-foreground">Training scripts</h3>
          <span className="ml-auto text-xs text-muted-foreground">Tap a card to drop into MDB AI</span>
        </div>
        <div className="p-5 grid md:grid-cols-3 gap-4">
          {TRAINING_SCRIPTS.map((s) => (
            <div key={s.title} className="rounded-lg border border-border p-4 hover:border-primary/40 transition-colors bg-secondary/30">
              <div className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">{s.title}</div>
              <p className="text-sm text-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RepKpi({ icon: Icon, label, val, sub, accent }: { icon: any; label: string; val: string; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-5 border shadow-card ${accent ? "bg-gradient-to-br from-navy to-primary text-primary-foreground border-transparent" : "bg-card border-border"}`}>
      <div className={`size-9 rounded-md grid place-items-center mb-3 ${accent ? "bg-gold text-gold-foreground" : "bg-primary/10 text-primary"}`}>
        <Icon className="size-4" />
      </div>
      <div className="text-2xl font-bold tracking-tight">{val}</div>
      <div className={`text-xs ${accent ? "opacity-80" : "text-muted-foreground"}`}>{label} · {sub}</div>
    </div>
  );
}