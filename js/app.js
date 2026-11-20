/* =========================================================
   app.js — 시작, 탭 이동, 스티커 보상 흐름
   ========================================================= */
(function (HD) {
  "use strict";
  var ui = HD.ui;

  var current = "dashboard";

  /* ---------- 보상 모달 ---------- */
  function showReward(pokemonId, title, sub, after) {
    var mon = HD.byId(pokemonId);
    var body = document.createElement("div");
    body.className = "reward-pop";
    body.innerHTML = '' +
      '<div class="rp-star">✦ ✦ ✦</div>' +
      ui.spriteHtml(mon, 130) +
      '<div class="rp-title">' + ui.esc(title) + "</div>" +
      '<div class="rp-sub">' + ui.esc(sub || "") + "</div>" +
      '<button class="btn primary" type="button" data-close="1" style="min-width:180px;margin-top:6px">좋아! ⭐</button>';
    ui.confetti(34);
    HD.sound.sticker();
    ui.modal({ title: "스티커를 받았어요!", body: body, size: "sm", onClose: function () { if (after) setTimeout(after, 120); } });
  }

  function showHatch(mon) {
    if (!mon || !mon.id) return;
    var id = Number(mon.id);
    var cached = HD.pokeapi ? HD.pokeapi.cached(id) : null;
    var rec = cached;
    var name = (cached && cached.name) || mon.name || HD.byId(id).name || "새 포켓몬";
    var failed = false;

    var body = document.createElement("div");
    body.className = "reward-pop hatch-pop";

    function paint() {
      var art = (rec && rec.art) ? rec.art : null;
      body.innerHTML = '' +
        '<div class="hatch-egg">' + HD.ART.egg(96) + "</div>" +
        '<div class="hatch-crack">✨ 알이 부화했어! ✨</div>' +
        (art
          ? '<div class="dex-art hatch-art"><img src="' + ui.esc(art) + '" alt="' + ui.esc(name) + '" data-pid="' + id + '" data-emoji="' + ui.esc(HD.byId(id).emoji) + '" data-step="0" decoding="async" onerror="HD.ui.artFail(this)"></div>'
          : ui.spriteHtml({ id: id, name: name, emoji: mon.emoji }, 130)) +
        '<div class="rp-title">' + ui.esc(name) + "를 만났어!</div>" +
        (rec && rec.genus ? '<span class="dex-genus">' + ui.esc(rec.genus) + "</span>" : "") +
        (rec && rec.types && rec.types.length ? '<div class="dex-types center">' + HD.pokeapi.typesHtml(rec.types) + "</div>" : "") +
        (rec && rec.flavor ? '<p class="hatch-flavor">' + ui.esc(rec.flavor) + "</p>"
          : (failed ? "" : '<p class="hatch-flavor muted">도감 설명을 불러오는 중…</p>')) +
        '<div class="rp-sub">포켓몬 마을에 새 친구가 생겼어요</div>' +
        '<div class="dex-actions center">' +
          '<button class="btn small" type="button" data-act="cry"' + ((rec && rec.cry) ? "" : " disabled") + ">🔊 울음소리</button>" +
          '<button class="btn small" type="button" data-act="say">🗣️ 이름 읽어주기</button>' +
        "</div>" +
        '<button class="btn blue" type="button" data-close="1" style="min-width:180px;margin-top:6px">마을에 놀러 가기 🏡</button>';
    }
    paint();

    body.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest("[data-act]") : null;
      if (!btn) return;
      var act = btn.getAttribute("data-act");
      if (act === "say") {
        ui.speak(name + "!", "ko-KR");
      } else if (act === "cry") {
        if (!rec || !rec.cry) { ui.toast("울음소리를 아직 못 가져왔어요"); HD.sound.pop(); return; }
        HD.pokeapi.playCry(rec.cry).then(null, function () {
          // iPadOS Safari가 ogg를 못 틀면 읽어주기·효과음으로 대신한다
          HD.sound.pop();
          ui.speak(name + "!", "ko-KR");
        });
      }
    });

    ui.confetti(40);
    HD.sound.sticker();
    ui.modal({ title: "새 포켓몬!", body: body, size: "sm" });

    if (!cached && HD.pokeapi) {
      HD.pokeapi.get(id).then(function (r) {
        rec = r;
        name = r.name || name;
        paint();
        if (HD.store.setPokemonName) HD.store.setPokemonName(id, r.name);
      }, function () {
        failed = true;
        paint();
      });
    }
  }

  function giveSticker(reason, kind, opts) {
    var res = HD.store.addSticker(reason, kind);
    var o = opts || {};
    if (!o.silent) {
      HD.sound.sticker();
      ui.confetti(26);
      ui.toast("스티커 +1장 · 모두 " + res.stickers + "장", { sticker: true });
    }
    if (res.hatched.length && !o.noHatch) {
      setTimeout(function () { showHatch(res.hatched[0]); }, o.silent ? 400 : 900);
    }
    return res;
  }

  /* ---------- 동작 ---------- */
  var actions = {
    toggleMorning: function (id, ev) {
      var done = HD.store.toggleTask("morning", id);
      if (done) {
        HD.sound.pop();
        if (ev && ev.clientX) ui.sparkleAt(ev.clientX, ev.clientY, 4);
      } else {
        HD.sound.click();
      }
      var st = HD.store.get();
      if (HD.store.morningDone() >= HD.store.morningTotal() && HD.store.morningTotal() > 0 && !st.today.morningReward) {
        HD.store.markReward("morning");
        st.today.morningRewardAt = Date.now();
        var res = giveSticker("아침 할 일을 다 했어요", "morning", { silent: true, noHatch: true });
        actions.refresh();
        showReward(25, "피카츄 스티커 받았어!", "아침 할 일을 다 했어요 · 스티커 " + res.stickers + "장", function () {
          if (res.hatched.length) showHatch(res.hatched[0]);
        });
        return;
      }
      actions.refresh();
    },

    toggleEvening: function (id, ev) {
      var done = HD.store.toggleTask("evening", id);
      if (done) {
        HD.sound.pop();
        if (ev && ev.clientX) ui.sparkleAt(ev.clientX, ev.clientY, 4);
      } else {
        HD.sound.click();
      }
      var st = HD.store.get();
      if (HD.store.eveningDone() >= HD.store.eveningTotal() && HD.store.eveningTotal() > 0 && !st.today.eveningReward) {
        HD.store.markReward("evening");
        var res = giveSticker("저녁 할 일을 다 했어요", "evening", { silent: true, noHatch: true });
        actions.refresh();
        showReward(1, "이상해씨 스티커 받았어!", "저녁 할 일을 다 했어요 · 스티커 " + res.stickers + "장", function () {
          if (res.hatched.length) showHatch(res.hatched[0]);
        });
        return;
      }
      actions.refresh();
    },

    awardStudy: function (id, seconds) {
      if (HD.store.studyRewarded(id)) {
        ui.toast("오늘은 이미 스티커를 받았어요 ⭐");
        return;
      }
      var sub = HD.store.settings().study.filter(function (s) { return s.id === id; })[0];
      if (!sub) return;
      HD.store.markStudyReward(id);
      var res = giveSticker("공부를 다 했어요 · " + sub.name, "study", { silent: true, noHatch: true });
      actions.refresh();
      var mins = seconds ? Math.max(1, Math.round(seconds / 60)) : 0;
      showReward(sub.stickerId, HD.byId(sub.stickerId).name + " 스티커 받았어!",
        sub.name + (mins ? " · " + mins + "분 공부했어요" : "") + " · 스티커 " + res.stickers + "장", function () {
          if (res.hatched.length) showHatch(res.hatched[0]);
        });
    },

    awardClean: function (reason) {
      HD.store.countClean(true);
      var res = giveSticker(reason || "정리 타이머를 끝냈어요", "clean", { silent: true });
      ui.toast("정리 완료! 스티커 +1장 ⭐", { sticker: true });
      HD.sound.sticker();
      actions.refresh();
      if (res.hatched.length) setTimeout(function () { showHatch(res.hatched[0]); }, 800);
    },

    giveSticker: giveSticker,
    showReward: showReward,
    showHatch: showHatch,
    refresh: function () {
      var v = HD.views[current];
      if (v) v.render();
      if (current !== "dashboard" && HD.views.dashboard) HD.views.dashboard.render();
    }
  };
  HD.actions = actions;

  /* ---------- 탭 ---------- */
  function show(name) {
    if (!HD.views[name]) name = "dashboard";
    current = name;
    document.querySelectorAll(".tab").forEach(function (t) {
      t.classList.toggle("is-active", t.getAttribute("data-view") === name);
    });
    document.querySelectorAll(".view").forEach(function (v) {
      v.classList.toggle("is-active", v.id === "view-" + name);
    });
    HD.views[name].mount(document.getElementById("view-" + name));
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function boot() {
    HD.store.load();

    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        HD.sound.click();
        show(tab.getAttribute("data-view"));
      });
    });
    var setBtn = document.getElementById("btn-settings");
    if (setBtn) setBtn.addEventListener("click", function () { HD.settings.open(); });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") ui.closeAllModals();
    });

    // 모든 화면 첫 렌더
    Object.keys(HD.views).forEach(function (k) {
      var node = document.getElementById("view-" + k);
      if (node) HD.views[k].mount(node);
    });
    show("dashboard");
    actions.refresh();

    // 1초마다 시계/출발시간
    setInterval(function () {
      if (current === "dashboard" && HD.views.dashboard) HD.views.dashboard.tick();
    }, 1000);

    // 날짜 변경 확인
    setInterval(function () {
      if (HD.store.checkDay()) {
        ui.toast("새로운 하루야! 오늘 루틴을 다시 시작해요 ☀️");
        actions.refresh();
      }
    }, 30000);

    // 15분마다 날씨 갱신
    setInterval(function () { HD.weather.reload(); }, 15 * 60 * 1000);

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) {
        if (HD.store.checkDay()) actions.refresh();
        if (HD.weather) HD.weather.reload();
      }
    });

    // 서비스 워커(PWA 오프라인)
    if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("./sw.js").catch(function () { /* 오프라인 캐시는 없어도 동작 */ });
      });
    }

    if (!HD.store.isAvailable()) {
      ui.toast("이 브라우저에서는 저장이 안 돼요. 시크릿 모드를 끄면 저장돼요.");
    }
  }

  HD.app = {
    boot: boot,
    show: show,
    refreshAll: function () {
      Object.keys(HD.views).forEach(function (k) {
        var node = document.getElementById("view-" + k);
        if (node) HD.views[k].mount(node);
      });
      actions.refresh();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window.HD);
