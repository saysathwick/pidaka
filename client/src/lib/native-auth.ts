import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { apiUrl, isNativeApp, NATIVE_API_ORIGIN } from "@/lib/api-base";

export const NATIVE_AUTH_SCHEME = "in.pidaka.app";
export const NATIVE_AUTH_HOST = "auth";

/** Google blocks the account picker inside embedded WebViews. Custom Tabs are required. */
const OAUTH_TOOLBAR_COLOR = "#070709";

export type OAuthReturnParams = {
  token?: string | null;
  named?: boolean;
  authError?: string | null;
};

function paramsFromSearch(searchParams: URLSearchParams): OAuthReturnParams {
  return {
    token: searchParams.get("token"),
    named: searchParams.get("named") === "1",
    authError: searchParams.get("authError"),
  };
}

export function parseOAuthReturn(url: string): OAuthReturnParams | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol === `${NATIVE_AUTH_SCHEME}:` && parsed.host === NATIVE_AUTH_HOST) {
    const params = paramsFromSearch(parsed.searchParams);
    if (!params.token && !params.authError) return null;
    return params;
  }

  const onBridge =
    parsed.origin === NATIVE_API_ORIGIN.replace(/\/$/, "")
    && parsed.pathname === "/app/auth";
  if (onBridge) {
    const params = paramsFromSearch(parsed.searchParams);
    if (!params.token && !params.authError) return null;
    return params;
  }

  return null;
}

async function closeOAuthBrowser() {
  if (!isNativeApp()) return;
  try {
    await Browser.close();
  } catch {
    // already closed
  }
}

export function handleNativeOAuthReturn(
  onReturn: (params: OAuthReturnParams) => void,
  url: string,
) {
  const params = parseOAuthReturn(url);
  if (!params) return false;
  void closeOAuthBrowser();
  resetNativeWebViewHome();
  onReturn(params);
  return true;
}

export async function openNativeOAuth(provider: "google" | "apple") {
  const url = `${apiUrl(`/api/auth/${provider}`)}?client=app`;
  await Browser.open({ url, toolbarColor: OAUTH_TOOLBAR_COLOR });
}

export function resetNativeWebViewHome() {
  if (!isNativeApp()) return;
  if (window.location.pathname !== "/" || window.location.search) {
    window.location.replace("/");
  }
}

export function listenForNativeOAuthReturn(
  onReturn: (params: OAuthReturnParams) => void,
): () => void {
  if (!isNativeApp()) return () => {};

  let cancelled = false;

  const launch = App.getLaunchUrl().then((result) => {
    if (cancelled || !result?.url) return;
    handleNativeOAuthReturn(onReturn, result.url);
  });

  const urlOpen = App.addListener("appUrlOpen", (event) => {
    handleNativeOAuthReturn(onReturn, event.url);
  });

  const resume = App.addListener("appStateChange", ({ isActive }) => {
    if (!isActive) return;
    void closeOAuthBrowser();
  });

  const browserFinished = Browser.addListener("browserFinished", () => {
    void closeOAuthBrowser();
  });

  return () => {
    cancelled = true;
    void launch;
    void urlOpen.then((handle) => handle.remove());
    void resume.then((handle) => handle.remove());
    void browserFinished.then((handle) => handle.remove());
  };
}
