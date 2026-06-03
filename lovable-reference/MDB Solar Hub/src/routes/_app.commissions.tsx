import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Wallet, DollarSign, Clock, CheckCircle2, PauseCircle, Filter } from "lucide-react";
import { PageHeader, ServicePill } from "@/components/page-header";
import { COMMISSIONS, REPS, fmtCurrency, type CommissionStatus, type CommissionMilestone } from "@/lib/mdb-data";

export const Route = createFileRoute("/_app/commissions")({
  head: () => ({ meta: [{ title: "Commissions — MDB Solar OS" }] }),
  component: Commissions,
});

const STATUSES: CommissionStatus[] = ["Pending", "Approved", "Paid", "Hold"];
const MILESTONES: CommissionMilestone[] = ["Contract", "NTP", "Install", "PTO", "Paid"];

function Commissions() {
  const [status, setStatus] = useState<CommissionStatus | "">("");
  const [rep, setRep] = useState("");

  const filtered = COMMISSIONS.filter((c) =>
    (!status || c.status === status) && (!rep || c.rep === rep)
  );

  const totalPending = COMMISSIONS.filter((c) => c.status === "Pending").reduce((s, c) => s + c.commission, 0);
  const totalApproved = COMMISSIONS.filter((c) => c.status === "Approved").reduce((s, c) => s + c.commission, 0);
  const totalPaid = COMMISSIONS.filter((c) => c.status === "Paid").reduce((s, c) => s + c.commission, 0);
  const totalHold = COMMISSIONS.filter((c) => c.status === "Hold").reduce((s, c) => s + c.commission, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        eyebrow="Finance · MDB Admin"
        title="Commissions"
        subtitle="Track every commission from contract to payout. Approve, hold, or release directly from this view."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SumCard icon={Clock} label="Pending" val={totalPending} tone="primary" />
        <SumCard icon={CheckCircle2} label="Approved" val={totalApproved} tone="success" />
        <SumCard icon={DollarSign} label="Paid YTD" val={totalPaid} tone="gold" />
        <SumCard icon={PauseCircle} label="On hold" val={totalHold} tone="warning" />
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card">
        <div className="px-5 py-3 border-b border-border flex flex-wrap items-center gap-2">
          <Filter className="size-3.5 text-muted-foreground" />
          <select value={status} onChange={(e) => setStatus(e.target.value as CommissionStatus)} className="text-xs rounded-md border border-input bg-background px-2 py-1">
            <option value="">Status: All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={rep} onChange={(e) => setRep(e.target.value)} className="text-xs rounded-md border border-input bg-background px-2 py-1">
            <option value="">Rep: All</option>
            {REPS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} commissions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wide text-muted-foreground bg-secondary/40">
              <tr>
                <th className="text-left px-5 py-2.5 font-semibold">Rep</th>
                <th className="text-left px-3 py-2.5 font-semibold">Customer</th>
                <th className="text-left px-3 py-2.5 font-semibold">Service</th>
                <th className="text-right px-3 py-2.5 font-semibold">Deal value</th>
                <th className="text-right px-3 py-2.5 font-semibold">Commission</th>
                <th className="text-left px-3 py-2.5 font-semibold">Milestone</th>
                <th className="text-left px-3 py-2.5 font-semibold">Status</th>
                <th className="text-left px-5 py-2.5 font-semibold">Expected payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-secondary/40">
                  <td className="px-5 py-3 font-medium text-foreground">{c.rep}</td>
                  <td className="px-3 py-3 text-foreground">{c.customer}</td>
                  <td className="px-3 py-3"><ServicePill service={c.service} /></td>
                  <td className="px-3 py-3 text-right text-foreground">{fmtCurrency(c.dealValue)}</td>
                  <td className="px-3 py-3 text-right font-semibold text-success">{fmtCurrency(c.commission)}</td>
                  <td className="px-3 py-3"><MileChip m={c.milestone} /></td>
                  <td className="px-3 py-3"><StatusChip s={c.status} /></td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{c.payoutDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SumCard({ icon: Icon, label, val, tone }: { icon: any; label: string; val: number; tone: "primary" | "success" | "gold" | "warning" }) {
  const cls = tone === "gold" ? "bg-gold/15 text-navy" : tone === "success" ? "bg-success/15 text-success" : tone === "warning" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary";
  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-card">
      <div className="flex items-center gap-3">
        <div className={`size-10 rounded-md grid place-items-center ${cls}`}><Icon className="size-5" /></div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-xl font-bold text-foreground">{fmtCurrency(val)}</div>
        </div>
      </div>
    </div>
  );
}

function StatusChip({ s }: { s: CommissionStatus }) {
  const map: Record<CommissionStatus, string> = {
    Pending: "bg-primary/10 text-primary",
    Approved: "bg-success/15 text-success",
    Paid: "bg-gold/20 text-navy",
    Hold: "bg-destructive/15 text-destructive",
  };
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${map[s]}`}>{s}</span>;
}

function MileChip({ m }: { m: CommissionMilestone }) {
  return <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-secondary text-secondary-foreground border border-border">{m}</span>;
}