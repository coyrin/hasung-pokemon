/* =========================================================
   pokeapi.js — PokeAPI v2 (https://pokeapi.co/api/v2/) 연동
   · 집에서만 쓰는 비영리 학습용이에요.
   · 한국어 이름·분류·도감 설명은 localStorage(hd_pokeapi_cache_v1)에
     캐시해서 두 번째부터는 인터넷 없이 바로 보여줘요.
   · 실패하면 조용히 null/기존 도감(HD.POKEDEX)으로 넘어가요.
   ========================================================= */
(function (HD) {
  "use strict";

  var BASE = "https://pokeapi.co/api/v2/";
  var CACHE_KEY = "hd_pokeapi_cache_v1";
  var MAX_ENTRIES = 400;
  var MAX_ID = 1025;
  var ART_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
  var SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

  /* ---------- 타입 한국어 이름 ---------- */
  var TYPE_KO = {
    normal: "노말", fire: "불꽃", water: "물", electric: "전기", grass: "풀",
    ice: "얼음", fighting: "격투", poison: "독", ground: "땅", flying: "비행",
    psychic: "에스퍼", bug: "벌레", rock: "바위", ghost: "고스트",
    dragon: "드래곤", dark: "악", steel: "강철", fairy: "페어리",
    stellar: "스텔라", unknown: "???"
  };

  var mem = null;      // 메모리 캐시
  var pending = {};    // 진행 중인 요청
  var SCHEMA = 2;      // 캐시 모양이 바뀌면 올린다(예전 것으면 다시 받음)

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function cache() {
    if (mem) return mem;
    mem = {};
    try {
      var raw = window.localStorage.getItem(CACHE_KEY);
      if (raw) {
        var obj = JSON.parse(raw);
        if (obj && typeof obj === "object") mem = obj;
      }
    } catch (e) { /* 캐시를 못 읽어도 그냥 새로 받는다 */ }
    return mem;
  }

  function persist() {
    var c = cache();
    trim(c);
    try { window.localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch (e) { /* 저장 실패는 무시 */ }
  }

  // 캐시가 너무 커지지 않게 오래된 것부터 버린다
  function trim(c) {
    var keys = Object.keys(c);
    if (keys.length <= MAX_ENTRIES) return;
    keys.sort(function (a, b) { return (c[a].at || 0) - (c[b].at || 0); });
    keys.slice(0, keys.length - MAX_ENTRIES).forEach(function (k) { delete c[k]; });
  }

  function clean(text) {
    return String(text || "").replace(/[\n\f\r\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
  }

  // language.name === "ko" 인 마지막 항목을 쓴다
  function pickKo(list) {
    var out = null;
    (list || []).forEach(function (item) {
      if (item && item.language && item.language.name === "ko") out = item;
    });
    return out;
  }

  // 한국어가 없을 때(신작 포켓몬)를 위한 영어 마지막 항목
  function pickEn(list) {
    var out = null;
    (list || []).forEach(function (item) {
      if (item && item.language && item.language.name === "en") out = item;
    });
    return out;
  }

  function fetchJson(url) {
    return fetch(url, { mode: "cors", credentials: "omit" }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    });
  }

  function buildRecord(id, p, s) {
    var rec = {
      v: SCHEMA,
      id: id, name: "", genus: "", flavor: "", flavorEn: "", types: [],
      height: 0, weight: 0, art: "", sprite: "", cry: "", at: Date.now()
    };

    var koName = s ? pickKo(s.names) : null;
    if (koName && koName.name) rec.name = clean(koName.name);
    if (!rec.name && p && p.name) rec.name = p.name.charAt(0).toUpperCase() + p.name.slice(1);

    var koGenus = s ? pickKo(s.genera) : null;
    if (koGenus && koGenus.genus) rec.genus = clean(koGenus.genus);

    var koFlavor = s ? pickKo(s.flavor_text_entries) : null;
    if (koFlavor && koFlavor.flavor_text) rec.flavor = clean(koFlavor.flavor_text);

    // 한국어 설명이 아직 없는 포켓몬은 영어 설명을 따로 남긴다
    if (!rec.flavor) {
      var enFlavor = s ? pickEn(s.flavor_text_entries) : null;
      if (enFlavor && enFlavor.flavor_text) rec.flavorEn = clean(enFlavor.flavor_text);
    }

    if (p) {
      rec.height = Math.round(Number(p.height) || 0) / 10;
      rec.weight = Math.round(Number(p.weight) || 0) / 10;
      rec.types = (p.types || []).map(function (t) {
        var en = String((t && t.type && t.type.name) || "").toLowerCase();
        return { en: en, ko: TYPE_KO[en] || en };
      }).filter(function (t) { return !!t.en; });

      var sp = p.sprites || {};
      var other = sp.other || {};
      var artwork = other["official-artwork"] || {};
      rec.sprite = sp.front_default || (SPRITE_BASE + id + ".png");
      rec.art = artwork.front_default || (ART_BASE + id + ".png");

      var cries = p.cries || {};
      rec.cry = cries.latest || cries.legacy || "";
    }

    return rec;
  }

  /* ---------- 조회 ---------- */
  function get(id) {
    id = Number(id);
    var c = cache();
    if (!id) return Promise.reject(new Error("잘못된 도감 번호"));
    if (c[id] && c[id].v === SCHEMA) return Promise.resolve(c[id]);
    if (pending[id]) return pending[id];

    var p = Promise.all([
      fetchJson(BASE + "pokemon/" + id + "/"),
      fetchJson(BASE + "pokemon-species/" + id + "/").catch(function () { return null; })
    ]).then(function (r) {
      var rec = buildRecord(id, r[0], r[1]);
      var c2 = cache();
      c2[id] = rec;
      persist();
      delete pending[id];
      return rec;
    }).catch(function (err) {
      delete pending[id];
      throw err;
    });

    pending[id] = p;
    return p;
  }

  function cached(id) {
    var rec = cache()[Number(id)];
    if (!rec || rec.v !== SCHEMA) return null;
    return rec;
  }

  function name(id) {
    var rec = cached(id);
    return (rec && rec.name) || null;
  }

  /* ---------- 알 부화용 무작위 번호 ---------- */
  function pickHatchId(ownedIds) {
    var owned = {};
    (ownedIds || []).forEach(function (id) { owned[Number(id)] = true; });
    var pool = [];
    for (var i = 1; i <= MAX_ID; i++) if (!owned[i]) pool.push(i);
    if (!pool.length) {
      for (var j = 1; j <= MAX_ID; j++) pool.push(j);
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* ---------- 화면 조각 ---------- */
  function typesHtml(types) {
    return (types || []).map(function (t) {
      var en = String((t && t.en) || "unknown").toLowerCase().replace(/[^a-z]/g, "");
      return '<span class="type-badge t-' + en + '">' + esc(t.ko || t.en || "?") + "</span>";
    }).join("");
  }

  /* ---------- 울음소리 ---------- */
  // iPadOS Safari는 .ogg를 못 틀 수도 있다 → 실패는 호출한 쪽에서 읽어주기/효과음으로 받쳐준다
  function playCry(url) {
    return new Promise(function (resolve, reject) {
      if (!url) { reject(new Error("울음소리 없음")); return; }
      var audio;
      try { audio = new Audio(url); } catch (e) { reject(e); return; }
      audio.volume = 0.7;
      var done = false;
      function ok() { if (!done) { done = true; resolve(true); } }
      function fail(e) { if (!done) { done = true; reject(e || new Error("재생 실패")); } }
      audio.addEventListener("ended", ok);
      audio.addEventListener("error", fail);
      try {
        var p = audio.play();
        if (p && p.then) p.then(ok).catch(fail);
        else ok();
      } catch (e) { fail(e); }
      // 재생이 아주 길어도 4초 뒤에는 정리
      setTimeout(function () { try { audio.pause(); } catch (e) {} ok(); }, 4000);
    });
  }

  HD.pokeapi = {
    BASE: BASE,
    MAX_ID: MAX_ID,
    CACHE_KEY: CACHE_KEY,
    TYPE_KO: TYPE_KO,
    get: get,
    cached: cached,
    name: name,
    pickHatchId: pickHatchId,
    typesHtml: typesHtml,
    playCry: playCry,
    prefetch: function (ids) {
      (ids || []).forEach(function (id) {
        if (!cached(id)) get(id).catch(function () { /* 실패는 조용히 */ });
      });
    }
  };
})(window.HD);
