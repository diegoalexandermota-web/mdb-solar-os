// utils/generateSolarProposalSummary.ts
// Local mock AI summary generator for MDB Solar OS

export interface SolarProposalSummaryInput {
  panel_count: number;
  system_size_kw: number;
  estimated_production: string;
  estimated_offset: string;
  panel_model: string;
  inverter_model: string;
  battery_model: string;
}

export interface SolarProposalSummaryOutput {
  executive_summary: string;
  homeowner_benefit: string;
  financing_summary: string;
  ai_sales_talking_points: string[];
  objection_handling: string[];
  next_step: string;
}

export function generateSolarProposalSummary(input: SolarProposalSummaryInput): SolarProposalSummaryOutput {
  return {
    executive_summary: `This proposal features a ${input.system_size_kw} kW solar system with ${input.panel_count} ${input.panel_model} panels, ${input.inverter_model} inverter, and ${input.battery_model !== 'None' ? input.battery_model : 'no battery storage'}.`,
    homeowner_benefit: `Estimated annual production is ${input.estimated_production}, offsetting approximately ${input.estimated_offset} of your energy usage. This means lower bills and greater energy independence.`,
    financing_summary: `Flexible financing options are available to maximize your savings and fit your budget.`,
    ai_sales_talking_points: [
      `Premium ${input.panel_model} panels for maximum efficiency.`,
      `System sized at ${input.system_size_kw} kW for optimal savings.`,
      `${input.inverter_model} inverter ensures reliable performance.`,
      input.battery_model !== 'None' ? `Includes ${input.battery_model} for backup power.` : `No battery selected, but can be added for backup.`,
      `Offset up to ${input.estimated_offset} of your annual usage.`
    ],
    objection_handling: [
      `Worried about upfront cost? Financing options require little or no money down.`,
      `Concerned about reliability? All equipment is backed by industry-leading warranties.`,
      `Not sure about roof suitability? Our design is tailored for your home.`
    ],
    next_step: `Contact your MDB Solar advisor to review your proposal and finalize your solar journey.`
  };
}
