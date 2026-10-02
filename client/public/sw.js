self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener("push", (event) => {
  event.waitUntil(onPush(event));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const dest = event.notification?.data?.url || "/";
  event.waitUntil(openApp(dest));
});

async function onPush(event) {
  let kind = "burn";
  let unread = 1;
  let title = "Pidaka";
  let body = "A burn arrived.";
  try {
    const data = event.data ? event.data.json() : null;
    if (data?.kind) kind = String(data.kind);
    if (data && Number.isFinite(data.n)) unread = Math.max(1, data.n);
    if (data?.title) title = String(data.title);
    if (data?.body) body = String(data.body);
  } catch {
    // payload is only a kind + count; ignore junk
  }

  const isBurn = kind === "burn";
  const isHearth = kind.startsWith("hearth-");
  const dest = isBurn ? "/inbox" : isHearth ? "/hearth" : "/";
  const tag = isBurn ? "pidaka-burn" : `pidaka-${kind}`;

  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const focused = windows.some((client) => client.focused);
  if (focused && isBurn) {
    for (const client of windows) {
      client.postMessage({ kind: "burn", n: unread, title, body });
    }
    return;
  }
  if (isHearth) {
    for (const client of windows) {
      client.postMessage({ kind, title, body });
    }
  }

  await self.registration.showNotification(title, {
    body,
    icon: "/apple-touch-icon.png",
    badge: "/apple-touch-icon.png",
    tag,
    renotify: true,
    data: { url: dest, kind },
  });
}

async function openApp(dest) {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const already = windows.find((client) => {
    try {
      return new URL(client.url).pathname.startsWith(dest) && dest !== "/";
    } catch {
      return false;
    }
  });
  if (already && "focus" in already) {
    return already.focus();
  }
  if (dest.startsWith("/hearth")) {
    if (self.clients.openWindow) return self.clients.openWindow(dest);
    return;
  }
  for (const client of windows) {
    if ("focus" in client) {
      if ("navigate" in client) {
        try {
          await client.navigate(dest);
        } catch {
          // keep the existing tab
        }
      }
      return client.focus();
    }
  }
  if (self.clients.openWindow) {
    return self.clients.openWindow(dest);
  }
}
