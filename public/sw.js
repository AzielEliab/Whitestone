/* Whitestone shell worker.
 * Caches static UI only. Never stores chat, uploads, or session JSON.
 * End & erase posts "whitestone-wipe" and unregisters this worker.
 */
const CACHE = "whitestone-shell-v1";
const PRECACHE = ["./", "./index.html", "./manifest.webmanifest", "./favicon.svg"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => undefined)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (/^\/(count|download|v1|api)(\/|$)/.test(url.pathname)) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && shouldCache(url)) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => undefined);
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(req);
        if (hit) return hit;
        if (req.mode === "navigate") {
          const shell = await caches.match("./index.html");
          if (shell) return shell;
        }
        return Response.error();
      }),
  );
});

function shouldCache(url) {
  const path = url.pathname;
  if (path.includes("/assets/")) return true;
  return /\.(svg|png|webmanifest|css|js)$/i.test(path) || path === "/" || path.endsWith("/index.html");
}

self.addEventListener("message", (event) => {
  const data = event.data;
  if (data === "whitestone-wipe" || data?.type === "whitestone-wipe") {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))));
  }
});
