const VERSION = "resoflex-static-v1";
const STATIC_CACHE = VERSION;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.add(OFFLINE_URL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("resoflex-static-") && key !== STATIC_CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/functions/") || url.pathname.includes("/rest/v1/") || url.pathname.includes("/auth/v1/") || url.pathname.includes("/storage/v1/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => (await caches.match(OFFLINE_URL)) || Response.error()));
    return;
  }

  const isStaticAsset = ["script", "style", "font", "image"].includes(request.destination) &&
    (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/_build/") || /\.[a-f0-9]{8,}\.(js|css|woff2?|ttf|otf|png|jpe?g|webp|svg)$/i.test(url.pathname));
  if (!isStaticAsset) return;

  event.respondWith((async () => {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    const cacheControl = response.headers.get("cache-control") || "";
    if (response.ok && !/no-store|private/i.test(cacheControl)) {
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
