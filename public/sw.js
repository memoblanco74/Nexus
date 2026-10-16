const CACHE_NAME = "nexus-app-v7";
const STATIC_ASSETS = ["/Nexus/manifest.json"];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isApiCall = url.hostname.indexOf("supabase.co") !== -1;

  if (isApiCall) {
    event.respondWith(fetch(event.request));
    return;
  }

  const isNavigation =
    event.request.mode === "navigate" ||
    (event.request.headers.get("accept") || "").indexOf("text/html") !== -1;

  if (isNavigation) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then(function (response) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(function () {
          return caches.match(event.request).then(function (cached) {
            return cached || caches.match("/Nexus/");
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      const network = fetch(event.request)
        .then(function (response) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(function () {
          return cached;
        });
      return cached || network;
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/Nexus/");
    })
  );
});

self.addEventListener("push", function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Nexus", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Nexus";
  const options = {
    body: data.body || "",
    tag: data.tag || undefined,
    renotify: !!data.tag,
    icon: "/Nexus/icon-192.png",
    badge: "/Nexus/badge-96.png",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
