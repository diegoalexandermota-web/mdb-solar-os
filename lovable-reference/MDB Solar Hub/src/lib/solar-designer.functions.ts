import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  customer_name: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  utility_company: z.string().optional().nullable(),
  monthly_bill: z.number().nonnegative().optional().nullable(),
  average_monthly_kwh: z.number().nonnegative().optional().nullable(),
  twelve_month_kwh: z.number().nonnegative().optional().nullable(),
  utility_rate_assumption: z.number().positive().optional().nullable(),
  roof_type: z.string().optional().nullable(),
  roof_condition: z.string().optional().nullable(),
  service_panel_size: z.string().optional().nullable(),
  desired_offset_percent: z.number().min(0).max(120).optional().nullable(),
  panel_wattage: z.number().int().positive().optional().nullable(),
  preferred_financing: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type SolarDesignerInput = z.infer<typeof InputSchema>;

// Tolerant schema — every field optional, coerce where possible.
const num = z.preprocess((v) => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = typeof v === "string" ? Number(v.replace(/[, $%]/g, "")) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
}, z.number().optional());

const str = z.preprocess(
  (v) => (v === null || v === undefined ? undefined : String(v)),
  z.string().optional(),
);

const TolerantOutputSchema = z.object({
  estimated_annual_usage_kwh: num,
  estimated_monthly_usage_kwh: num,
  recommended_offset_percent: num,
  estimated_system_size_kw: num,
  panel_wattage: num,
  estimated_panel_count: num,
  estimated_annual_production_kwh: num,
  estimated_monthly_production_kwh: num,
  recommended_financing: str,
  design_confidence: z.preprocess((v) => {
    if (typeof v !== "string") return undefined;
    const s = v.trim().toLowerCase();
    if (s.startsWith("h")) return "High";
    if (s.startsWith("m")) return "Medium";
    if (s.startsWith("l")) return "Low";
    return undefined;
  }, z.enum(["Low", "Medium", "High"]).optional()),
  roof_notes: str,
  proposal_notes: str,
  risk_flags: z.preprocess((v) => {
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === "string" && v.trim()) return [v];
    return [];
  }, z.array(z.string())),
});

export type SolarDesignerOutput = {
  estimated_annual_usage_kwh: number;
  estimated_monthly_usage_kwh: number;
  recommended_offset_percent: number;
  estimated_system_size_kw: number;
  panel_wattage: number;
  estimated_panel_count: number;
  estimated_annual_production_kwh: number;
  estimated_monthly_production_kwh: number;
  recommended_financing: string;
  design_confidence: "Low" | "Medium" | "High";
  roof_notes: string;
  proposal_notes: string;
  risk_flags: string[];
};

function extractJson(text: string): unknown {
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = cleaned.search(/[\{\[]/);
  if (start === -1) throw new Error("No JSON found in AI response");
  const openChar = cleaned[start];
  const closeChar = openChar === "[" ? "]" : "}";
  const end = cleaned.lastIndexOf(closeChar);
  cleaned = cleaned.substring(start, end === -1 ? cleaned.length : end + 1);
  try {
    return JSON.parse(cleaned);
  } catch {
    // repair: trim control chars and trailing commas, balance braces/brackets
    let repaired = cleaned
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1F\x7F]/g, " ");
    let openBraces = 0,
      openBrackets = 0;
    for (const c of repaired) {
      if (c === "{") openBraces++;
      else if (c === "}") openBraces--;
      else if (c === "[") openBrackets++;
      else if (c === "]") openBrackets--;
    }
    while (openBrackets-- > 0) repaired += "]";
    while (openBraces-- > 0) repaired += "}";
    try {
      return JSON.parse(repaired);
    } catch {
      return {};
    }
  }
}

function applyDefaults(
  partial: z.infer<typeof TolerantOutputSchema>,
  input: SolarDesignerInput,
): SolarDesignerOutput {
  const rate = input.utility_rate_assumption ?? 0.158;
  const annual =
    partial.estimated_annual_usage_kwh ??
    input.twelve_month_kwh ??
    (input.average_monthly_kwh ? input.average_monthly_kwh * 12 : undefined) ??
    (input.monthly_bill ? (input.monthly_bill / rate) * 12 : 12000);
  const monthly = partial.estimated_monthly_usage_kwh ?? annual / 12;
  const offset = Math.min(120, Math.max(50, partial.recommended_offset_percent ?? input.desired_offset_percent ?? 100));
  const productionPerKw = 1450;
  const systemSize =
    partial.estimated_system_size_kw ?? Math.max(1, (annual * (offset / 100)) / productionPerKw);
  const panelW = partial.panel_wattage ?? input.panel_wattage ?? 410;
  const panelCount = partial.estimated_panel_count ?? Math.ceil((systemSize * 1000) / panelW);
  const annualProd = partial.estimated_annual_production_kwh ?? systemSize * productionPerKw;
  const monthlyProd = partial.estimated_monthly_production_kwh ?? annualProd / 12;

  const completeness =
    (input.twelve_month_kwh || input.average_monthly_kwh ? 1 : 0) +
    (input.monthly_bill ? 1 : 0) +
    (input.roof_condition ? 1 : 0) +
    (input.service_panel_size ? 1 : 0);
  const fallbackConfidence: "Low" | "Medium" | "High" =
    completeness >= 3 ? "Medium" : "Low";

  return {
    estimated_annual_usage_kwh: Math.round(annual),
    estimated_monthly_usage_kwh: Math.round(monthly),
    recommended_offset_percent: Math.round(offset),
    estimated_system_size_kw: Math.round(systemSize * 10) / 10,
    panel_wattage: Math.round(panelW),
    estimated_panel_count: Math.ceil(panelCount),
    estimated_annual_production_kwh: Math.round(annualProd),
    estimated_monthly_production_kwh: Math.round(monthlyProd),
    recommended_financing: partial.recommended_financing ?? input.preferred_financing ?? "Loan",
    design_confidence: partial.design_confidence ?? fallbackConfidence,
    roof_notes:
      partial.roof_notes ??
      `${input.roof_type ?? "Roof"} in ${input.roof_condition ?? "unspecified"} condition. Verify on-site.`,
    proposal_notes:
      partial.proposal_notes ??
      "Preliminary AI estimate based on provided inputs. Final design pending site survey and engineered design.",
    risk_flags: partial.risk_flags ?? [],
  };
}

export const runSolarDesignerAnalysis = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<SolarDesignerOutput> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY is not configured");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const prompt = [
      "You are MDB AI Solar Designer, a preliminary residential solar sizing assistant.",
      "Return ONLY a single JSON object. No markdown fences. No commentary. No prose before or after.",
      "Schema (all fields required, numbers as numbers not strings):",
      JSON.stringify({
        estimated_annual_usage_kwh: "number",
        estimated_monthly_usage_kwh: "number",
        recommended_offset_percent: "number (50-120)",
        estimated_system_size_kw: "number",
        panel_wattage: "number (e.g. 410)",
        estimated_panel_count: "number (integer)",
        estimated_annual_production_kwh: "number",
        estimated_monthly_production_kwh: "number",
        recommended_financing: "Loan | Lease / PPA | PACE | Cash",
        design_confidence: "Low | Medium | High",
        roof_notes: "string",
        proposal_notes: "string (1-3 sentences for sales rep)",
        risk_flags: ["string"],
      }),
      "Rules: If 12-month usage missing, estimate annual = (monthly_bill / rate) * 12. Default rate 0.158 $/kWh. Assume ~1450 kWh/kW/year production. Default panel 410W. Round system size to 1 decimal; round panels up.",
      "Prefer customer's preferred_financing when provided. design_confidence reflects input completeness.",
      "Customer inputs:",
      JSON.stringify(data, null, 2),
    ].join("\n");

    let aiText = "";
    try {
      const result = await generateText({
        model,
        prompt,
      });
      aiText = result.text ?? "";
    } catch (err) {
      console.error("Solar designer AI call failed:", err);
    }

    let parsed: unknown = {};
    if (aiText) {
      try {
        parsed = extractJson(aiText);
      } catch (err) {
        console.error("Failed to extract JSON from AI response:", err, aiText.slice(0, 500));
        parsed = {};
      }
    }

    const tolerant = TolerantOutputSchema.safeParse(parsed);
    const partial = tolerant.success
      ? tolerant.data
      : TolerantOutputSchema.parse({ risk_flags: [] });
    return applyDefaults(partial, data);
  });