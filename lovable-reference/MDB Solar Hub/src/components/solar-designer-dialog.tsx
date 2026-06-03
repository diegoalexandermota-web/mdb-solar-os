import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, AlertTriangle, ShieldCheck, Sun, Save, ClipboardList, Layers, HardHat } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useServerFn } from "@tanstack/react-start";
import { runSolarDesignerAnalysis, type SolarDesignerOutput } from "@/lib/solar-designer.functions";
import { supabase } from "@/integrations/supabase/client";
import { toDbUuid, isDemoId } from "@/lib/leads-api";
import { VisualSolarPreviewDialog } from "@/components/visual-solar-preview-dialog";
import { SolarDesignStudioDialog } from "@/components/solar-design-studio-dialog";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId: string | null;
  proposalId?: string | null;
  defaults?: {
    customer_name?: string;
    address?: string;
    utility_company?: string;
    monthly_bill?: number;
  };
  onSaved?: (estimate: SolarDesignerOutput & { id?: string }) => void;
};

const ROOF_TYPES = ["Asphalt Shingle", "Metal", "Tile", "Flat / TPO", "Other"];
const ROOF_CONDITIONS = ["New (<5y)", "Good", "Fair", "Needs replacement"];
const PANEL_SIZES = ["Upgrade not needed", "100A", "150A", "200A", "400A"];
const FINANCING = ["Loan", "Lease / PPA", "PACE", "Cash"];

export function SolarDesignerDialog({ open, onOpenChange, leadId, proposalId, defaults, onSaved }: Props) {
  const run = useServerFn(runSolarDesignerAnalysis);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<SolarDesignerOutput | null>(null);
  const [visualOpen, setVisualOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);

  const [monthlyBill, setMonthlyBill] = useState<string>("");
  const [avgKwh, setAvgKwh] = useState<string>("");
  const [annualKwh, setAnnualKwh] = useState<string>("");
  const [rate, setRate] = useState<string>("0.158");
  const [utility, setUtility] = useState<string>("");
  const [roofType, setRoofType] = useState<string>("Asphalt Shingle");
  const [roofCondition, setRoofCondition] = useState<string>("Good");
  const [panelSize, setPanelSize] = useState<string>("200A");
  const [offset, setOffset] = useState<string>("100");
  const [panelWattage, setPanelWattage] = useState<string>("410");
  const [financing, setFinancing] = useState<string>("Loan");
  const [extraNotes, setExtraNotes] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setMonthlyBill(defaults?.monthly_bill != null ? String(defaults.monthly_bill) : "");
    setUtility(defaults?.utility_company ?? "");
    setResult(null);
  }, [open, defaults?.monthly_bill, defaults?.utility_company]);

  async function analyze() {
    setLoading(true);
    try {
      const out = await run({
        data: {
          customer_name: defaults?.customer_name ?? null,
          address: defaults?.address ?? null,
          utility_company: utility || null,
          monthly_bill: monthlyBill ? Number(monthlyBill) : null,
          average_monthly_kwh: avgKwh ? Number(avgKwh) : null,
          twelve_month_kwh: annualKwh ? Number(annualKwh) : null,
          utility_rate_assumption: rate ? Number(rate) : null,
          roof_type: roofType,
          roof_condition: roofCondition,
          service_panel_size: panelSize,
          desired_offset_percent: offset ? Number(offset) : null,
          panel_wattage: panelWattage ? Number(panelWattage) : null,
          preferred_financing: financing,
          notes: extraNotes || null,
        },
      });
      setResult(out);
      toast.success("AI consumption analysis complete.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Analysis failed.";
      toast.error("AI analysis failed", { description: msg });
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!result) return;
    if (isDemoId(leadId)) {
      toast.error("Demo lead — estimate not saved", {
        description: "Create a real lead in Supabase to save the AI design estimate.",
      });
      return;
    }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const payload = {
      lead_id: toDbUuid(leadId),
      proposal_id: toDbUuid(proposalId ?? null),
      annual_usage_kwh: result.estimated_annual_usage_kwh,
      monthly_usage_kwh: result.estimated_monthly_usage_kwh,
      utility_rate_assumption: rate ? Number(rate) : null,
      desired_offset_percent: result.recommended_offset_percent,
      system_size_kw: result.estimated_system_size_kw,
      panel_wattage: result.panel_wattage,
      panel_count: result.estimated_panel_count,
      estimated_annual_production_kwh: result.estimated_annual_production_kwh,
      estimated_monthly_production_kwh: result.estimated_monthly_production_kwh,
      recommended_financing: result.recommended_financing,
      design_confidence: result.design_confidence,
      roof_type: roofType,
      roof_condition: roofCondition,
      roof_notes: result.roof_notes,
      risk_flags: result.risk_flags,
      proposal_notes: result.proposal_notes,
      requires_final_design: true,
      created_by: userData.user?.id ?? null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from("solar_design_estimates").insert(payload).select().single();
    setSaving(false);
    if (error) {
      toast.error("Couldn't save estimate", { description: error.message });
      return;
    }
    toast.success("Preliminary design estimate saved.");
    onSaved?.({ ...result, id: data?.id });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> MDB AI Solar Designer
          </DialogTitle>
          <DialogDescription>
            Preliminary AI-powered consumption analysis and system sizing. Not a final engineered design.
          </DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Monthly electric bill ($)"><Input value={monthlyBill} onChange={(e) => setMonthlyBill(e.target.value)} placeholder="312" inputMode="decimal" /></Field>
          <Field label="Avg monthly usage (kWh)"><Input value={avgKwh} onChange={(e) => setAvgKwh(e.target.value)} placeholder="1850" inputMode="decimal" /></Field>
          <Field label="12-month total (kWh)"><Input value={annualKwh} onChange={(e) => setAnnualKwh(e.target.value)} placeholder="22000" inputMode="decimal" /></Field>
          <Field label="Utility rate assumption ($/kWh)"><Input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" /></Field>
          <Field label="Utility company"><Input value={utility} onChange={(e) => setUtility(e.target.value)} placeholder="Duke Energy" /></Field>
          <Field label="Service panel">
            <Select value={panelSize} onValueChange={setPanelSize}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PANEL_SIZES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Roof type">
            <Select value={roofType} onValueChange={setRoofType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ROOF_TYPES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Roof condition">
            <Select value={roofCondition} onValueChange={setRoofCondition}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ROOF_CONDITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Desired offset %"><Input value={offset} onChange={(e) => setOffset(e.target.value)} inputMode="decimal" /></Field>
          <Field label="Panel wattage (W)"><Input value={panelWattage} onChange={(e) => setPanelWattage(e.target.value)} inputMode="decimal" /></Field>
          <Field label="Preferred financing">
            <Select value={financing} onValueChange={setFinancing}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FINANCING.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Additional notes (optional)">
          <Textarea rows={2} value={extraNotes} onChange={(e) => setExtraNotes(e.target.value)} placeholder="Shade from oak tree on west side, HOA approval pending…" />
        </Field>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setVisualOpen(true)} className="gap-1">
            <Sparkles className="size-4 text-primary" /> Generate Visual Preview
          </Button>
          <Button variant="outline" onClick={() => setStudioOpen(true)} className="gap-1">
            <Layers className="size-4 text-primary" /> Open Design Studio
          </Button>
          <Button onClick={analyze} disabled={loading} className="gap-1">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Run AI consumption analysis
          </Button>
        </div>

        {result && (
          <div className="space-y-4 mt-2">
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Sun className="size-4 text-primary" /> Preliminary Solar Design Estimate
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${
                  result.design_confidence === "High" ? "bg-success/15 text-success"
                  : result.design_confidence === "Medium" ? "bg-primary/10 text-primary"
                  : "bg-warning/25 text-navy"
                }`}>{result.design_confidence} confidence</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="System size" val={`${result.estimated_system_size_kw.toFixed(2)} kW`} />
                <Stat label="Panels" val={`${result.estimated_panel_count} × ${result.panel_wattage}W`} />
                <Stat label="Offset" val={`${Math.round(result.recommended_offset_percent)}%`} />
                <Stat label="Annual production" val={`${Math.round(result.estimated_annual_production_kwh).toLocaleString()} kWh`} />
                <Stat label="Monthly production" val={`${Math.round(result.estimated_monthly_production_kwh).toLocaleString()} kWh`} />
                <Stat label="Annual usage" val={`${Math.round(result.estimated_annual_usage_kwh).toLocaleString()} kWh`} />
                <Stat label="Monthly usage" val={`${Math.round(result.estimated_monthly_usage_kwh).toLocaleString()} kWh`} />
                <Stat label="Financing" val={result.recommended_financing} />
              </div>
              <div className="mt-3 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Roof notes:</span> {result.roof_notes}</div>
              <div className="mt-1 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Proposal notes:</span> {result.proposal_notes}</div>
              {result.risk_flags.length > 0 && (
                <div className="mt-3 flex items-start gap-2 text-xs text-warning">
                  <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
                  <ul className="list-disc pl-4 space-y-0.5">
                    {result.risk_flags.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {/* MDB AI Internal Design Notes */}
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="size-4 text-primary" />
                <div className="text-xs font-semibold text-foreground">MDB AI Internal Design Notes</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <div><span className="font-medium text-foreground">Roof assumptions:</span> {roofType} — {roofCondition}. {result.roof_notes}</div>
                <div><span className="font-medium text-foreground">Panel layout:</span> {result.estimated_panel_count} panels (~{result.estimated_system_size_kw.toFixed(2)} kW) using {result.panel_wattage}W modules. South-facing assumed unless noted.</div>
                <div><span className="font-medium text-foreground">Equipment:</span> Standard string inverter or microinverter configuration assumed. Battery readiness depends on service panel size.</div>
                <div><span className="font-medium text-foreground">Electrical notes:</span> Service panel: {panelSize}. Verify backfeed and busbar limits with AHJ.</div>
                <div><span className="font-medium text-foreground">Permitting / AHJ caution:</span> Setbacks, fire codes, and HOA rules vary by municipality. Confirm before final layout.</div>
                <div><span className="font-medium text-foreground">Confidence:</span> {result.design_confidence} — {result.design_confidence === "High" ? "Inputs sufficient for preliminary sizing." : result.design_confidence === "Medium" ? "Some assumptions used; verify on-site." : "Significant assumptions; site survey strongly recommended."}</div>
              </div>
              <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">Must verify before install:</span> Roof structural integrity, actual shading, exact azimuth/tilt, electrical service capacity, AHJ setbacks, HOA restrictions, and utility interconnection rules.
              </div>
            </div>

            {/* Advanced AI Roof Layout — Coming Soon */}
            <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="size-4 text-primary" />
                <div className="text-xs font-semibold text-foreground">Advanced AI Roof Layout — Coming Soon</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                {[
                  "Roof plane detection",
                  "Panel placement suggestions",
                  "Obstruction detection",
                  "Azimuth/tilt assumptions",
                  "Setback notes",
                  "Hurricane/wind-zone considerations",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <HardHat className="size-3 text-muted-foreground" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-border p-3 text-[11px] text-muted-foreground flex items-start gap-2">
              <ShieldCheck className="size-3.5 mt-0.5 shrink-0 text-primary" />
              <span>
                MDB AI Solar Designer creates a preliminary internal design estimate. Final engineering, permitting, lender, installer, or AHJ requirements may require additional validation or third-party design tools.
              </span>
            </div>

            <div className="rounded-lg border border-border p-3">
              <div className="text-xs font-semibold text-foreground mb-1">Design validation options</div>
              <div className="text-[11px] text-muted-foreground mb-2">
                Use only when required by lender, installer, AHJ, or final engineering process.
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                {["Export to Aurora", "Export to OpenSolar", "Upload third-party final design", "Upload shade report", "Upload engineered layout"].map((l) => (
                  <span key={l} className="px-2 py-1 rounded bg-secondary/50 border border-border">{l}</span>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-[11px] text-navy flex items-start gap-2">
              <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
              <span>
                This is not a stamped engineering design. MDB AI Solar Designer supports preliminary sales design, proposal preparation, and internal project planning. Final install-ready drawings may require installer, engineer, utility, lender, or AHJ approval.
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={save} disabled={!result || saving || !leadId} className="gap-1">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save estimate
          </Button>
        </DialogFooter>
      </DialogContent>
      <VisualSolarPreviewDialog
        open={visualOpen}
        onOpenChange={setVisualOpen}
        leadId={leadId}
        proposalId={proposalId ?? null}
        defaults={{
          address: defaults?.address,
          customer_name: defaults?.customer_name,
          panelCount: result?.estimated_panel_count ?? null,
        }}
      />
      <SolarDesignStudioDialog
        open={studioOpen}
        onOpenChange={setStudioOpen}
        leadId={leadId}
        proposalId={proposalId ?? null}
        defaults={{ address: defaults?.address, customer_name: defaults?.customer_name }}
      />
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Stat({ label, val }: { label: string; val: string }) {
  return (
    <div className="bg-card border border-border rounded-md p-2">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-sm font-semibold text-foreground mt-0.5">{val}</div>
    </div>
  );
}