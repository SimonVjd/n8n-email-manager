const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';

export async function callWorkflow<T = unknown>(
  endpoint: string,
  data: Record<string, unknown>
): Promise<T> {
  const url = `${N8N_WEBHOOK_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`n8n workflow error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

const N8N_API_URL = process.env.N8N_API_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

export async function checkN8nHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${N8N_API_URL}/api/v1/workflows`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY },
    });
    return res.ok;
  } catch {
    return false;
  }
}
