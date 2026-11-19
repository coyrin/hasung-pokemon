/* =========================================================
   view-study.js — 공부 탭 + 공부 타이머 + 연습 퀴즈
   ========================================================= */
(function (HD) {
  "use strict";
  var ui = HD.ui;
  var el = null;

  function subjectCard(sub, idx) {
    var st = HD.store.get();
    var mon = HD.byId(sub.stickerId);
    var done = HD.store.studyDone(sub.id);
    return '' +
      '<article class="card study-card' + (done ? " is-done" : "") + '">' +
        (done ? '<span class="done-flag">오늘 완료 ✓</span>' : "") +
        '<div class="sc-head">' +
          '<span class="sc-badge">' + (idx + 1) + "과목<br>" + ui.esc(sub.plot || "공부") + "</span>" +
          '<span class="sc-name" style="color:' + ui.esc(sub.color || "#232833") + '">' + ui.esc(sub.name) + "</span>" +
          '<button class="sc-copy" type="button" data-speak="' + ui.esc(sub.id) + '" aria-label="설명 읽어주기">🔊 읽기</button>' +
        "</div>" +
        '<p class="sc-note">' + ui.esc(sub.note || "") + "</p>" +
        '<div class="sc-emoji">' + ui.esc(sub.emoji || "📘") + "</div>" +
        '<div class="sc-mon">' + ui.spriteHtml(mon, 76) + "</div>" +
        '<div class="sc-reward">다 하면 ' + ui.esc(mon.name) + " 스티커!</div>" +
        '<div class="sc-sub">포켓몬 마을도 자라요</div>' +
        '<button class="sc-start" type="button" data-start="' + ui.esc(sub.id) + '" style="background:' + ui.esc(sub.color || "#2f6ff0") + '">시작하기 ▶</button>' +
      "</article>";
  }

  function render() {
    if (!el) return;
    var st = HD.store.get();
    var subs = st.settings.study;
    var doneCount = subs.filter(function (s) { return HD.store.studyDone(s.id); }).length;

    el.innerHTML = '' +
      '<div class="row wrap" style="justify-content:space-between;margin-bottom:12px">' +
        '<h2 class="section-label blue" style="margin:0">하성 공부<span class="count">' + doneCount + " / " + subs.length + "</span></h2>" +
        '<p class="tiny muted" style="margin:0">종이 교재로 공부하고, 다 하면 스티커를 받아요</p>' +
      "</div>" +
      '<div class="study-grid">' + subs.map(subjectCard).join("") + "</div>";

    el.querySelectorAll("[data-start]").forEach(function (btn) {
      btn.addEventListener("click", function () { openStudy(btn.getAttribute("data-start")); });
    });
    el.querySelectorAll("[data-speak]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-speak");
        var sub = findSubject(id);
        if (sub) ui.speak(sub.name + ". " + (sub.note || ""), "ko-KR");
      });
    });
  }

  function findSubject(id) {
    return HD.store.settings().study.filter(function (s) { return s.id === id; })[0];
  }

  /* ---------- 공부 모달 ---------- */
  function openStudy(id) {
    var sub = findSubject(id);
    if (!sub) return;
    var mon = HD.byId(sub.stickerId);
    var rewarded = HD.store.studyRewarded(id);

    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="seg" role="tablist">' +
        '<button type="button" class="is-active" data-tab="timer">⏱️ 공부 타이머</button>' +
        '<button type="button" data-tab="quiz">🎯 연습 퀴즈</button>' +
      "</div>" +
      '<div class="seg-body"></div>';

    var timerHandle = null;
    var body = wrap.querySelector(".seg-body");
    var segBtns = wrap.querySelectorAll("[data-tab]");

    var tabs = {
      timer: function () { body.innerHTML = timerHtml(sub, rewarded); bindTimer(); },
      quiz: function () { body.innerHTML = ""; startQuiz(body, sub, rewarded); }
    };

    segBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        segBtns.forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        HD.sound.click();
        if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
        tabs[b.getAttribute("data-tab")]();
      });
    });

    function timerHtml(sub, alreadyRewarded) {
      return '' +
        '<div class="study-timer">' +
          '<div class="row" style="gap:14px;align-items:center">' +
            ui.spriteHtml(mon, 56) +
            '<div style="text-align:left"><div style="font-weight:900;font-size:18px">' + ui.esc(sub.name) + " 공부 시간</div>" +
            '<div class="tiny muted">' + ui.esc(sub.note || "") + "</div></div>" +
          "</div>" +
          '<div class="timer-digits" id="study-clock">00:00</div>' +
          '<div class="word-row">' + HD.ENGLISH_WORDS.map(function (w, i) {
            return '<button class="word-chip" type="button" data-word="' + i + '">' +
              '<span class="we">' + w.emoji + "</span>" +
              '<span class="wk">' + ui.esc(w.ko) + '</span>' +
              '<span class="wen">' + ui.esc(w.en) + "</span></button>";
          }).join("") + "</div>" +
          '<div class="row wrap" style="justify-content:center">' +
            '<button class="btn green" type="button" id="timer-start">▶ 시작</button>' +
            '<button class="btn ghost small" type="button" id="timer-reset">처음부터</button>' +
          "</div>" +
          '<p class="hint">종이 교재를 펴고 시작해요.<br>다 풀면 아래 버튼을 눌러 스티커를 받아요!</p>' +
          '<button class="btn primary" type="button" id="claim-study" style="min-width:280px;min-height:58px;font-size:19px"' +
            (alreadyRewarded ? " disabled" : "") + ">" +
            (alreadyRewarded ? "오늘 스티커를 받았어요 ⭐" : "다 풀었어요! 스티커 받기 ✓") +
          "</button>" +
        "</div>";
    }

    function bindTimer() {
      var sec = 0;
      var running = false;
      var clock = wrap.querySelector("#study-clock");
      var startBtn = wrap.querySelector("#timer-start");
      var resetBtn = wrap.querySelector("#timer-reset");
      var claim = wrap.querySelector("#claim-study");

      function paint() {
        clock.textContent = ui.pad2(Math.floor(sec / 60)) + ":" + ui.pad2(sec % 60);
      }
      function stop() {
        running = false;
        if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
        if (startBtn) startBtn.textContent = "▶ 이어서";
      }
      if (startBtn) {
        startBtn.addEventListener("click", function () {
          HD.sound.unlock();
          if (running) { stop(); return; }
          running = true;
          startBtn.textContent = "⏸ 잠깐 멈추기";
          timerHandle = setInterval(function () {
            sec += 1;
            paint();
            if (sec % 60 === 0) HD.sound.tick();
          }, 1000);
        });
      }
      if (resetBtn) {
        resetBtn.addEventListener("click", function () {
          stop(); sec = 0; paint(); HD.sound.click();
          if (startBtn) startBtn.textContent = "▶ 시작";
        });
      }
      wrap.querySelectorAll("[data-word]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var w = HD.ENGLISH_WORDS[Number(btn.getAttribute("data-word"))];
          if (!w) return;
          HD.sound.pop();
          ui.speak(w.ko + ", " + w.en, "en-US");
        });
      });
      if (claim) {
        claim.addEventListener("click", function () {
          if (HD.store.studyRewarded(sub.id)) return;
          stop();
          HD.actions.awardStudy(sub.id, sec);
          claim.disabled = true;
          claim.textContent = "오늘 스티커를 받았어요 ⭐";
        });
      }
      timerHandle = null;
      paint();
    }

    var m = ui.modal({
      title: sub.name,
      sub: "다 하면 " + mon.name + " 스티커! · " + (sub.note || ""),
      body: wrap,
      onClose: function () { if (timerHandle) clearInterval(timerHandle); }
    });
    tabs.timer();
    return m;
  }

  /* ---------- 퀴즈 ---------- */
  function startQuiz(host, sub, alreadyRewarded) {
    var list = HD.QUIZZES[sub.id] || [];
    if (!list.length) {
      host.innerHTML = '<p class="center muted" style="padding:20px">이 과목의 연습 퀴즈는 준비 중이에요.</p>';
      return;
    }
    var i = 0;
    var score = 0;
    var locked = false;

    function dots() {
      return '<div class="quiz-dots">' + list.map(function (_, k) {
        return '<i class="' + (k < i ? "ok" : k === i ? "now" : "") + '"></i>';
      }).join("") + "</div>";
    }

    function question() {
      var q = list[i];
      var speaker = q.speak || q.q;
      host.innerHTML = '' +
        '<div class="quiz-wrap">' +
          '<div class="quiz-top">' + dots() +
            '<span class="tiny muted" style="margin-left:auto">' + (i + 1) + " / " + list.length + "</span>" +
            '<button class="quiz-speak" type="button" id="q-speak">🔊 읽어주기</button>' +
          "</div>" +
          '<div class="quiz-q"><span class="q-art"' + (q.big ? ' style="font-size:56px;font-weight:900;color:#c0392b"' : "") + ">" + ui.esc(q.art || "") + "</span>" +
            "<span>" + ui.esc(q.q) + "</span></div>" +
          '<div class="quiz-choices">' + q.choices.map(function (c, k) {
            return '<button class="choice" type="button" data-k="' + k + '">' + ui.esc(c) + "</button>";
          }).join("") + "</div>" +
          '<div class="quiz-feedback" id="q-fb"></div>' +
        "</div>";

      var fb = host.querySelector("#q-fb");
      var speakBtn = host.querySelector("#q-speak");
      if (speakBtn) speakBtn.addEventListener("click", function () { ui.speak(speaker, "ko-KR"); });
      ui.speak(speaker, "ko-KR");

      host.querySelectorAll(".choice").forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (locked) return;
          locked = true;
          var k = Number(btn.getAttribute("data-k"));
          var ok = k === q.answer;
          var all = host.querySelectorAll(".choice");
          all.forEach(function (b) {
            b.disabled = true;
            if (Number(b.getAttribute("data-k")) === q.answer) b.classList.add("correct");
          });
          if (ok) {
            score += 1;
            HD.sound.correct();
            fb.className = "quiz-feedback ok";
            fb.textContent = "정답이에요! 참 잘했어요 🎉";
          } else {
            btn.classList.add("wrong");
            HD.sound.wrong();
            fb.className = "quiz-feedback no";
            fb.textContent = "아깝다! 정답은 " + q.choices[q.answer] + " 예요";
          }
          setTimeout(function () {
            locked = false;
            i += 1;
            if (i >= list.length) result();
            else question();
          }, ok ? 900 : 1400);
        });
      });
    }

    function result() {
      var perfect = score === list.length;
      host.innerHTML = '' +
        '<div class="quiz-result">' +
          '<div style="font-size:56px">' + (perfect ? "🏆" : "🌟") + "</div>" +
          '<div class="big">' + list.length + "문제 중 " + score + "개 맞혔어요!</div>" +
          '<p class="muted" style="margin:0;font-weight:800">' + (perfect ? "완벽해요! 스티커를 받아요" : "한 번 더 풀면 더 잘할 수 있어요") + "</p>" +
          '<div class="row wrap" style="justify-content:center">' +
            '<button class="btn primary" type="button" id="quiz-claim"' + (alreadyRewarded ? " disabled" : "") + ">" +
              (alreadyRewarded ? "오늘 스티커를 받았어요 ⭐" : "스티커 받기 ✓") + "</button>" +
            '<button class="btn ghost" type="button" id="quiz-again">한 번 더 풀기</button>' +
          "</div>" +
        "</div>";
      if (perfect) ui.confetti(34);
      HD.sound.sticker();
      var claim = host.querySelector("#quiz-claim");
      if (claim) {
        claim.addEventListener("click", function () {
          if (HD.store.studyRewarded(sub.id)) return;
          HD.actions.awardStudy(sub.id, 0);
          claim.disabled = true;
          claim.textContent = "오늘 스티커를 받았어요 ⭐";
        });
      }
      var again = host.querySelector("#quiz-again");
      if (again) again.addEventListener("click", function () {
        i = 0; score = 0; locked = false; question();
      });
    }

    question();
  }

  HD.views = HD.views || {};
  HD.views.study = { mount: function (node) { el = node; render(); }, render: render };
})(window.HD);
