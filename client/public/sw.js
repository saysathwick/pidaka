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
  event.waitUntil(openInbox());
});

async function onPush(event) {
  let unread = 1;
  try {
    const data = event.data ? event.data.json() : null;
    if (data && Number.isFinite(data.n)) unread = Math.max(1, data.n);
  } catch {
    // payload is only a kind + count; ignore junk
  }

  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const focused = windows.some((client) => client.focused);
  if (focused) {
    for (const client of windows) {
      client.postMessage({ kind: "burn" });
    }
    return;
  }

  const body = unread === 1 ? "A burn arrived." : "Burns are waiting.";
  await self.registration.showNotification("Pidaka", {
    body,
    icon: "/apple-touch-icon.png",
    badge: "/apple-touch-icon.png",
    tag: "pidaka-burn",
    renotify: true,
    data: { url: "/inbox" },
  });
}

async function openInbox() {
  const dest = "/inbox";
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
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
