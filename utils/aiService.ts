import axios from 'axios';

const AI_BACKEND_URL = process.env.NEXT_PUBLIC_MDB_AI_BACKEND_URL || '';

export async function aiRequest(endpoint: string, payload: any) {
  try {
    const { data } = await axios.post(`${AI_BACKEND_URL}/api/ai/${endpoint}`, payload);
    return data;
  } catch (e: any) {
    return { error: e?.response?.data?.error || 'AI service unavailable.' };
  }
}

export async function openAIRequest(endpoint: string, payload: any, apiKey?: string) {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `https://api.openai.com/v1/${endpoint}`;
    const { data } = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${apiKey || process.env.OPENAI_API_KEY}` }
    });
    return data;
  } catch (e: any) {
    return { error: e?.response?.data?.error || 'OpenAI service unavailable.' };
  }
}
