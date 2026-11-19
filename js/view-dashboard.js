/* =========================================================
   view-dashboard.js — 대시보드 화면
   ========================================================= */
(function (HD) {
  "use strict";
  var ui = HD.ui;

  var el = null;
  var weatherHost = null;
  var lastMorningSig = "";

  function minutesToDeparture() {
    var s = HD.store.settings();
    var p = String(s.departure || "08:28").split(":");
    var now = new Date();
    var target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(p[0]) || 8, Number(p[1]) || 28, 0, 0);
    return { diff: Math.round((target.getTime() - now.getTime()) / 60000), target: target };
  }

  function departHtml() {
    var s = HD.store.settings();
    var m = minutesToDeparture();
    var diff = m.diff;
    var done = diff <= 0;
    var pct;
    if (done) pct = 100;
    else pct = Math.max(0, Math.min(100, (1 - diff / 60) * 100));

    var big;
    if (done) {
      big = '<p class="depart-big done">오늘도 즐거운 하루 보내자!</p>';
    } else if (diff >= 60) {
      var h = Math.floor(diff / 60);
      var mm = diff % 60;
      big = '<p class="depart-big"><span class="num">' + h + "시간" + (mm ? " " + mm + "분" : "") + "</span> 남았어요</p>";
    } else {
      big = '<p class="depart-big"><span class="num">' + diff + "분</span> 남았어요</p>";
    }

    var bubble = done ? "저녁 루틴도 같이 하자!" : (diff <= 5 ? "이제 신발 신을 시간!" : "하성아, 같이 준비하자!");
    var foot = done
      ? "출발 " + ui.timeLabel(s.departure) + " · 출발했어요 · 저녁 루틴도 준비해 볼까?"
      : "출발 " + ui.timeLabel(s.departure);

    return '' +
      '<div class="card depart-card">' +
        '<div>' +
          '<p class="depart-label">🏫 유치원 출발까지</p>' +
          big +
        "</div>" +
        '<div class="depart-track-wrap">' +
          '<div class="bubble" id="depart-bubble">' + bubble + "</div>" +
          '<div class="depart-track">' +
            '<div class="depart-fill" id="depart-fill" style="width:' + pct.toFixed(1) + '%"></div>' +
            ui.spriteHtml({ id: 25 }, 46, { className: "depart-pika", bounce: false }) +
          "</div>" +
          '<div class="depart-school">🏫</div>' +
        "</div>" +
        '<div class="depart-foot"><span id="depart-foot">' + foot + "</span></div>" +
      "</div>";
  }

  function routineCard(task, idx) {
    var done = !!HD.store.get().today.morning[task.id];
    var mon = HD.byId(task.pokemonId || 25);
    return '' +
      '<button class="routine' + (done ? " is-done" : "") + '" type="button" data-task="' + ui.esc(task.id) + '">' +
        '<span class="rnum">' + (idx + 1) + "</span>" +
        (idx === 0 ? '<span class="rbadge">같이 하자!</span>' : "") +
        '<span class="rmon">' + ui.spriteHtml(mon, 44) + "</span>" +
        '<span class="rart">' + HD.ART.byId(task.id) + "</span>" +
        '<span class="rname">' + ui.esc(task.label) + "</span>" +
        '<span class="rstate">' + (done ? "다 했어요!" : "터치해서 완료") + "</span>" +
        '<span class="rcheck"><span class="stamp">✓</span><span class="done-label">' + ui.esc(task.label) + " 완료!</span></span>" +
      "</button>";
  }

  function render() {
    if (!el) return;
    var st = HD.store.get();
    var s = st.settings;
    var now = new Date();
    var cp = ui.clockParts(now);
    var mDone = HD.store.morningDone();
    var mTotal = HD.store.morningTotal();

    el.innerHTML = '' +
      '<section class="hero">' +
        '<div class="hero-left">' +
          '<span class="world-badge"><span class="ball"></span>HASUNG POKEMON WORLD</span>' +
          '<p class="hero-date" id="hero-date">' + ui.dateKo(now) + "</p>" +
          '<div class="clock" id="clock">' +
            '<span class="clock-ampm" id="clock-ampm">' + cp.ampm + "</span>" +
            '<span id="clock-main">' + cp.h + " " + cp.mm + "</span>" +
            '<span class="clock-sec" id="clock-sec">' + cp.ss + "</span>" +
          "</div>" +
        "</div>" +
        '<div class="hero-right"><div class="weather" id="weather-host"></div></div>' +
      "</section>" +
      departHtml() +
      '<div class="routine-grid" id="routine-grid">' +
        s.morningTasks.map(routineCard).join("") +
      "</div>" +
      '<div class="family-row">' +
        '<div class="card family-card mom">' +
          '<div class="who">엄마는 지금</div>' +
          '<div class="scene">👩‍👦</div>' +
          '<div class="msg">' + ui.esc(s.momNote || "오늘도 사랑해 💗") + "</div>" +
        "</div>" +
        '<div class="card family-card dad">' +
          '<div class="who">아빠는 지금</div>' +
          '<div class="scene">👨‍👦</div>' +
          '<div class="msg">' + ui.esc(s.dadNote || "오늘도 힘내자 💪") + "</div>" +
        "</div>" +
      "</div>" +
      (mTotal && mDone >= mTotal ? '<p class="tiny muted center mt14">아침 루틴 ' + mDone + "/" + mTotal + " 완료 · 피카츄 스티커를 받았어요 ⚡</p>" : "");

    weatherHost = document.getElementById("weather-host");
    if (weatherHost) HD.weather.init(weatherHost, false);

    var grid = document.getElementById("routine-grid");
    if (grid) {
      grid.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-task]");
        if (!btn) return;
        HD.actions.toggleMorning(btn.getAttribute("data-task"), e);
      });
    }

    lastMorningSig = mDone + "/" + mTotal;
    tick();
  }

  function tick() {
    if (!el || !document.body.contains(el)) return;
    var now = new Date();
    var cp = ui.clockParts(now);
    var ampmEl = document.getElementById("clock-ampm");
    var mainEl = document.getElementById("clock-main");
    var secEl = document.getElementById("clock-sec");
    var dateEl = document.getElementById("hero-date");
    if (ampmEl) ampmEl.textContent = cp.ampm;
    if (mainEl) mainEl.textContent = cp.h + " " + cp.mm;
    if (secEl) secEl.textContent = cp.ss;
    if (dateEl) dateEl.textContent = ui.dateKo(now);

    // 출발 카드 갱신 (1분 단위)
    var m = minutesToDeparture();
    var diff = m.diff;
    var done = diff <= 0;
    var pct = done ? 100 : Math.max(0, Math.min(100, (1 - diff / 60) * 100));
    var fill = document.getElementById("depart-fill");
    var big = el.querySelector(".depart-big");
    var bubble = document.getElementById("depart-bubble");
    var foot = document.getElementById("depart-foot");
    var s = HD.store.settings();
    if (fill) fill.style.width = pct.toFixed(1) + "%";
    if (big) {
      if (done) {
        big.className = "depart-big done";
        big.textContent = "오늘도 즐거운 하루 보내자!";
      } else if (diff >= 60) {
        var h = Math.floor(diff / 60), mm = diff % 60;
        big.className = "depart-big";
        big.innerHTML = '<span class="num">' + h + "시간" + (mm ? " " + mm + "분" : "") + "</span> 남았어요";
      } else {
        big.className = "depart-big";
        big.innerHTML = '<span class="num">' + diff + "분</span> 남았어요";
      }
    }
    if (bubble) {
      var txt = done ? "저녁 루틴도 같이 하자!" : (diff <= 5 ? "이제 신발 신을 시간!" : "하성아, 같이 준비하자!");
      if (bubble.textContent !== txt) bubble.textContent = txt;
    }
    if (foot) {
      foot.textContent = done
        ? "출발 " + ui.timeLabel(s.departure) + " · 출발했어요 · 저녁 루틴도 준비해 볼까?"
        : "출발 " + ui.timeLabel(s.departure);
    }
    var pika = el.querySelector(".depart-pika");
    if (pika) pika.style.left = pct + "%";
  }

  HD.views = HD.views || {};
  HD.views.dashboard = {
    mount: function (node) { el = node; render(); },
    render: render,
    tick: tick
  };
})(window.HD);
