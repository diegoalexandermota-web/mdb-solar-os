import { useState } from 'react';
import { aiRequest } from './aiService';

export function useAI(endpoint: string) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string|null>(null);

  async function runAI(payload: any) {
    setLoading(true);
    setError(null);
    try {
      const res = await aiRequest(endpoint, payload);
      setResponse(res);
      setLoading(false);
      return res;
    } catch (e: any) {
      setError(e.message || 'AI error');
      setLoading(false);
      return null;
    }
  }

  return { loading, response, error, runAI };
}
