const CACHE_NAME = "piecety-cache-v1";
const urlsToCache = [
  "/Piecetymarket/",
  "/Piecetymarket/styles.css",
  "/Piecetymarket/app.js",
  "/Piecetymarket/icons/car.png" // optional if you have the icon
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
