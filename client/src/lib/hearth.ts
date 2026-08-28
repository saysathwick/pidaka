import { apiUrl, isNativeApp } from "@/lib/api-base";

const TOKEN_KEY = "pidaka_hearth";

export function clearHearthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function hearthRequest(method: string, url: string, data?: unknown) {
  const leftover = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {};
  if (leftover) headers.Authorization = `Bearer ${leftover}`;
  if (data) headers["Content-Type"] = "application/json";
  const res = await fetch(apiUrl(url), {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: isNativeApp() ? "omit" : "include",
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
  if (leftover) localStorage.removeItem(TOKEN_KEY);
  return res.json();
}
