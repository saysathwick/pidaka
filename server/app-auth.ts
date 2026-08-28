const APP_AUTH_SCHEME = "in.pidaka.app";
const APP_AUTH_HOST = "auth";

function escapeAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

export function appAuthBridgePath(query: URLSearchParams) {
  const suffix = query.toString();
  return suffix ? `/app/auth?${suffix}` : "/app/auth";
}

export function appAuthDeepLink(query: URLSearchParams) {
  const suffix = query.toString();
  return suffix
    ? `${APP_AUTH_SCHEME}://${APP_AUTH_HOST}?${suffix}`
    : `${APP_AUTH_SCHEME}://${APP_AUTH_HOST}`;
}

/** HTTPS bridge page: Custom Tab loads this, then jumps back into the Android app. */
export function appAuthBridgeHtml(query: URLSearchParams) {
  const deepLink = appAuthDeepLink(query);
  const safeLink = escapeAttr(deepLink);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="0;url=${safeLink}" />
    <title>Returning to Pidaka</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #070709;
        color: #f5f5f5;
        font-family: system-ui, sans-serif;
        text-align: center;
        padding: 1.5rem;
      }
      a { color: #f5c76a; }
    </style>
    <script>
      (function () {
        var target = ${JSON.stringify(deepLink)};
        function openApp() {
          window.location.replace(target);
        }
        openApp();
        setTimeout(openApp, 400);
        setTimeout(openApp, 1200);
      })();
    </script>
  </head>
  <body>
    <div>
      <p>Returning to Pidaka…</p>
      <p><a href="${safeLink}">Tap here if the app does not open</a></p>
    </div>
  </body>
</html>`;
}

export function appAuthBridgeQuery(req: {
  query: Record<string, unknown>;
}) {
  const params = new URLSearchParams();
  const token = typeof req.query.token === "string" ? req.query.token : "";
  const named = typeof req.query.named === "string" ? req.query.named : "";
  const authError = typeof req.query.authError === "string" ? req.query.authError : "";
  if (token) params.set("token", token);
  if (named === "1") params.set("named", "1");
  if (authError) params.set("authError", authError);
  return params;
}
