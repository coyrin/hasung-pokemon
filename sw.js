/* 하성의 포켓몬 월드 — 오프라인 캐시 (network-first) */
var CACHE = "hasung-pokemon-v1";
var ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/data.js",
  "./js/store.js",
  "./js/ui.js",
  "./js/sound.js",
  "./js/weather.js",
  "./js/view-dashboard.js",
  "./js/view-tasks.js",
  "./js/view-study.js",
  "./js/view-timer.js",
  "./js/view-pokemon.js",
  "./js/view-memo.js",
  "./js/settings.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-180.png",
  "./fonts/PressStart2P.ttf"
];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(ASSETS.map(function (url) {
        return c.add(new Request(url, { cache: "reload" })).catch(function () { /* 하나 실패해도 설치는 계속 */ });
      }));
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  // 다른 곳(포켓몬 스프라이트, 날씨 API)은 브라우저에 맡긴다
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put("./index.html", copy); });
        return res;
      }).catch(function () {
        return caches.match("./index.html").then(function (r) { return r || caches.match("./"); });
      })
    );
    return;
  }

  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (r) {
        if (r) return r;
        if (req.destination === "image") return caches.match("./icons/icon-180.png");
        return new Response("", { status: 504 });
      });
    })
  );
});
