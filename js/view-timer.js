/* =========================================================
   view-timer.js — 정리 타이머
   ========================================================= */
(function (HD) {
  "use strict";
  var ui = HD.ui;
  var el = null;

  var totalMs = 10 * 60 * 1000;
  var remainMs = totalMs;
  var running = false;
  var finished = false;
  var tickId = null;
  var endAt = 0;
  var lastSecond = -1;

  function mins() { return HD.store.settings().cleanMinutes; }

  function render() {
    if (!el) return;
    totalMs = mins() * 60 * 1000;
    if (!running && !finished) remainMs = totalMs;

    el.innerHTML = '' +
      '<div class="card clean-card">' +
        '<div class="clean-head">' +
          "<div>" +
            '<h2>⏱ 정리 시간 · <span id="clean-total">' + mins() + '분</span></h2>' +
          "</div>" +
          '<button class="btn ghost small right" type="button" id="clean-stop">그만하기</button>' +
        "</div>" +
        '<div class="clean-seconds" id="clean-big"></div>' +
        '<div class="clean-track">' +
          '<div class="clean-fill" id="clean-fill" style="width:0%"></div>' +
          '<span class="clean-marill" id="clean-marill" style="left:0%">' + ui.spriteHtml({ id: 183 }, 46) + "</span>" +
        "</div>" +
        '<div class="clean-sub">' +
          ui.spriteHtml({ id: 183 }, 84) +
          '<div class="say">장난감은 상자에 쏙!</div>' +
        "</div>" +
        '<div class="clean-actions">' +
          '<button class="btn primary" type="button" id="clean-main">정리 시작 ▶</button>' +
        "</div>" +
        '<div class="clean-minutes">' +
          '<span class="tiny muted" style="font-weight:800">시간 고르기</span>' +
          [5, 10, 15].map(function (m) {
            return '<button class="chip' + (m === mins() ? " is-active" : "") + '" type="button" data-min="' + m + '">' + m + "분</button>";
          }).join("") +
        "</div>" +
        '<p class="tiny muted mt8" id="clean-hint">5분·10분·15분 중에 골라요. 다 정리하면 스티커 한 장!</p>' +
      "</div>";

    el.querySelectorAll("[data-min]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (running) return;
        var m = Number(b.getAttribute("data-min"));
        HD.store.updateSettings({ cleanMinutes: m });
        HD.sound.click();
        finished = false;
        render();
      });
    });

    var mainBtn = el.querySelector("#clean-main");
    if (mainBtn) {
      mainBtn.addEventListener("click", function () {
        if (running) finishNow();
        else start();
      });
    }
    var stopBtn = el.querySelector("#clean-stop");
    if (stopBtn) {
      stopBtn.addEventListener("click", function () {
        if (running || finished) stopAll();
        else ui.toast("아직 시작하지 않았어요");
      });
    }

    paint();
  }

  function paint() {
    var big = el && el.querySelector("#clean-big");
    var fill = el && el.querySelector("#clean-fill");
    var mar = el && el.querySelector("#clean-marill");
    var mainBtn = el && el.querySelector("#clean-main");
    var stopBtn = el && el.querySelector("#clean-stop");
    var hint = el && el.querySelector("#clean-hint");
    if (!big) return;

    var sec = Math.max(0, Math.ceil(remainMs / 1000));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    if (finished) {
      big.innerHTML = '<span class="num">정리 완료!</span> 스티커 +1 ⭐';
    } else if (running) {
      big.innerHTML = '<span class="num">' + m + "분 " + s + "초</span> 남았어요";
    } else {
      big.innerHTML = '<span class="num">' + m + "분</span> 준비됐어요";
    }
    var pct = totalMs > 0 ? Math.min(100, Math.max(0, ((totalMs - remainMs) / totalMs) * 100)) : 0;
    if (fill) fill.style.width = pct.toFixed(2) + "%";
    if (mar) mar.style.left = pct.toFixed(2) + "%";
    if (mainBtn) {
      mainBtn.textContent = running ? "정리 끝! ✓" : finished ? "한 번 더 정리 ▶" : "정리 시작 ▶";
      mainBtn.style.background = running ? "#ffcf3f" : finished ? "#8ee0a1" : "";
    }
    if (stopBtn) stopBtn.style.visibility = running || finished ? "visible" : "hidden";
    if (hint) {
      hint.textContent = running
        ? "장난감과 책을 상자에 넣고, 다 정리하면 큰 버튼을 눌러요!"
        : finished ? "정리를 끝냈어요! 스티커를 한 장 받았어요." : "5분·10분·15분 중에 골라요. 다 정리하면 스티커 한 장!";
    }
    if (running) {
      document.title = m + ":" + ui.pad2(s) + " 정리 시간 · 하성의 포켓몬 월드";
    } else {
      document.title = "하성의 포켓몬 월드";
    }
  }

  function start() {
    if (running) return;
    totalMs = mins() * 60 * 1000;
    remainMs = totalMs;
    finished = false;
    running = true;
    lastSecond = -1;
    endAt = Date.now() + remainMs;
    HD.sound.unlock();
    HD.sound.pop();
    if (tickId) clearInterval(tickId);
    tickId = setInterval(function () {
      remainMs = Math.max(0, endAt - Date.now());
      var sec = Math.ceil(remainMs / 1000);
      if (sec !== lastSecond && sec <= 5 && sec > 0) { lastSecond = sec; HD.sound.tick(); }
      paint();
      if (remainMs <= 0) complete();
    }, 200);
    paint();
  }

  function complete() {
    if (tickId) { clearInterval(tickId); tickId = null; }
    running = false;
    remainMs = 0;
    finished = true;
    HD.sound.timerEnd();
    paint();
    HD.actions.awardClean("정리 타이머를 끝냈어요");
    ui.confetti(30);
  }

  function finishNow() {
    if (!running) return;
    if (tickId) { clearInterval(tickId); tickId = null; }
    running = false;
    remainMs = 0;
    finished = true;
    HD.sound.sticker();
    paint();
    HD.actions.awardClean("정리를 스스로 끝냈어요");
    ui.confetti(30);
  }

  function stopAll() {
    if (tickId) { clearInterval(tickId); tickId = null; }
    running = false;
    finished = false;
    remainMs = mins() * 60 * 1000;
    paint();
    ui.toast("정리 타이머를 멈췄어요");
  }

  HD.views = HD.views || {};
  HD.views.timer = {
    mount: function (node) {
      el = node;
      if (!running && !finished) remainMs = mins() * 60 * 1000;
      render();
    },
    render: function () {
      // 실행 중이면 화면을 다시 그리지 않아 타이머가 끊기지 않게 한다
      if (running) { paint(); return; }
      render();
    },
    isRunning: function () { return running; }
  };
})(window.HD);
