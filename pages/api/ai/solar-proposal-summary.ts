import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { generateSolarProposalSummary } from '../../../utils/generateSolarProposalSummary';

type SolarProposalSummaryPayload = {
  lead_id?: string | null;
  proposal_id?: string | null;
  customer_name?: string;
  service_address?: string;
  utility_company?: string;
  system_size_kw?: number | string;
  panel_count?: number | string;
  estimated_production?: string;
  estimated_offset?: string;
  panel_model?: string;
  inverter_model?: string;
  battery_model?: string;
  financing_type?: string;
  monthly_payment?: number | string;
  proposal_value?: number | string;
  notes?: string;
};

type SolarProposalSummaryResponse = {
  executive_summary: string;
  homeowner_benefit: string;
  financing_summary: string;
  ai_sales_talking_points: string[];
  objection_handling: string[];
  next_step: string;
  whatsapp_message: string;
  email_followup: string;
};

const MODEL = 'gpt-4o-mini';

function toText(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  return String(value).trim() || fallback;
}

function toNumberText(value: unknown, fallback = 'N/A'): string {
  if (value === null || value === undefined || value === '') return fallback;
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return String(num);
}

function localFallback(input: SolarProposalSummaryPayload): SolarProposalSummaryResponse {
  const mock = generateSolarProposalSummary({
    panel_count: Number(input.panel_count) || 0,
    system_size_kw: Number(input.system_size_kw) || 0,
    estimated_production: toText(input.estimated_production, 'Not provided'),
    estimated_offset: toText(input.estimated_offset, 'Not provided'),
    panel_model: toText(input.panel_model, 'Not specified'),
    inverter_model: toText(input.inverter_model, 'Not specified'),
    battery_model: toText(input.battery_model, 'None'),
  });

  const customerName = toText(input.customer_name, 'there');
  const financingType = toText(input.financing_type, 'solar financing');

  return {
    executive_summary: mock.executive_summary,
    homeowner_benefit: mock.homeowner_benefit,
    financing_summary: `${mock.financing_summary} Recommended option: ${financingType}.`,
    ai_sales_talking_points: mock.ai_sales_talking_points,
    objection_handling: mock.objection_handling,
    next_step: mock.next_step,
    whatsapp_message: `Hi ${customerName}, I prepared your MDB Solar proposal. It is designed to reduce your utility bill with a custom system fit for your home. Would you like to review details together today?`,
    email_followup: `Hello ${customerName},\n\nThank you for the opportunity to prepare your MDB Solar proposal. I would be happy to walk you through expected production, savings assumptions, and financing options so you can make the best decision for your home.\n\nBest regards,\nMDB Solar`,
  };
}

function parseModelResponse(content: string, fallback: SolarProposalSummaryResponse): SolarProposalSummaryResponse {
  try {
    const parsed = JSON.parse(content || '{}');
    return {
      executive_summary: toText(parsed.executive_summary, fallback.executive_summary),
      homeowner_benefit: toText(parsed.homeowner_benefit, fallback.homeowner_benefit),
      financing_summary: toText(parsed.financing_summary, fallback.financing_summary),
      ai_sales_talking_points: Array.isArray(parsed.ai_sales_talking_points)
        ? parsed.ai_sales_talking_points.map((v: unknown) => toText(v)).filter(Boolean)
        : fallback.ai_sales_talking_points,
      objection_handling: Array.isArray(parsed.objection_handling)
        ? parsed.objection_handling.map((v: unknown) => toText(v)).filter(Boolean)
        : fallback.objection_handling,
      next_step: toText(parsed.next_step, fallback.next_step),
      whatsapp_message: toText(parsed.whatsapp_message, fallback.whatsapp_message),
      email_followup: toText(parsed.email_followup, fallback.email_followup),
    };
  } catch {
    return fallback;
  }
}

async function logAiCall(input: SolarProposalSummaryPayload, output: unknown) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return;

  try {
    const supabase = createClient(url, anonKey);
    await supabase.from('ai_logs').insert([
      {
        action: 'openai_solar_proposal_summary',
        input_json: input,
        output_json: output,
        proposal_id: input.proposal_id || null,
        lead_id: input.lead_id || null,
      },
    ]);
  } catch {
    // Logging should not fail the request path.
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const input: SolarProposalSummaryPayload = req.body || {};
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const response = { error: 'OPENAI_API_KEY is not configured.' };
    await logAiCall(input, response);
    return res.status(503).json(response);
  }

  const fallback = localFallback(input);

  const systemPrompt = [
    'You are an MDB Solar proposal assistant for Florida homeowners.',
    'Write with a professional, clear, bilingual-friendly sales tone (easy to translate English, no slang).',
    'Focus on utility bill reduction, practical solar savings framing, and homeowner value.',
    'Address Florida-specific context at a high level (sun exposure, rising utility costs, storm resilience when applicable).',
    'When discussing financing, include lease, loan, PACE, and cash context if relevant to the payload.',
    'Use honest and compliant language: do not promise guaranteed savings unless explicitly supported by provided data.',
    'If data is missing, state assumptions briefly and conservatively.',
    'Return only valid JSON with exactly these keys: executive_summary, homeowner_benefit, financing_summary, ai_sales_talking_points, objection_handling, next_step, whatsapp_message, email_followup.',
    'ai_sales_talking_points and objection_handling must be arrays of short bullet strings.',
  ].join(' ');

  const userPrompt = [
    'Generate a solar proposal summary for this payload:',
    JSON.stringify({
      customer_name: toText(input.customer_name, 'Not provided'),
      service_address: toText(input.service_address, 'Not provided'),
      utility_company: toText(input.utility_company, 'Not provided'),
      system_size_kw: toNumberText(input.system_size_kw),
      panel_count: toNumberText(input.panel_count),
      estimated_production: toText(input.estimated_production, 'Not provided'),
      estimated_offset: toText(input.estimated_offset, 'Not provided'),
      panel_model: toText(input.panel_model, 'Not provided'),
      inverter_model: toText(input.inverter_model, 'Not provided'),
      battery_model: toText(input.battery_model, 'Not provided'),
      financing_type: toText(input.financing_type, 'Not provided'),
      monthly_payment: toNumberText(input.monthly_payment),
      proposal_value: toNumberText(input.proposal_value),
      notes: toText(input.notes, 'None'),
    }),
  ].join('\n');

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: MODEL,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data?.choices?.[0]?.message?.content || '';
    const output = parseModelResponse(content, fallback);
    await logAiCall(input, output);
    return res.status(200).json(output);
  } catch (error: any) {
    const output = {
      error: error?.response?.data?.error?.message || error?.message || 'OpenAI request failed.',
    };
    await logAiCall(input, output);
    return res.status(500).json(output);
  }
}
