import { supabase } from "@/integrations/supabase/client";
import { toDbUuid } from "@/lib/leads-api";

export type ProgramType = "loan" | "lease_ppa" | "cash" | "pace";

export const PROGRAM_LABEL: Record<ProgramType, string> = {
  loan: "Loan",
  lease_ppa: "Lease / PPA",
  cash: "Cash",
  pace: "PACE",
};

export const PROVIDERS = [
  "GoodLeap",
  "EnFin",
  "Dividend",
  "Concert",
  "LightReach",
  "Sunrun",
  "Skylight",
  "Climate First Bank",
  "Home Run Financing",
  "Renew Financial",
  "Other",
] as const;
export type Provider = (typeof PROVIDERS)[number];

export const PROVIDER_PROGRAMS: Record<Provider, ProgramType[]> = {
  GoodLeap: ["loan", "lease_ppa"],
  EnFin: ["loan", "lease_ppa"],
  Dividend: ["loan"],
  Concert: ["loan"],
  LightReach: ["lease_ppa"],
  Sunrun: ["lease_ppa"],
  Skylight: ["loan", "lease_ppa"],
  "Climate First Bank": ["loan"],
  "Home Run Financing": ["pace"],
  "Renew Financial": ["pace"],
  Other: ["loan", "lease_ppa", "cash", "pace"],
};

export function providersForProgram(program: ProgramType): Provider[] {
  return PROVIDERS.filter((p) => PROVIDER_PROGRAMS[p].includes(program));
}

export type OwnershipType =
  | "Customer Owned"
  | "Third-Party Owned"
  | "PACE Assessment"
  | "Cash Purchase";

export const DEFAULT_OWNERSHIP: Record<ProgramType, OwnershipType> = {
  loan: "Customer Owned",
  lease_ppa: "Third-Party Owned",
  cash: "Cash Purchase",
  pace: "PACE Assessment",
};

export const PROGRAM_DISCLAIMER: Record<ProgramType, string> = {
  loan:
    "Loan estimates are preliminary and subject to lender approval, APR, dealer fees, credit profile, utility territory, and final system design.",
  lease_ppa:
    "Lease/PPA estimates are preliminary and subject to provider approval, escalator, utility territory, roof condition, and final system design.",
  pace:
    "PACE financing terms and qualification depend on property eligibility, jurisdiction, tax assessment rules, and provider approval.",
  cash:
    "Cash purchase estimates are preliminary and subject to final system sizing and installation costs.",
};

export const PROGRAM_BEST_USE: Record<ProgramType, string> = {
  loan: "Homeowners who want ownership and tax credit eligibility",
  lease_ppa: "Homeowners who want low upfront cost and included maintenance, or to pay only for solar production",
  cash: "Homeowners who want maximum long-term ROI and immediate ownership",
  pace: "Homeowners using property tax assessment financing where eligible",
};

export type FinancingScenario = {
  id?: string;
  lead_id?: string | null;
  proposal_id?: string | null;
  program_type: ProgramType;
  provider: Provider;
  scenario_name: string;
  monthly_payment: number;
  down_payment: number;
  term_years: number;
  apr: number;
  dealer_fee: number;
  escalator: number;
  estimated_remaining_utility_bill: number;
  estimated_monthly_savings: number;
  estimated_25_year_cost: number;
  estimated_25_year_savings: number;
  ownership_type: OwnershipType;
  maintenance_included: boolean;
  tax_credit_eligible: boolean;
  transferability_notes: string;
  qualification_notes: string;
  internal_notes: string;
  is_recommended: boolean;
};

export type ScenarioInputs = {
  bill: number; // current monthly utility bill
  utilityEscalation?: number; // annual utility inflation
};

/** Compute 25-year totals + savings using current bill, escalator, scenario term. */
export function compute25Year(
  s: Pick<FinancingScenario, "program_type" | "monthly_payment" | "escalator" | "term_years" | "down_payment">,
  inputs: ScenarioInputs,
) {
  const years = 25;
  const utilEsc = inputs.utilityEscalation ?? 0.06;
  const utility25 = Array.from({ length: years }, (_, i) => inputs.bill * 12 * Math.pow(1 + utilEsc, i)).reduce((a, b) => a + b, 0);

  let program25 = 0;
  if (s.program_type === "cash") {
    program25 = s.down_payment || 0;
  } else if (s.program_type === "loan" || s.program_type === "pace") {
    const months = Math.min(years, s.term_years || years) * 12;
    program25 = s.monthly_payment * months + (s.down_payment || 0);
  } else {
    // lease / ppa with escalator
    const esc = s.escalator || 0;
    program25 = Array.from({ length: years }, (_, i) => s.monthly_payment * 12 * Math.pow(1 + esc, i)).reduce((a, b) => a + b, 0) + (s.down_payment || 0);
  }
  return {
    utility25: Math.round(utility25),
    program25: Math.round(program25),
    savings25: Math.round(utility25 - program25),
  };
}

/** Build a sensible starting scenario for a program + provider. Values stay editable. */
export function makeDefaultScenario(
  program: ProgramType,
  provider: Provider,
  inputs: ScenarioInputs,
  systemKw: number,
): FinancingScenario {
  const bill = inputs.bill;
  let monthly = 0;
  let term = 25;
  let apr = 0;
  let escalator = 0;
  let dealerFee = 0;
  let down = 0;
  let maintenance = false;
  let taxCredit = false;

  switch (program) {
    case "loan":
      monthly = Math.round(bill * 0.62);
      term = 25;
      apr = 0.0699;
      dealerFee = 0.22;
      taxCredit = true;
      break;
    case "lease_ppa":
      monthly = Math.round(bill * 0.7);
      term = 25;
      escalator = 0.029;
      maintenance = true;
      break;
    case "cash":
      monthly = 0;
      term = 0;
      down = Math.round(systemKw * 2700); // editable estimate $/W
      taxCredit = true;
      break;
    case "pace":
      monthly = Math.round(bill * 0.78);
      term = 20;
      apr = 0.0899;
      taxCredit = true;
      break;
  }

  const draft: FinancingScenario = {
    program_type: program,
    provider,
    scenario_name: `${provider} · ${PROGRAM_LABEL[program]}`,
    monthly_payment: monthly,
    down_payment: down,
    term_years: term,
    apr,
    dealer_fee: dealerFee,
    escalator,
    estimated_remaining_utility_bill: 0,
    estimated_monthly_savings: Math.max(0, bill - monthly),
    estimated_25_year_cost: 0,
    estimated_25_year_savings: 0,
    ownership_type: DEFAULT_OWNERSHIP[program],
    maintenance_included: maintenance,
    tax_credit_eligible: taxCredit,
    transferability_notes:
      program === "loan"
        ? "Transferable with home sale via payoff or assumption."
        : program === "pace"
        ? "Assessment stays with property; may transfer with home sale subject to lender rules."
        : program === "cash"
        ? "Owned outright; transfers with property."
        : "Transferable to qualified buyer at home sale.",
    qualification_notes:
      program === "loan" || program === "pace"
        ? "Credit, income, and property eligibility required."
        : program === "cash"
        ? "No credit qualification required."
        : "Provider underwriting and utility territory eligibility required.",
    internal_notes: "",
    is_recommended: false,
  };
  const calc = compute25Year(draft, inputs);
  draft.estimated_25_year_cost = calc.program25;
  draft.estimated_25_year_savings = calc.savings25;
  return draft;
}

export type RecommendationInput = {
  bill: number;
  creditRange: string | null;
  ownershipPreference?: "own" | "service" | null;
  maintenancePreference?: "included" | "self" | null;
};

export function recommendProgram(input: RecommendationInput): { program: ProgramType; reason: string } {
  const credit = input.creditRange ?? "";
  const highCredit = /7\d\d|8\d\d|Excellent|Good/i.test(credit);
  if (input.ownershipPreference === "service" || input.maintenancePreference === "included") {
    return {
      program: "lease_ppa",
      reason: "customer prefers low upfront cost and provider-included maintenance.",
    };
  }
  if (input.ownershipPreference === "own" && input.bill > 0 && highCredit) {
    return {
      program: "loan",
      reason: `credit profile${credit ? ` (${credit})` : ""} supports ownership and the federal tax credit.`,
    };
  }
  if (input.bill >= 220 && highCredit) {
    return {
      program: "loan",
      reason: `monthly bill and credit profile${credit ? ` (${credit})` : ""} make ownership the higher long-term value.`,
    };
  }
  if (input.bill < 180) {
    return {
      program: "lease_ppa",
      reason: "lower bill profile makes a pay-as-you-produce PPA the simplest fit.",
    };
  }
  return {
    program: "lease_ppa",
    reason: `credit profile${credit ? ` (${credit})` : ""} and preference for no upfront cost favor a lease/PPA.`,
  };
}

// ----- Persistence --------------------------------------------------------

export async function fetchScenarios(opts: { lead_id?: string | null; proposal_id?: string | null }): Promise<FinancingScenario[]> {
  let q = supabase.from("financing_scenarios").select("*").order("created_at", { ascending: true });
  if (opts.proposal_id) q = q.eq("proposal_id", opts.proposal_id);
  else if (opts.lead_id) q = q.eq("lead_id", opts.lead_id);
  else return [];
  const { data, error } = await q;
  if (error) {
    console.warn("[financing] fetch failed:", error.message);
    return [];
  }
  return (data ?? []).map(rowToScenario);
}

export async function upsertScenarios(
  scenarios: FinancingScenario[],
  ctx: { lead_id?: string | null; proposal_id?: string | null },
): Promise<{ error: string | null }> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;
  const rows = scenarios.map((s) => ({
    ...(s.id ? { id: s.id } : {}),
    lead_id: toDbUuid(ctx.lead_id ?? s.lead_id ?? null),
    proposal_id: toDbUuid(ctx.proposal_id ?? s.proposal_id ?? null),
    program_type: s.program_type,
    provider: s.provider,
    scenario_name: s.scenario_name,
    monthly_payment: s.monthly_payment,
    down_payment: s.down_payment,
    term_years: s.term_years,
    apr: s.apr,
    dealer_fee: s.dealer_fee,
    escalator: s.escalator,
    estimated_remaining_utility_bill: s.estimated_remaining_utility_bill,
    estimated_monthly_savings: s.estimated_monthly_savings,
    estimated_25_year_cost: s.estimated_25_year_cost,
    estimated_25_year_savings: s.estimated_25_year_savings,
    ownership_type: s.ownership_type,
    maintenance_included: s.maintenance_included,
    tax_credit_eligible: s.tax_credit_eligible,
    transferability_notes: s.transferability_notes,
    qualification_notes: s.qualification_notes,
    internal_notes: s.internal_notes,
    is_recommended: s.is_recommended,
    created_by: userId,
  }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("financing_scenarios").upsert(rows);
  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteScenario(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("financing_scenarios").delete().eq("id", id);
  return { error: error?.message ?? null };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToScenario(r: any): FinancingScenario {
  return {
    id: r.id,
    lead_id: r.lead_id,
    proposal_id: r.proposal_id,
    program_type: r.program_type,
    provider: r.provider,
    scenario_name: r.scenario_name,
    monthly_payment: Number(r.monthly_payment ?? 0),
    down_payment: Number(r.down_payment ?? 0),
    term_years: Number(r.term_years ?? 0),
    apr: Number(r.apr ?? 0),
    dealer_fee: Number(r.dealer_fee ?? 0),
    escalator: Number(r.escalator ?? 0),
    estimated_remaining_utility_bill: Number(r.estimated_remaining_utility_bill ?? 0),
    estimated_monthly_savings: Number(r.estimated_monthly_savings ?? 0),
    estimated_25_year_cost: Number(r.estimated_25_year_cost ?? 0),
    estimated_25_year_savings: Number(r.estimated_25_year_savings ?? 0),
    ownership_type: r.ownership_type ?? "Customer Owned",
    maintenance_included: !!r.maintenance_included,
    tax_credit_eligible: !!r.tax_credit_eligible,
    transferability_notes: r.transferability_notes ?? "",
    qualification_notes: r.qualification_notes ?? "",
    internal_notes: r.internal_notes ?? "",
    is_recommended: !!r.is_recommended,
  };
}