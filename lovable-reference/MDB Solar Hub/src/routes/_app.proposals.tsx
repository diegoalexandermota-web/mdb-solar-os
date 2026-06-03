import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, FileDown, Sun, Droplets, Wind, Zap, Battery, Plug, Info, Loader2, ShieldCheck, Wrench, BadgeDollarSign } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { fmtCurrency } from "@/lib/mdb-data";
import { fetchLeadById, toDbUuid, isDemoId } from "@/lib/leads-api";
import { supabase } from "@/integrations/supabase/client";
import { comingSoon } from "@/lib/actions";
import { FinancingEngine } from "@/components/financing-engine";
import { SolarDesignerDialog } from "@/components/solar-designer-dialog";
import { VisualSolarPreviewDialog } from "@/components/visual-solar-preview-dialog";
import type { FinancingScenario } from "@/lib/financing";
import { PROGRAM_LABEL, PROGRAM_DISCLAIMER, upsertScenarios } from "@/lib/financing";

type ProposalSearch = { lead_id?: string };

export const Route = createFileRoute("/_app/proposals")({
  head: () => ({ meta: [{ title: "Proposal Builder — MDB Solar OS" }] }),
  component: ProposalBuilder,
  validateSearch: (search: Record<string, unknown>): ProposalSearch => ({
    lead_id: typeof search.lead_id === "string" ? search.lead_id : undefined,
  }),
});

function ProposalBuilder() {
  const { lead_id } = Route.useSearch();
  const [name, setName] = useState("Carlos Hernandez");
  const [bill, setBill] = useState(312);
  const [utility, setUtility] = useState("Duke Energy");
  const [address, setAddress] = useState("2841 Reunion Blvd, Davenport, FL");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [creditRange, setCreditRange] = useState<string | null>(null);
  const [rate, setRate] = useState(0.158);
  const [water, setWater] = useState(true);
  const [roof, setRoof] = useState(false);
  const [battery, setBattery] = useState(false);
  const [ev, setEv] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeScenario, setActiveScenario] = useState<FinancingScenario | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [visualOpen, setVisualOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!lead_id) return;
    (async () => {
      const l = await fetchLeadById(lead_id);
      if (cancelled || !l) return;
      setLeadId(l.id);
      setName(l.name);
      if (l.bill) setBill(l.bill);
      if (l.utility) setUtility(l.utility);
      if (l.address) setAddress(l.address);
      if (l.credit) setCreditRange(l.credit);
    })();
    return () => { cancelled = true; };
  }, [lead_id]);

  const annualUsage = Math.round((bill / rate) * 12); // kWh/yr
  const systemKw = +(bill / 35).toFixed(2);
  const panels = Math.round(bill / 14);
  const estProduction = Math.round(systemKw * 1450); // FL kWh/kW/yr
  const offset = Math.min(110, Math.round((estProduction / annualUsage) * 100));
  const activePay = activeScenario?.monthly_payment ?? 0;
  const savings = Math.max(0, bill - activePay);
  const waterAdd = water ? 39 : 0;
  const roofAdd = roof ? 89 : 0;
  const batteryAdd = battery ? 74 : 0;
  const evAdd = ev ? 22 : 0;
  const total = activePay + waterAdd + roofAdd + batteryAdd + evAdd;

  const utility25Total = Math.round(
    Array.from({ length: 25 }, (_, i) => bill * 12 * Math.pow(1.06, i)).reduce((a, b) => a + b, 0),
  );
  const mdb25 = activeScenario?.estimated_25_year_cost ?? 0;
  const savings25 = activeScenario?.estimated_25_year_savings ?? Math.max(0, utility25Total - mdb25);
  const programType = activeScenario?.program_type ?? "loan";
  const plan = {
    label: activeScenario ? activeScenario.scenario_name : "Solar plan",
    paymentLabel:
      programType === "cash" ? "Cash purchase"
      : programType === "loan" ? "Loan payment"
      : programType === "pace" ? "PACE payment"
      : `${PROGRAM_LABEL[programType]} payment`,
    ownership: activeScenario?.ownership_type ?? "—",
    taxCredit: activeScenario?.tax_credit_eligible
      ? "Customer eligible (subject to tax situation)"
      : "Belongs to provider / not customer-eligible",
    maintenance: activeScenario?.maintenance_included
      ? "Included by provider"
      : "Customer responsibility (warranty dependent)",
    longTerm:
      programType === "loan" || programType === "cash" ? "Higher long-term ownership benefit"
      : programType === "pace" ? "Tied to property tax assessment"
      : "Lower upfront responsibility, simpler maintenance",
    transfer: activeScenario?.transferability_notes || "—",
    disclaimer: PROGRAM_DISCLAIMER[programType],
  };

  async function generate() {
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id ?? null;
    const dbLeadId = toDbUuid(leadId);
    if (leadId && isDemoId(leadId)) {
      toast.message("Demo lead detected", {
        description: "Saving proposal without a linked lead. Create a real Supabase lead to link records.",
      });
    }
    const payload: Record<string, unknown> = {
      lead_id: dbLeadId,
      customer_name: name,
      address,
      utility_company: utility,
      service_type: "Solar",
      provider: activeScenario?.provider ?? null,
      monthly_bill: bill,
      estimated_system_size_kw: systemKw,
      estimated_panels: panels,
      estimated_payment: activePay,
      estimated_monthly_savings: savings,
      estimated_25_year_cost: activeScenario?.estimated_25_year_cost ?? null,
      estimated_25_year_savings: activeScenario?.estimated_25_year_savings ?? null,
      lease_option: programType === "lease_ppa",
      loan_option: programType === "loan",
      financing_type: programType,
      water_add_on: water,
      roof_hvac_add_on: roof,
      battery_add_on: battery,
      created_by: userId,
    };
    const { data, error } = await supabase.from("proposals").insert(payload).select().single();
    setSaving(false);
    if (error) {
      toast.error("Couldn't save proposal", { description: error.message });
      return;
    }
    if (data && activeScenario) {
      await upsertScenarios([activeScenario], {
        lead_id: dbLeadId,
        proposal_id: (data as { id: string }).id,
      });
    }
    toast.success("Proposal generated successfully.");
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        eyebrow="Proposal builder"
        title="Build a proposal in 60 seconds"
        subtitle="Uses MDB estimate assumptions. Final proposal must be verified before contract."
        actions={
          <>
            <button
              onClick={() => comingSoon("AI rewrite")}
              className="inline-flex items-center gap-2 bg-card border border-border hover:bg-secondary px-3 py-2 rounded-md text-sm font-medium"
            >
              <Sparkles className="size-4 text-primary" /> AI rewrite
            </button>
            <button
              onClick={() => setAiOpen(true)}
              className="inline-flex items-center gap-2 bg-card border border-border hover:bg-secondary px-3 py-2 rounded-md text-sm font-medium"
            >
              <Sparkles className="size-4 text-primary" /> AI Solar Designer
            </button>
            <button
              onClick={() => setVisualOpen(true)}
              className="inline-flex items-center gap-2 bg-card border border-border hover:bg-secondary px-3 py-2 rounded-md text-sm font-medium"
            >
              <Sparkles className="size-4 text-primary" /> AI Visual Preview
            </button>
            <button
              onClick={generate}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-gold text-gold-foreground hover:opacity-90 px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
              Generate Proposal
            </button>
          </>
        }
      />

      <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-2.5 flex items-start gap-2.5 text-xs text-navy">
        <Info className="size-4 mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold">Estimate only.</span> Numbers below use MDB internal assumptions for FL roofs and utility rate trends. Verify with site survey, credit approval, and utility production data before issuing a binding contract.
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-2 space-y-4">
          <Card title="Customer info">
            <Field label="Customer name">
              <input value={name} onChange={(e) => setName(e.target.value)} className="ipt" />
            </Field>
            <Field label="Service address">
              <input value={address} onChange={(e) => setAddress(e.target.value)} className="ipt" />
            </Field>
            <Field label="Utility">
              <select value={utility} onChange={(e) => setUtility(e.target.value)} className="ipt">
                <option>Duke Energy</option><option>FPL</option><option>TECO</option><option>OUC</option><option>JEA</option>
              </select>
            </Field>
          </Card>

          <Card title="System sizing">
            <Field label="Current monthly utility bill (USD)">
              <input type="number" value={bill} onChange={(e) => setBill(+e.target.value || 0)} className="ipt" />
            </Field>
            <Field label="Utility rate assumption ($/kWh)">
              <input type="number" step="0.001" value={rate} onChange={(e) => setRate(+e.target.value || 0.001)} className="ipt" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Estimated annual usage" val={`${annualUsage.toLocaleString()} kWh`} />
              <Stat label="Estimated system size" val={`${systemKw} kW`} />
              <Stat label="Estimated panels" val={`${panels} × 410W`} />
              <Stat label="Estimated production" val={`${estProduction.toLocaleString()} kWh/yr`} />
              <Stat label="Offset" val={`${offset}%`} />
            </div>
          </Card>

          <FinancingEngine
            leadId={leadId}
            bill={bill}
            systemKw={systemKw}
            creditRange={creditRange}
            utility={utility}
            onActiveChange={setActiveScenario}
          />

          <Card title="Add-ons">
            <AddOn checked={water} onChange={setWater} icon={Droplets} title="Water treatment add-on" sub="Whole-home softener · $39/mo · same-day install" />
            <AddOn checked={roof} onChange={setRoof} icon={Wind} title="Roof / HVAC add-on" sub="Re-roof bundle · $89/mo · 25-yr warranty" />
            <AddOn checked={battery} onChange={setBattery} icon={Battery} title="Battery add-on" sub="Tesla Powerwall 3 · $74/mo · hurricane backup" />
            <AddOn checked={ev} onChange={setEv} icon={Plug} title="EV charger add-on" sub="Level-2 hardwired · $22/mo · installed at install day" />
          </Card>
        </div>

        {/* Preview */}
        <div className="lg:col-span-3">
          <div className="bg-card border border-border rounded-xl shadow-elegant overflow-hidden sticky top-6">
            <div className="p-6 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="size-8 rounded-md bg-gold grid place-items-center"><Sun className="size-4 text-gold-foreground" strokeWidth={2.5} /></div>
                <div className="text-xs uppercase tracking-widest font-semibold opacity-80">MDB Solar — Custom Proposal</div>
              </div>
              <div className="text-2xl font-bold">{name}</div>
              <div className="text-sm opacity-80">Prepared by Diego Mota · MDB Founder · for {utility} customer</div>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <Big label="System size" val={`${systemKw} kW`} icon={Sun} />
                <Big label={plan.paymentLabel} val={fmtCurrency(activePay)} icon={Zap} accent />
                <Big label="Monthly savings" val={fmtCurrency(savings)} icon={Sparkles} />
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{utility} vs MDB Solar — Year 1</div>
                <div className="space-y-2">
                  <BarRow label={`${utility} bill`} amount={bill} max={bill} color="bg-muted-foreground/60" />
                  <BarRow label={`MDB Solar (${plan.label})`} amount={activePay} max={bill} color="bg-gradient-to-r from-primary to-primary-glow" />
                </div>
                <div className="text-[11px] text-muted-foreground mt-2">
                  Utility projected to increase ~6% annually (MDB assumption).{" "}
                  {programType === "loan" || programType === "pace"
                    ? "Your monthly payment is fixed for the financed term."
                    : programType === "cash"
                    ? "Cash purchase — no monthly financing payment."
                    : `Your ${PROGRAM_LABEL[programType]} may include an annual escalator (currently ${((activeScenario?.escalator ?? 0) * 100).toFixed(1)}%).`}
                </div>
              </div>

              {/* 25-year comparison */}
              <div className="grid grid-cols-2 gap-3">
                <Big label={`Projected 25-yr ${utility}`} val={fmtCurrency(utility25Total)} icon={Zap} />
                <Big label={`25-yr MDB ${plan.label}`} val={fmtCurrency(mdb25)} icon={Sun} accent />
              </div>

              {/* Plan summary */}
              <div className="rounded-lg bg-secondary/40 border border-border p-4 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-primary">{plan.label} — at a glance</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <SummaryRow icon={BadgeDollarSign} label="Ownership" val={plan.ownership} />
                  <SummaryRow icon={ShieldCheck} label="Tax credit" val={plan.taxCredit} />
                  <SummaryRow icon={Wrench} label="Maintenance" val={plan.maintenance} />
                  <SummaryRow icon={Sparkles} label="Long-term value" val={plan.longTerm} />
                </div>
                <div className="text-[11px] text-muted-foreground pt-1">
                  <span className="font-semibold text-foreground">Transferability:</span> {plan.transfer}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 flex items-start gap-2 text-[11px] text-navy">
                <Info className="size-3.5 mt-0.5 shrink-0" />
                <span>{plan.disclaimer}</span>
              </div>

              <div className="rounded-lg bg-secondary/60 border border-border p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Bundle summary · {plan.label}</div>
                <div className="space-y-1.5 text-sm">
                  <Line label={`Solar — ${systemKw} kW (${panels} panels) · ${plan.paymentLabel}`} val={fmtCurrency(activePay)} />
                  {water && <Line label="Water treatment" val={fmtCurrency(waterAdd)} />}
                  {roof && <Line label="Roof / HVAC" val={fmtCurrency(roofAdd)} />}
                  {battery && <Line label="Battery (Powerwall 3)" val={fmtCurrency(batteryAdd)} />}
                  {ev && <Line label="EV charger" val={fmtCurrency(evAdd)} />}
                  <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold text-foreground">
                    <span>Total monthly</span><span>{fmtCurrency(total)}/mo</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4 text-primary-foreground" style={{ background: "var(--gradient-gold)" }}>
                <div className="text-xs uppercase tracking-widest font-bold opacity-80">25-year projection</div>
                <div className="text-3xl font-bold mt-1">{fmtCurrency(savings25)} saved</div>
                <div className="text-xs opacity-80 mt-1">vs continuing with {utility} at projected rate increases (estimate, not guarantee).</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SolarDesignerDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        leadId={leadId}
        defaults={{ customer_name: name, address, utility_company: utility, monthly_bill: bill }}
      />
      <VisualSolarPreviewDialog
        open={visualOpen}
        onOpenChange={setVisualOpen}
        leadId={leadId}
        defaults={{ address, customer_name: name }}
      />
    </div>
  );
}

function AddOn({ checked, onChange, icon: Icon, title, sub }: { checked: boolean; onChange: (v: boolean) => void; icon: any; title: string; sub: string }) {
  return (
    <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:border-primary/40">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-primary" />
      <Icon className="size-4 text-primary" />
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </div>
    </label>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-card space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-primary">{title}</div>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
function Stat({ label, val }: { label: string; val: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 border border-border p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-base font-bold text-foreground">{val}</div>
    </div>
  );
}
function Big({ label, val, icon: Icon, accent }: { label: string; val: string; icon: any; accent?: boolean }) {
  return (
    <div className={`rounded-lg p-3 border ${accent ? "border-gold/40 bg-gold/10" : "border-border bg-secondary/40"}`}>
      <Icon className={`size-4 mb-1 ${accent ? "text-navy" : "text-primary"}`} />
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-bold text-foreground">{val}</div>
    </div>
  );
}
function BarRow({ label, amount, max, color }: { label: string; amount: number; max: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{label}</span><span className="font-semibold text-foreground">{fmtCurrency(amount)}/mo</span></div>
      <div className="h-3 bg-secondary rounded-full overflow-hidden"><div className={`h-full ${color}`} style={{ width: `${(amount / max) * 100}%` }} /></div>
    </div>
  );
}
function Line({ label, val }: { label: string; val: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="text-foreground font-medium">{val}</span></div>;
}
function SummaryRow({ icon: Icon, label, val }: { icon: any; label: string; val: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="size-3.5 mt-0.5 text-primary shrink-0" />
      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-xs text-foreground">{val}</div>
      </div>
    </div>
  );
}
function CompareRow({ label, loan, lease, active }: { label: string; loan: string; lease: string; active: "loan" | "lease_ppa" }) {
  return (
    <>
      <div className="p-2 border-t border-border text-[11px] text-muted-foreground">{label}</div>
      <div className={`p-2 border-t border-border text-[11px] text-center ${active === "loan" ? "bg-primary/5 font-semibold text-foreground" : "text-muted-foreground"}`}>{loan}</div>
      <div className={`p-2 border-t border-border text-[11px] text-center ${active === "lease_ppa" ? "bg-primary/5 font-semibold text-foreground" : "text-muted-foreground"}`}>{lease}</div>
    </>
  );
}

// Inline styles for inputs
const _styleTag = `
.ipt { width: 100%; padding: 0.5rem 0.75rem; border-radius: 0.375rem; border: 1px solid var(--input); background: var(--background); font-size: 0.875rem; outline: none; }
.ipt:focus { box-shadow: 0 0 0 2px var(--ring); }
`;
if (typeof document !== "undefined" && !document.getElementById("__mdb_ipt")) {
  const s = document.createElement("style");
  s.id = "__mdb_ipt"; s.innerHTML = _styleTag;
  document.head.appendChild(s);
}