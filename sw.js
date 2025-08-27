// sw.js (install + resilient caching)
const CACHE_NAME = "piecety-cache-v1";
const urlsToCache = [
  "./",               // root of current folder
  "./index.html",
  "./style.css",
  "./icons/car-192.png", // add your local icons here
  "./icons/car-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    console.log('Opened cache');
    for (const url of urlsToCache) {
      try {
        // Add each URL to cache one by one
        await cache.add(url);
      } catch (err) {
        // Log the error and continue with the installation
        console.warn("SW: Failed to cache", url, err);
      }
    }
  })());
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(r => {
      // Return cached response if found, otherwise fetch from network
      return r || fetch(e.request);
    })
  );
});
