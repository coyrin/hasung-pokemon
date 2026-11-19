/* =========================================================
   view-tasks.js — 할 일 화면 (아침/저녁)
   ========================================================= */
(function (HD) {
  "use strict";
  var ui = HD.ui;
  var el = null;

  function rowHtml(group, task, done) {
    return '' +
      '<button class="task-row' + (done ? " is-done" : "") + '" type="button" data-group="' + group + '" data-id="' + ui.esc(task.id) + '">' +
        '<span class="box">✓</span>' +
        "<span>" + ui.esc(task.label) + "</span>" +
      "</button>";
  }

  function rewardHtml(opts) {
    var unlocked = opts.done >= opts.total && opts.total > 0;
    var mon = { id: opts.pokemonId };
    var time = opts.time ? " · " + opts.time : "";
    return '' +
      '<div class="task-reward' + (unlocked ? "" : " locked") + '">' +
        '<span class="' + (unlocked ? "" : "preview") + '">' + ui.spriteHtml(mon, 64) + "</span>" +
        "<div>" +
          '<div class="rw-text">' + (unlocked ? "⚡ " + ui.esc(opts.pokemonName) + " 스티커 받았어요!" : "다 하면 " + ui.esc(opts.pokemonName) + " 스티커!") + "</div>" +
          '<div class="rw-sub">' + (unlocked
            ? ui.esc(opts.doneLabel) + " · " + opts.done + "/" + opts.total + " 완료" + time
            : (opts.total - opts.done) + "개 남았어요 · 포켓몬이 자라요") + "</div>" +
        "</div>" +
      "</div>";
  }

  function render() {
    if (!el) return;
    var st = HD.store.get();
    var s = st.settings;
    var mDone = HD.store.morningDone();
    var eDone = HD.store.eveningDone();
    var mTotal = s.morningTasks.length;
    var eTotal = s.eveningTasks.length;

    var morningTime = "";
    if (st.today.morningRewardAt) {
      var d = new Date(st.today.morningRewardAt);
      morningTime = ui.clockParts(d).ampm + " " + ui.clockParts(d).h + ":" + ui.clockParts(d).mm;
    }

    el.innerHTML = '' +
      '<div class="task-grid">' +
        '<div class="card task-panel">' +
          '<h2 class="section-label orange">아침 할 일<span class="count">' + mDone + " / " + mTotal + "</span></h2>" +
          '<div class="task-list" data-group="morning">' +
            s.morningTasks.map(function (t) { return rowHtml("morning", t, !!st.today.morning[t.id]); }).join("") +
          "</div>" +
          rewardHtml({
            done: mDone, total: mTotal, pokemonId: 25, pokemonName: "피카츄",
            doneLabel: "아침 할 일을 다 했어요", time: morningTime
          }) +
        "</div>" +
        '<div class="card task-panel">' +
          '<h2 class="section-label">저녁 할 일<span class="count">' + eDone + " / " + eTotal + "</span></h2>" +
          '<div class="task-list" data-group="evening">' +
            s.eveningTasks.map(function (t) { return rowHtml("evening", t, !!st.today.evening[t.id]); }).join("") +
          "</div>" +
          rewardHtml({
            done: eDone, total: eTotal, pokemonId: 1, pokemonName: "이상해씨",
            doneLabel: "저녁 할 일을 다 했어요"
          }) +
        "</div>" +
      "</div>" +
      '<p class="tiny muted center mt14">아침 할 일은 대시보드와 똑같이 움직여요. 다 하면 스티커가 한 장씩 쌓여요!</p>';

    el.querySelectorAll(".task-row").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        var group = btn.getAttribute("data-group");
        var id = btn.getAttribute("data-id");
        HD.sound.click();
        if (group === "morning") HD.actions.toggleMorning(id, e);
        else HD.actions.toggleEvening(id, e);
      });
    });
  }

  HD.views = HD.views || {};
  HD.views.tasks = { mount: function (node) { el = node; render(); }, render: render };
})(window.HD);
