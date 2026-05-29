import type { NextApiRequest, NextApiResponse } from 'next';
import { aiRequest } from '../../../utils/aiService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const result = await aiRequest('customer-support', req.body);
    res.status(200).json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'AI error' });
  }
}
