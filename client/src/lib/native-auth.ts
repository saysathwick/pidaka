import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { apiUrl, isNativeApp } from "@/lib/api-base";

export const NATIVE_AUTH_SCHEME = "in.pidaka.app";
export const NATIVE_AUTH_HOST = "auth";

/** Google blocks the account picker inside embedded WebViews. Custom Tabs are required. */
const OAUTH_TOOLBAR_COLOR = "#070709";

export type OAuthReturnParams = {
  token?: string | null;
  named?: boolean;
  authError?: string | null;
};

export function parseOAuthReturn(url: string): OAuthReturnParams | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== `${NATIVE_AUTH_SCHEME}:` || parsed.host !== NATIVE_AUTH_HOST) {
    return null;
  }
  return {
    token: parsed.searchParams.get("token"),
    named: parsed.searchParams.get("named") === "1",
    authError: parsed.searchParams.get("authError"),
  };
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
    const params = parseOAuthReturn(result.url);
    if (!params) return;
    void Browser.close();
    resetNativeWebViewHome();
    onReturn(params);
  });

  const listener = App.addListener("appUrlOpen", (event) => {
    const params = parseOAuthReturn(event.url);
    if (!params) return;
    void Browser.close();
    resetNativeWebViewHome();
    onReturn(params);
  });

  return () => {
    cancelled = true;
    void launch;
    void listener.then((handle) => handle.remove());
  };
}
