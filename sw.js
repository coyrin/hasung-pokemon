/* 하성의 포켓몬 월드 — 오프라인 캐시 (network-first) */
var CACHE = "hasung-pokemon-v3";
var V = "?v=3"; // index.html의 파일 버전과 같게 맞춘다
var ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css" + V,
  "./js/data.js" + V,
  "./js/store.js" + V,
  "./js/ui.js" + V,
  "./js/sound.js" + V,
  "./js/pokeapi.js" + V,
  "./js/weather.js" + V,
  "./js/view-dashboard.js" + V,
  "./js/view-tasks.js" + V,
  "./js/view-study.js" + V,
  "./js/view-timer.js" + V,
  "./js/view-pokemon.js" + V,
  "./js/view-memo.js" + V,
  "./js/settings.js" + V,
  "./js/app.js" + V,
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
