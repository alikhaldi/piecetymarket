const CACHE_NAME = "piecety-cache-v2"; // Incremented version
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./offline.html", // Offline fallback page
  "./icons/car-192.png",
  "./icons/car-512.png",
  "./icons/toyota.png",
  "./icons/peugeot.png",
  "./icons/volkswagen.png",
  "./icons/renault.png",
  "./icons/hyundai.png",
  "./icons/nissan.png",
  "./icons/fiat.png",
  "./icons/citroen.png",
  "./icons/kia.png",
  "./icons/mercedes.png"
];

// More resilient installation
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    console.log('Opened cache');
    for (const url of urlsToCache) {
      try {
        await cache.add(url);
      } catch (err) {
        console.warn("SW: Failed to cache", url, err);
      }
    }
  })());
});

// Cleanup old caches
self.addEventListener("activate", event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Stale-while-revalidate strategy
self.addEventListener("fetch", event => {
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(response => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    // If we got a valid response, update the cache
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // If the network fails, return the offline page
                    return caches.match("./offline.html");
                });
                // Return the cached version first, then update in the background
                return response || fetchPromise;
            });
        })
    );
});
