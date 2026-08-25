// Retirement worker: the current product is online-only. Existing installations may still
// request this file, so activate once, remove the old empty caches, then unregister itself.
const CACHE_PREFIX = "shinkansen-meets-fuji-";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
  );
});
