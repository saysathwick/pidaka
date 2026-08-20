const TOKEN_KEY = "pidaka_hearth";

export function getHearthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setHearthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearHearthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function hearthRequest(method: string, url: string, data?: unknown) {
  const token = getHearthToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (data) headers["Content-Type"] = "application/json";
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text || res.statusText;
    try {
      const parsed = JSON.parse(text) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {
      // keep text
    }
    const error = new Error(message) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  return res.json();
}
