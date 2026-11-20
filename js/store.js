/* =========================================================
   store.js — localStorage 상태 저장/불러오기
   ========================================================= */
(function (HD) {
  "use strict";

  var KEY = "hasung.pokemon.world.v1";

  function todayStr(d) {
    var t = d || new Date();
    var m = t.getMonth() + 1;
    var day = t.getDate();
    return t.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (day < 10 ? "0" + day : day);
  }

  function uid() {
    return Math.random().toString(36).slice(2, 9);
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function defaultState() {
    var now = Date.now();
    return {
      version: 1,
      createdAt: now,
      settings: clone(HD.DEFAULT_SETTINGS),
      stickers: 0,
      stickerLog: [],
      collection: [{ id: 133, at: now, starter: true }],
      egg: { no: 1, progress: 0, need: HD.DEFAULT_SETTINGS.eggFirst },
      memo: {
        today: [],
        weekend: [],
        shop: []
      },
      today: newDay()
    };
  }

  function newDay() {
    return {
      date: todayStr(),
      morning: {},
      evening: {},
      study: {},
      morningReward: false,
      eveningReward: false,
      cleanCount: 0,
      cleanRewardCount: 0
    };
  }

  function mergeSettings(saved) {
    var base = clone(HD.DEFAULT_SETTINGS);
    if (!saved || typeof saved !== "object") return base;
    Object.keys(saved).forEach(function (k) {
      if (saved[k] !== undefined && saved[k] !== null) base[k] = saved[k];
    });
    // 배열은 저장된 값을 그대로 (빈 배열도 허용)
    ["morningTasks", "eveningTasks", "study"].forEach(function (k) {
      if (!Array.isArray(saved[k]) || saved[k].length === 0) base[k] = clone(HD.DEFAULT_SETTINGS[k]);
    });
    // 공부 과목은 기본값과 id 기준으로 합쳐 메타(색/스티커)를 보존
    var mergedStudy = [];
    base.study.forEach(function (s) {
      var found = (saved.study || []).filter(function (x) { return x && x.id === s.id; })[0];
      mergedStudy.push(found ? Object.assign({}, s, found) : s);
    });
    base.study = mergedStudy;
    if (!base.departure || !/^([01]\d|2[0-3]):[0-5]\d$/.test(base.departure)) base.departure = "08:28";
    base.cleanMinutes = Math.max(1, Math.min(60, Number(base.cleanMinutes) || 10));
    base.timerMinutes = Math.max(1, Math.min(90, Number(base.timerMinutes) || 25));
    return base;
  }

  function normalize(raw) {
    var s = defaultState();
    if (!raw || typeof raw !== "object") return s;
    s.createdAt = raw.createdAt || s.createdAt;
    s.settings = mergeSettings(raw.settings);
    s.stickers = Math.max(0, Number(raw.stickers) || 0);
    s.stickerLog = Array.isArray(raw.stickerLog) ? raw.stickerLog.slice(0, 200) : [];
    s.collection = Array.isArray(raw.collection) && raw.collection.length
      ? raw.collection.filter(function (c) { return c && HD.byId(c.id).name; })
      : s.collection;
    if (!s.collection.length) s.collection = [{ id: 133, at: Date.now(), starter: true }];
    var egg = raw.egg || {};
    s.egg = {
      no: Math.max(1, Number(egg.no) || 1),
      progress: Math.max(0, Number(egg.progress) || 0),
      need: Math.max(1, Number(egg.need) || 3)
    };
    s.memo = {
      today: Array.isArray(raw.memo && raw.memo.today) ? raw.memo.today : [],
      weekend: Array.isArray(raw.memo && raw.memo.weekend) ? raw.memo.weekend : [],
      shop: Array.isArray(raw.memo && raw.memo.shop) ? raw.memo.shop : []
    };
    var t = raw.today && typeof raw.today === "object" ? raw.today : {};
    s.today = {
      date: t.date || todayStr(),
      morning: t.morning || {},
      evening: t.evening || {},
      study: t.study || {},
      morningReward: !!t.morningReward,
      eveningReward: !!t.eveningReward,
      morningRewardAt: t.morningRewardAt || null,
      cleanCount: Number(t.cleanCount) || 0,
      cleanRewardCount: Number(t.cleanRewardCount) || 0
    };
    return s;
  }

  var state = defaultState();
  var available = true;

  function readStorage() {
    try {
      return window.localStorage.getItem(KEY);
    } catch (e) {
      available = false;
      return null;
    }
  }

  function writeStorage() {
    if (!available) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      available = false;
      if (HD.ui && HD.ui.toast) HD.ui.toast("저장 공간을 쓸 수 없어요. 브라우저 설정을 확인해 주세요.");
    }
  }

  function emit() {
    if (HD.bus) HD.bus.emit("change");
  }

  var store = {
    KEY: KEY,
    todayStr: todayStr,
    uid: uid,

    load: function () {
      var raw = readStorage();
      if (raw) {
        try { state = normalize(JSON.parse(raw)); } catch (e) { state = defaultState(); }
      }
      // 날짜가 바뀌면 오늘 루틴만 초기화
      if (state.today.date !== todayStr()) {
        var keep = state.today;
        state.today = newDay();
        // 어제 완료 기록은 남기지 않음(루틴만 초기화)
        void keep;
        writeStorage();
      }
      return state;
    },

    get: function () { return state; },
    settings: function () { return state.settings; },
    isAvailable: function () { return available; },

    save: function () { writeStorage(); },

    checkDay: function () {
      if (state.today.date !== todayStr()) {
        state.today = newDay();
        writeStorage();
        emit();
        return true;
      }
      return false;
    },

    /* ---------- 설정 ---------- */
    updateSettings: function (patch) {
      Object.keys(patch || {}).forEach(function (k) {
        state.settings[k] = patch[k];
      });
      state.settings = mergeSettings(state.settings);
      writeStorage();
      emit();
    },

    /* ---------- 스티커 / 알 ---------- */
    needFor: function (no) {
      var st = state.settings;
      if (no <= 1) return Math.max(1, Number(st.eggFirst) || 3);
      return no % 2 === 0 ? Math.max(1, Number(st.eggNext) || 5) : Math.max(1, Number(st.eggFirst) || 3);
    },

    addSticker: function (reason, kind) {
      var amount = 1;
      state.stickers += amount;
      var entry = {
        ts: Date.now(),
        date: todayStr(),
        amount: amount,
        reason: reason || "스티커를 받았어요",
        kind: kind || "etc"
      };
      state.stickerLog.unshift(entry);
      if (state.stickerLog.length > 200) state.stickerLog.length = 200;

      var hatched = [];
      state.egg.progress += amount;
      var guard = 0;
      while (state.egg.progress >= state.egg.need && guard < 10) {
        guard++;
        state.egg.progress -= state.egg.need;
        var mon = pickNewPokemon();
        state.collection.push({ id: mon.id, at: Date.now(), eggNo: state.egg.no, name: mon.name || "" });
        hatched.push(mon);
        state.egg.no += 1;
        state.egg.need = store.needFor(state.egg.no);
      }
      writeStorage();
      emit();
      return { hatched: hatched, egg: state.egg, stickers: state.stickers };
    },

    /* ---------- 오늘 루틴 ---------- */
    toggleTask: function (group, id) {
      var bucket = state.today[group];
      if (!bucket) return false;
      bucket[id] = !bucket[id];
      writeStorage();
      emit();
      return bucket[id];
    },

    setTask: function (group, id, val) {
      state.today[group][id] = !!val;
      writeStorage();
      emit();
    },

    morningTotal: function () { return state.settings.morningTasks.length; },
    morningDone: function () {
      var n = 0;
      state.settings.morningTasks.forEach(function (t) { if (state.today.morning[t.id]) n++; });
      return n;
    },
    eveningTotal: function () { return state.settings.eveningTasks.length; },
    eveningDone: function () {
      var n = 0;
      state.settings.eveningTasks.forEach(function (t) { if (state.today.evening[t.id]) n++; });
      return n;
    },

    markReward: function (which) {
      state.today[which + "Reward"] = true;
      writeStorage();
    },

    /* ---------- 공부 ---------- */
    studyDone: function (id) {
      return !!(state.today.study[id] && state.today.study[id].doneAt);
    },
    studyRewarded: function (id) {
      return !!(state.today.study[id] && state.today.study[id].rewarded);
    },
    markStudy: function (id) {
      var rec = state.today.study[id] || {};
      rec.doneAt = Date.now();
      state.today.study[id] = rec;
      writeStorage();
      emit();
    },
    markStudyReward: function (id) {
      var rec = state.today.study[id] || {};
      rec.doneAt = rec.doneAt || Date.now();
      rec.rewarded = true;
      state.today.study[id] = rec;
      writeStorage();
      emit();
    },

    /* ---------- 정리 타이머 ---------- */
    countClean: function (rewarded) {
      state.today.cleanCount += 1;
      if (rewarded) state.today.cleanRewardCount += 1;
      writeStorage();
    },

    /* ---------- 가족 메모 ---------- */
    memoAdd: function (list, text) {
      if (!state.memo[list]) return null;
      var item = { id: uid(), text: String(text).trim(), done: false, at: Date.now() };
      if (!item.text) return null;
      state.memo[list].unshift(item);
      writeStorage();
      emit();
      return item;
    },
    memoToggle: function (list, id) {
      var arr = state.memo[list] || [];
      for (var i = 0; i < arr.length; i++) {
        if (arr[i].id === id) { arr[i].done = !arr[i].done; break; }
      }
      writeStorage();
      emit();
    },
    memoDelete: function (list, id) {
      state.memo[list] = (state.memo[list] || []).filter(function (x) { return x.id !== id; });
      writeStorage();
      emit();
    },

    /* ---------- 컬렉션 이름 보정 (PokeAPI 한글 이름) ---------- */
    setPokemonName: function (id, name) {
      if (!name) return false;
      var changed = false;
      state.collection.forEach(function (c) {
        if (Number(c.id) === Number(id) && c.name !== name) { c.name = name; changed = true; }
      });
      if (changed) { writeStorage(); emit(); }
      return changed;
    },

    /* ---------- 초기화 ---------- */
    resetToday: function () {
      state.today = newDay();
      writeStorage();
      emit();
    },
    resetAll: function () {
      state = defaultState();
      writeStorage();
      emit();
    }
  };

  function pickNewPokemon() {
    var owned = state.collection.map(function (c) { return c.id; });

    // PokeAPI 전국도감(1~1025) 중 아직 마을에 없는 포켓몬
    if (HD.pokeapi && HD.pokeapi.pickHatchId) {
      var id = HD.pokeapi.pickHatchId(owned);
      if (id) {
        var known = HD.byId(id);
        var cachedName = HD.pokeapi.name(id);
        return {
          id: id,
          name: cachedName || (known.name !== "포켓몬" ? known.name : ""),
          emoji: known.emoji
        };
      }
    }

    // 폴백: 기존 27종 풀
    var ownedMap = {};
    owned.forEach(function (x) { ownedMap[x] = true; });
    var pool = HD.POKEDEX.filter(function (p) { return !ownedMap[p.id]; });
    if (!pool.length) pool = HD.POKEDEX.slice();
    return pool[Math.floor(Math.random() * pool.length)];
  }

  HD.store = store;
})(window.HD);
