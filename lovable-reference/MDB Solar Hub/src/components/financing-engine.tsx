import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Sparkles, Star, Loader2, Info, Check, BadgeDollarSign } from "lucide-react";
import { toast } from "sonner";
import { fmtCurrency } from "@/lib/mdb-data";
import {
  PROGRAM_LABEL,
  PROGRAM_DISCLAIMER,
  PROGRAM_BEST_USE,
  PROVIDERS,
  PROVIDER_PROGRAMS,
  providersForProgram,
  DEFAULT_OWNERSHIP,
  compute25Year,
  makeDefaultScenario,
  fetchScenarios,
  upsertScenarios,
  deleteScenario,
  recommendProgram,
  type FinancingScenario,
  type ProgramType,
  type Provider,
  type OwnershipType,
} from "@/lib/financing";

type Props = {
  leadId: string | null;
  bill: number;
  systemKw: number;
  creditRange: string | null;
  utility: string;
  onActiveChange?: (s: FinancingScenario | null) => void;
};

const PROGRAMS: ProgramType[] = ["loan", "lease_ppa", "cash", "pace"];
const OWNERSHIP_OPTIONS: OwnershipType[] = ["Customer Owned", "Third-Party Owned", "PACE Assessment", "Cash Purchase"];

export function FinancingEngine({ leadId, bill, systemKw, creditRange, utility, onActiveChange }: Props) {
  const [scenarios, setScenarios] = useState<FinancingScenario[]>([]);
  const [activeId, setActiveId] = useState<string>("s-0");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const rec = useMemo(
    () => recommendProgram({ bill, creditRange }),
    [bill, creditRange],
  );

  // Initialize with a default loan scenario; load existing from DB if leadId.
  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (leadId) {
        setLoading(true);
        const existing = await fetchScenarios({ lead_id: leadId });
        if (cancelled) return;
        setLoading(false);
        if (existing.length > 0) {
          setScenarios(existing.map(withLocalId));
          setActiveId(existing[0].id ?? "s-0");
          return;
        }
      }
      const seed = makeDefaultScenario("loan", "GoodLeap", { bill }, systemKw);
      const seeded = [withLocalId(seed)];
      setScenarios(seeded);
      setActiveId(seeded[0].id!);
    }
    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  // Recalculate projections when bill changes.
  useEffect(() => {
    setScenarios((prev) =>
      prev.map((s) => {
        const calc = compute25Year(s, { bill });
        return {
          ...s,
          estimated_monthly_savings: Math.max(0, bill - s.monthly_payment),
          estimated_25_year_cost: calc.program25,
          estimated_25_year_savings: calc.savings25,
        };
      }),
    );
  }, [bill]);

  const active = scenarios.find((s) => s.id === activeId) ?? scenarios[0];
  useEffect(() => { onActiveChange?.(active ?? null); }, [active, onActiveChange]);

  function patchActive(patch: Partial<FinancingScenario>) {
    setScenarios((prev) =>
      prev.map((s) => {
        if (s.id !== activeId) return s;
        const next = { ...s, ...patch };
        const calc = compute25Year(next, { bill });
        next.estimated_monthly_savings = Math.max(0, bill - next.monthly_payment);
        next.estimated_25_year_cost = calc.program25;
        next.estimated_25_year_savings = calc.savings25;
        return next;
      }),
    );
  }

  function addScenario(program: ProgramType = "loan") {
    const providers = providersForProgram(program);
    const provider = providers[0] ?? "Other";
    const draft = withLocalId(makeDefaultScenario(program, provider, { bill }, systemKw));
    setScenarios((prev) => [...prev, draft]);
    setActiveId(draft.id!);
  }

  async function removeScenario(id: string) {
    const s = scenarios.find((x) => x.id === id);
    if (s && !s.id?.startsWith("s-") && s.id) {
      const { error } = await deleteScenario(s.id);
      if (error) { toast.error("Could not delete scenario", { description: error }); return; }
    }
    setScenarios((prev) => {
      const next = prev.filter((x) => x.id !== id);
      if (id === activeId && next[0]) setActiveId(next[0].id!);
      return next;
    });
  }

  function setRecommended(id: string) {
    setScenarios((prev) => prev.map((s) => ({ ...s, is_recommended: s.id === id })));
  }

  function changeProgram(program: ProgramType) {
    if (!active) return;
    const providers = providersForProgram(program);
    const provider = providers.includes(active.provider) ? active.provider : providers[0] ?? "Other";
    const fresh = makeDefaultScenario(program, provider, { bill }, systemKw);
    patchActive({
      ...fresh,
      id: active.id,
      scenario_name: active.scenario_name.includes("·") ? `${provider} · ${PROGRAM_LABEL[program]}` : active.scenario_name,
      internal_notes: active.internal_notes,
    });
  }

  function changeProvider(provider: Provider) {
    if (!active) return;
    const allowed = PROVIDER_PROGRAMS[provider];
    const program = allowed.includes(active.program_type) ? active.program_type : allowed[0];
    patchActive({
      provider,
      program_type: program,
      scenario_name: `${provider} · ${PROGRAM_LABEL[program]}`,
      ownership_type: DEFAULT_OWNERSHIP[program],
    });
  }

  async function saveAll() {
    setSaving(true);
    const { error } = await upsertScenarios(scenarios.map(stripLocalId), { lead_id: leadId });
    setSaving(false);
    if (error) { toast.error("Could not save scenarios", { description: error }); return; }
    toast.success(`${scenarios.length} financing scenario${scenarios.length === 1 ? "" : "s"} saved`);
    if (leadId) {
      const refreshed = await fetchScenarios({ lead_id: leadId });
      if (refreshed.length > 0) {
        setScenarios(refreshed.map(withLocalId));
        setActiveId(refreshed[0].id ?? activeId);
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Scenario tabs */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary">Financing scenarios</div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => addScenario("loan")} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border border-border hover:bg-secondary">
              <Plus className="size-3" /> Add scenario
            </button>
            <button onClick={saveAll} disabled={saving || scenarios.length === 0} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {saving ? <Loader2 className="size-3 animate-spin" /> : null} Save all
            </button>
          </div>
        </div>

        {loading && <div className="text-xs text-muted-foreground flex items-center gap-1.5"><Loader2 className="size-3 animate-spin" /> Loading scenarios…</div>}

        <div className="flex flex-wrap gap-1.5">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id!)}
              className={`group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border transition-colors ${
                s.id === activeId ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="font-mono uppercase text-[9px] bg-foreground/10 px-1 rounded">{PROGRAM_LABEL[s.program_type]}</span>
              <span className="font-medium">{s.scenario_name}</span>
              {s.is_recommended && <Star className="size-3 fill-gold text-gold" />}
              {scenarios.length > 1 && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); removeScenario(s.id!); }}
                  className="opacity-50 hover:opacity-100"
                  title="Remove scenario"
                >
                  <Trash2 className="size-3" />
                </span>
              )}
            </button>
          ))}
        </div>

        {/* AI recommendation */}
        <div className="rounded-md border border-gold/40 bg-gold/10 p-2.5 flex items-start gap-2 text-[11px] text-navy">
          <Sparkles className="size-3.5 mt-0.5 shrink-0 text-gold-foreground" />
          <div>
            <span className="font-semibold">MDB AI recommends: {PROGRAM_LABEL[rec.program]}</span> — {rec.reason}{" "}
            <button
              onClick={() => {
                const providers = providersForProgram(rec.program);
                const draft = withLocalId(makeDefaultScenario(rec.program, providers[0] ?? "Other", { bill }, systemKw));
                draft.is_recommended = true;
                setScenarios((prev) => [...prev.map((s) => ({ ...s, is_recommended: false })), draft]);
                setActiveId(draft.id!);
              }}
              className="underline font-medium"
            >
              Add recommended scenario
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      {active && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-card space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Scenario name</div>
              <input
                value={active.scenario_name}
                onChange={(e) => patchActive({ scenario_name: e.target.value })}
                className="ipt"
              />
            </div>
            <button
              onClick={() => setRecommended(active.id!)}
              className={`mt-5 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border transition-colors ${
                active.is_recommended ? "border-gold bg-gold/15 text-navy" : "border-border hover:bg-secondary"
              }`}
            >
              <Star className={`size-3 ${active.is_recommended ? "fill-gold text-gold" : ""}`} />
              {active.is_recommended ? "Recommended" : "Mark recommended"}
            </button>
          </div>

          {/* Program type pills */}
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Program type</div>
            <div className="flex flex-wrap gap-1.5">
              {PROGRAMS.map((p) => (
                <button
                  key={p}
                  onClick={() => changeProgram(p)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                    active.program_type === p
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {active.program_type === p && <Check className="inline size-3 mr-0.5" strokeWidth={3} />}
                  {PROGRAM_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Provider */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Provider">
              <select className="ipt" value={active.provider} onChange={(e) => changeProvider(e.target.value as Provider)}>
                {PROVIDERS.map((p) => (
                  <option key={p} value={p} disabled={!PROVIDER_PROGRAMS[p].includes(active.program_type)}>
                    {p}
                    {!PROVIDER_PROGRAMS[p].includes(active.program_type) ? ` (no ${PROGRAM_LABEL[active.program_type]})` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ownership type">
              <select className="ipt" value={active.ownership_type} onChange={(e) => patchActive({ ownership_type: e.target.value as OwnershipType })}>
                {OWNERSHIP_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
          </div>

          {/* Numerics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Monthly payment (USD)">
              <input type="number" className="ipt" value={active.monthly_payment} onChange={(e) => patchActive({ monthly_payment: +e.target.value || 0 })} />
            </Field>
            <Field label="Down payment (USD)">
              <input type="number" className="ipt" value={active.down_payment} onChange={(e) => patchActive({ down_payment: +e.target.value || 0 })} />
            </Field>
            <Field label="Term (years)">
              <input type="number" className="ipt" value={active.term_years} onChange={(e) => patchActive({ term_years: +e.target.value || 0 })} />
            </Field>
            <Field label="APR (%)">
              <input type="number" step="0.01" className="ipt" value={+(active.apr * 100).toFixed(2)} onChange={(e) => patchActive({ apr: (+e.target.value || 0) / 100 })} />
            </Field>
            <Field label="Dealer fee (% of system)">
              <input type="number" step="0.01" className="ipt" value={+(active.dealer_fee * 100).toFixed(2)} onChange={(e) => patchActive({ dealer_fee: (+e.target.value || 0) / 100 })} />
            </Field>
            <Field label="Escalator (%/yr)">
              <input type="number" step="0.01" className="ipt" value={+(active.escalator * 100).toFixed(2)} onChange={(e) => patchActive({ escalator: (+e.target.value || 0) / 100 })} />
            </Field>
            <Field label="Est. remaining utility bill (USD)">
              <input type="number" className="ipt" value={active.estimated_remaining_utility_bill} onChange={(e) => patchActive({ estimated_remaining_utility_bill: +e.target.value || 0 })} />
            </Field>
            <Field label="Est. monthly savings (USD)">
              <input type="number" className="ipt" value={active.estimated_monthly_savings} onChange={(e) => patchActive({ estimated_monthly_savings: +e.target.value || 0 })} />
            </Field>
            <Field label="Est. 25-yr cost (USD)">
              <input type="number" className="ipt" value={active.estimated_25_year_cost} onChange={(e) => patchActive({ estimated_25_year_cost: +e.target.value || 0 })} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={active.maintenance_included} onChange={(e) => patchActive({ maintenance_included: e.target.checked })} className="size-4 accent-primary" />
              Maintenance included
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={active.tax_credit_eligible} onChange={(e) => patchActive({ tax_credit_eligible: e.target.checked })} className="size-4 accent-primary" />
              Tax credit eligible
            </label>
          </div>

          <Field label="Transferability notes">
            <textarea rows={2} className="ipt" value={active.transferability_notes} onChange={(e) => patchActive({ transferability_notes: e.target.value })} />
          </Field>
          <Field label="Qualification notes">
            <textarea rows={2} className="ipt" value={active.qualification_notes} onChange={(e) => patchActive({ qualification_notes: e.target.value })} />
          </Field>
          <Field label="Internal MDB notes (not on proposal)">
            <textarea rows={2} className="ipt" value={active.internal_notes} onChange={(e) => patchActive({ internal_notes: e.target.value })} />
          </Field>

          <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 flex items-start gap-2 text-[11px] text-navy">
            <Info className="size-3.5 mt-0.5 shrink-0" />
            <span>{PROGRAM_DISCLAIMER[active.program_type]}</span>
          </div>
        </div>
      )}

      {/* Comparison */}
      {scenarios.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-card space-y-3">
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="size-4 text-primary" />
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">Side-by-side comparison</div>
            <div className="ml-auto text-[10px] text-muted-foreground">vs {utility} @ ~6%/yr escalation</div>
          </div>
          <div className="overflow-x-auto">
            <div className="grid text-[11px] min-w-[640px]" style={{ gridTemplateColumns: `200px repeat(${scenarios.length}, minmax(140px, 1fr))` }}>
              <Cell head>Feature</Cell>
              {scenarios.map((s) => (
                <Cell key={s.id} head active={s.id === activeId} accent={s.is_recommended}>
                  <div className="flex items-center justify-center gap-1">
                    {s.is_recommended && <Star className="size-3 fill-gold text-gold" />}
                    {s.scenario_name}
                  </div>
                  <div className="text-[9px] font-normal opacity-70 normal-case tracking-normal">{PROGRAM_LABEL[s.program_type]} · {s.provider}</div>
                </Cell>
              ))}
              <CompareRow label="Monthly payment" items={scenarios.map((s) => `${fmtCurrency(s.monthly_payment)}/mo`)} activeId={activeId} ids={scenarios.map((s) => s.id!)} />
              <CompareRow label="Ownership" items={scenarios.map((s) => s.ownership_type)} activeId={activeId} ids={scenarios.map((s) => s.id!)} />
              <CompareRow label="Tax credit" items={scenarios.map((s) => s.tax_credit_eligible ? "Eligible (customer)" : "Not eligible (provider)")} activeId={activeId} ids={scenarios.map((s) => s.id!)} />
              <CompareRow label="Maintenance" items={scenarios.map((s) => s.maintenance_included ? "Included" : "Customer / warranty")} activeId={activeId} ids={scenarios.map((s) => s.id!)} />
              <CompareRow label="Transferability" items={scenarios.map((s) => s.transferability_notes || "—")} activeId={activeId} ids={scenarios.map((s) => s.id!)} />
              <CompareRow label="Est. 25-yr cost" items={scenarios.map((s) => fmtCurrency(s.estimated_25_year_cost))} activeId={activeId} ids={scenarios.map((s) => s.id!)} />
              <CompareRow label="Est. 25-yr savings" items={scenarios.map((s) => fmtCurrency(s.estimated_25_year_savings))} activeId={activeId} ids={scenarios.map((s) => s.id!)} />
              <CompareRow label="Best use case" items={scenarios.map((s) => PROGRAM_BEST_USE[s.program_type])} activeId={activeId} ids={scenarios.map((s) => s.id!)} />
            </div>
          </div>
        </div>
      )}
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

function Cell({ children, head, active, accent }: { children: React.ReactNode; head?: boolean; active?: boolean; accent?: boolean }) {
  return (
    <div
      className={`p-2 border-t border-border text-center ${
        head ? "font-semibold uppercase tracking-wide text-muted-foreground" : ""
      } ${active ? "bg-primary/10 text-foreground" : ""} ${accent ? "ring-1 ring-inset ring-gold/40" : ""}`}
    >
      {children}
    </div>
  );
}
function CompareRow({ label, items, activeId, ids }: { label: string; items: string[]; activeId: string; ids: string[] }) {
  return (
    <>
      <Cell>{<span className="text-muted-foreground">{label}</span>}</Cell>
      {items.map((v, i) => (
        <Cell key={ids[i]} active={ids[i] === activeId}>{v}</Cell>
      ))}
    </>
  );
}

let counter = 0;
function withLocalId(s: FinancingScenario): FinancingScenario {
  if (s.id) return s;
  counter += 1;
  return { ...s, id: `s-${Date.now()}-${counter}` };
}
function stripLocalId(s: FinancingScenario): FinancingScenario {
  if (s.id && s.id.startsWith("s-")) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = s;
    return rest as FinancingScenario;
  }
  return s;
}