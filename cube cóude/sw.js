const CACHE_NAME = "Prototype Cube Cóude";
const arquivosParaCache = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/manifest1.json",
  "/sw.js",
  "/img/logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(arquivosParaCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});