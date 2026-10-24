const PUSH_ENDPOINT = "https://vbqjvmnhdtdhmeeudqnn.supabase.co/functions/v1/ceo-command-push";

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data?.text() || "Open ResoFit CEO Command for your briefing." }; }
  const title = data.title || "ResoFit CEO Command";
  const options = {
    body: data.body || "Your CEO briefing is ready.",
    tag: data.tag || "resofit-ceo-command",
    renotify: false,
    data: { url: data.url || "https://dashboard.resofit.fit/ceo-growth", receiptToken: data.receiptToken || null },
  };
  event.waitUntil((async () => {
    await self.registration.showNotification(title, options);
    if (data.receiptToken) {
      try {
        await fetch(PUSH_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "receipt", receiptToken: data.receiptToken, eventType: "push_received" }),
        });
      } catch { /* device receipt is best-effort; delivery status remains unconfirmed */ }
    }
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  event.waitUntil((async () => {
    if (data.receiptToken) {
      try {
        await fetch(PUSH_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "receipt", receiptToken: data.receiptToken, eventType: "notification_clicked" }),
        });
      } catch { /* click receipt is best-effort */ }
    }
    const target = data.url || "https://dashboard.resofit.fit/ceo-growth";
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("focus" in client) {
        await client.focus();
        if ("navigate" in client) await client.navigate(target);
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});
