// Minimal service worker: no offline caching (the app is dynamic/data-driven
// and out of scope for offline support per spec), but registering one with a
// fetch handler is what lets browsers treat CONNECT as installable.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Pass-through: always hit the network. Present only so the app
  // qualifies as an installable PWA.
});
