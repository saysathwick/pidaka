import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiUrl, isNativeApp } from "@/lib/api-base";

const VIEWER_KEY = "pidaka_viewer";

export function getViewerId(): string {
  let id = localStorage.getItem(VIEWER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VIEWER_KEY, id);
  }
  return id;
}

function getRequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Pidaka-Viewer": getViewerId(),
  };
  const token = localStorage.getItem("pidaka_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    ...getRequestHeaders(),
  };
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(apiUrl(url), {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: isNativeApp() ? "omit" : "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(apiUrl(queryKey.join("/") as string), {
      credentials: isNativeApp() ? "omit" : "include",
      headers: getRequestHeaders(),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 15_000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
