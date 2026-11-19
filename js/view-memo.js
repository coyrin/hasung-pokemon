/* =========================================================
   view-memo.js — 가족 메모 보드
   ========================================================= */
(function (HD) {
  "use strict";
  var ui = HD.ui;
  var el = null;

  var BOARDS = [
    { key: "today", title: "오늘의 메모", cls: "", emoji: "📝", ph: "오늘 할 일이나 기억할 것을 적어요" },
    { key: "weekend", title: "주말 계획", cls: "blue", emoji: "🎡", ph: "주말에 어디 갈까요?" },
    { key: "shop", title: "장보기 · 준비물", cls: "pink", emoji: "🧺", ph: "사야 할 것, 챙길 것을 적어요" }
  ];

  function itemsHtml(list) {
    if (!list.length) return '<p class="tiny muted">아직 메모가 없어요. 아래에 적어 보세요!</p>';
    return list.map(function (it) {
      return '' +
        '<div class="memo-item' + (it.done ? " is-done" : "") + '" data-item="' + ui.esc(it.id) + '">' +
          '<button class="mtick" type="button" data-toggle="' + ui.esc(it.id) + '" aria-label="체크">✓</button>' +
          '<span class="mtext">' + ui.esc(it.text) + "</span>" +
          '<button class="mdel" type="button" data-del="' + ui.esc(it.id) + '" aria-label="지우기">✕</button>' +
        "</div>";
    }).join("");
  }

  function render() {
    if (!el) return;
    var memo = HD.store.get().memo;
    el.innerHTML = '' +
      '<div class="memo-grid">' + BOARDS.map(function (b) {
        var list = memo[b.key] || [];
        var done = list.filter(function (x) { return x.done; }).length;
        return '' +
          '<section class="card memo-card ' + b.cls + '">' +
            '<h2 class="card-title">' + b.emoji + " " + b.title +
              (list.length ? ' <span class="tiny muted" style="font-weight:800">' + done + "/" + list.length + "</span>" : "") +
            "</h2>" +
            '<div class="memo-list stack" style="gap:6px" data-board="' + b.key + '">' + itemsHtml(list) + "</div>" +
            '<form class="memo-add" data-form="' + b.key + '">' +
              '<input type="text" maxlength="80" placeholder="' + b.ph + '" aria-label="' + b.title + ' 메모 입력" autocomplete="off">' +
              '<button class="btn green" type="submit">추가</button>' +
            "</form>" +
          "</section>";
      }).join("") + "</div>" +
      '<p class="tiny muted center mt14">메모는 이 기기에 저장돼요. 지우기는 부모 확인을 거쳐요.</p>';

    el.querySelectorAll("[data-form]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = form.querySelector("input");
        var text = input.value.trim();
        if (!text) { input.focus(); return; }
        HD.store.memoAdd(form.getAttribute("data-form"), text);
        HD.sound.pop();
        input.value = "";
        var focused = form.getAttribute("data-form");
        render();
        var again = el.querySelector('[data-form="' + focused + '"] input');
        if (again) again.focus();
      });
    });

    el.querySelectorAll("[data-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest("[data-board]");
        var board = item ? item.getAttribute("data-board") : null;
        if (!board) return;
        HD.store.memoToggle(board, btn.getAttribute("data-toggle"));
        HD.sound.click();
      });
    });

    el.querySelectorAll("[data-del]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest("[data-board]");
        var board = item ? item.getAttribute("data-board") : null;
        var id = btn.getAttribute("data-del");
        if (!board) return;
        HD.settings.requireParent(function () {
          HD.store.memoDelete(board, id);
          ui.toast("메모를 지웠어요");
        }, "메모를 지우려면 부모 확인이 필요해요");
      });
    });
  }

  HD.views = HD.views || {};
  HD.views.memo = { mount: function (node) { el = node; render(); }, render: render };
})(window.HD);
