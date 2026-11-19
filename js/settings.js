/* =========================================================
   settings.js — 부모 확인 + 부모 설정
   ========================================================= */
(function (HD) {
  "use strict";
  var ui = HD.ui;

  var pendingOpen = false;

  /* ---------- 부모 확인 ---------- */
  function requireParent(onOk, message) {
    var a = 2 + Math.floor(Math.random() * 8);
    var b = 2 + Math.floor(Math.random() * 8);
    var answer = a + b;
    var body = document.createElement("div");
    body.className = "gate";
    body.innerHTML = '' +
      '<p class="hint">' + ui.esc(message || "부모님만 들어갈 수 있어요. 아래 문제를 풀어 주세요.") + "</p>" +
      '<div class="q">' + a + " + " + b + " = ?</div>" +
      '<input type="number" inputmode="numeric" pattern="[0-9]*" aria-label="답" autocomplete="off">' +
      '<div class="err" id="gate-err"></div>' +
      '<button class="btn blue" type="button" id="gate-ok" style="min-width:180px">확인</button>';

    var m = ui.modal({
      title: "부모 확인",
      body: body,
      onMount: function (wrap, close) {
        var input = wrap.querySelector("input");
        var err = wrap.querySelector("#gate-err");
        setTimeout(function () { input.focus(); }, 120);
        function check() {
          if (Number(input.value) === answer) {
            close();
            onOk();
          } else {
            err.textContent = "다시 한 번 계산해 볼까요?";
            input.value = "";
            input.focus();
            HD.sound.wrong();
          }
        }
        wrap.querySelector("#gate-ok").addEventListener("click", check);
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") { e.preventDefault(); check(); }
        });
      }
    });
    return m;
  }

  /* ---------- 설정 화면 ---------- */
  function open() {
    if (pendingOpen) return;
    pendingOpen = true;
    requireParent(function () {
      pendingOpen = false;
      renderSettings();
    }, "부모 설정을 열려면 아래 문제를 풀어 주세요.");
    setTimeout(function () { pendingOpen = false; }, 800);
  }

  function taskRows(tasks, group) {
    return tasks.map(function (t) {
      return '<div class="set-item" data-task-row="' + group + '">' +
        '<input type="text" class="task-label" data-id="' + ui.esc(t.id) + '" value="' + ui.esc(t.label) + '" maxlength="20" aria-label="할 일 이름">' +
        '<button class="del" type="button" data-remove="' + group + '" aria-label="삭제">✕</button>' +
      "</div>";
    }).join("");
  }

  function renderSettings() {
    var st = HD.store.get();
    var s = st.settings;
    var isCustomPlace = !HD.PLACES.some(function (p) {
      return Math.abs(p.lat - s.lat) < 0.001 && Math.abs(p.lon - s.lon) < 0.001;
    });

    var body = document.createElement("div");
    body.className = "set-grid";
    body.innerHTML = '' +
      '<div class="set-block">' +
        "<h3>🏫 등원 · 시간</h3>" +
        '<div class="set-row"><label>출발 목표</label>' +
          '<input type="time" id="set-departure" value="' + ui.esc(s.departure) + '">' +
          '<span class="tiny muted">기본 08:28</span></div>' +
        '<div class="set-row"><label>정리 타이머</label>' +
          '<select id="set-clean">' + [5, 10, 15].map(function (m) {
            return '<option value="' + m + '"' + (Number(s.cleanMinutes) === m ? " selected" : "") + ">" + m + "분</option>";
          }).join("") + "</select>" +
          '<span class="tiny muted">기본 10분</span></div>' +
        '<div class="set-row"><label>효과음</label>' +
          '<select id="set-sound">' +
            '<option value="on"' + (s.sound !== false ? " selected" : "") + ">켜기</option>" +
            '<option value="off"' + (s.sound === false ? " selected" : "") + ">끄기</option>" +
          "</select></div>" +
      "</div>" +
      '<div class="set-block">' +
        "<h3>🌤️ 날씨 지역</h3>" +
        '<div class="set-row"><label>지역</label>' +
          '<select id="set-place">' +
            HD.PLACES.map(function (p) {
              var sel = !isCustomPlace && Math.abs(p.lat - s.lat) < 0.001 && Math.abs(p.lon - s.lon) < 0.001;
              return '<option value="' + p.name + '" data-lat="' + p.lat + '" data-lon="' + p.lon + '"' + (sel ? " selected" : "") + ">" + p.name + "</option>";
            }).join("") +
            '<option value="__custom"' + (isCustomPlace ? " selected" : "") + ">직접 입력</option>" +
          "</select></div>" +
        '<div class="set-row" id="custom-place" style="' + (isCustomPlace ? "" : "display:none") + '">' +
          '<label>위도 · 경도</label>' +
          '<input type="number" step="0.001" id="set-lat" value="' + s.lat + '" style="width:120px" aria-label="위도">' +
          '<input type="number" step="0.001" id="set-lon" value="' + s.lon + '" style="width:120px" aria-label="경도">' +
          '<input type="text" id="set-place-name" value="' + ui.esc(isCustomPlace ? s.place : "") + '" placeholder="지역 이름" style="max-width:160px">' +
        "</div>" +
        '<p class="set-note">날씨는 광역 지역 기준으로만 불러와요. 집 주소나 유치원 이름은 넣지 않아요.</p>' +
      "</div>" +
      '<div class="set-block">' +
        "<h3>🌅 아침 할 일 <span class=\"tiny muted\">(대시보드와 같은 목록)</span></h3>" +
        '<div class="set-list" id="list-morning">' + taskRows(s.morningTasks, "morning") + "</div>" +
        '<div class="set-actions"><button class="btn small ghost" type="button" data-add="morning">+ 할 일 추가</button></div>' +
      "</div>" +
      '<div class="set-block">' +
        "<h3>🌙 저녁 할 일</h3>" +
        '<div class="set-list" id="list-evening">' + taskRows(s.eveningTasks, "evening") + "</div>" +
        '<div class="set-actions"><button class="btn small ghost" type="button" data-add="evening">+ 할 일 추가</button></div>' +
      "</div>" +
      '<div class="set-block">' +
        "<h3>📚 공부 5과목 · 오늘 분량</h3>" +
        '<div class="set-list" id="list-study">' + s.study.map(function (sub) {
          return '<div class="set-item" data-study-row="' + ui.esc(sub.id) + '">' +
            '<input type="text" class="study-name" value="' + ui.esc(sub.name) + '" maxlength="12" style="max-width:130px;flex:0 0 130px" aria-label="과목 이름">' +
            '<input type="text" class="study-note" value="' + ui.esc(sub.note || "") + '" maxlength="40" placeholder="오늘 분량 메모">' +
          "</div>";
        }).join("") + "</div>" +
        '<p class="set-note">과목 이름과 오늘 분량만 바꿀 수 있어요. 보상 포켓몬은 그대로예요.</p>' +
      "</div>" +
      '<div class="set-block">' +
        "<h3>💬 가족 한마디</h3>" +
        '<div class="set-row"><label>엄마는 지금</label><input type="text" id="set-mom" value="' + ui.esc(s.momNote) + '" maxlength="40"></div>' +
        '<div class="set-row"><label>아빠는 지금</label><input type="text" id="set-dad" value="' + ui.esc(s.dadNote) + '" maxlength="40"></div>' +
      "</div>" +
      '<div class="set-block">' +
        "<h3>⭐ 스티커 · 초기화</h3>" +
        '<div class="set-actions">' +
          '<button class="btn small primary" type="button" id="btn-test-sticker">스티커 +1 테스트</button>' +
          '<button class="btn small ghost" type="button" id="btn-reset-today">오늘 루틴 초기화</button>' +
          '<button class="btn small ghost" type="button" id="btn-reset-all" style="border-color:#d98a8a;color:#a02b2b">전부 처음으로</button>' +
        "</div>" +
        '<p class="set-note">스티커 ' + st.stickers + '장 · 모은 포켓몬 ' + st.collection.length + "마리 · " + st.egg.no + "번째 알 (" + st.egg.progress + "/" + st.egg.need + ")</p>" +
      "</div>";

    var foot = document.createElement("div");
    foot.className = "row wrap";
    foot.style.cssText = "justify-content:flex-end;gap:10px;margin-top:14px";
    foot.innerHTML = '<button class="btn ghost" type="button" data-close="1">닫기</button>' +
      '<button class="btn blue" type="button" id="btn-save-settings" style="min-width:160px">저장하기</button>';

    var m = ui.modal({
      title: "부모 설정",
      sub: "바꾼 뒤에는 꼭 저장하기를 눌러 주세요.",
      body: body,
      foot: foot
    });

    // 지역 select
    var placeSel = body.querySelector("#set-place");
    var custom = body.querySelector("#custom-place");
    placeSel.addEventListener("change", function () {
      custom.style.display = placeSel.value === "__custom" ? "" : "none";
    });

    // 할 일 추가/삭제
    body.querySelectorAll("[data-add]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var group = btn.getAttribute("data-add");
        var list = body.querySelector(group === "morning" ? "#list-morning" : "#list-evening");
        var row = document.createElement("div");
        row.className = "set-item";
        row.setAttribute("data-task-row", group);
        row.innerHTML = '<input type="text" class="task-label" value="" maxlength="20" placeholder="새 할 일" aria-label="할 일 이름">' +
          '<button class="del" type="button" data-remove="' + group + '" aria-label="삭제">✕</button>';
        list.appendChild(row);
        bindRemove(row.querySelector("[data-remove]"));
        row.querySelector("input").focus();
      });
    });
    function bindRemove(btn) {
      if (!btn) return;
      btn.addEventListener("click", function () {
        var row = btn.closest("[data-task-row]");
        if (row && row.parentNode) row.parentNode.removeChild(row);
      });
    }
    body.querySelectorAll("[data-remove]").forEach(bindRemove);

    // 테스트 / 초기화
    body.querySelector("#btn-test-sticker").addEventListener("click", function () {
      var r = HD.actions.giveSticker("부모님이 선물했어요", "test");
      void r;
    });
    body.querySelector("#btn-reset-today").addEventListener("click", function () {
      HD.store.resetToday();
      ui.toast("오늘 루틴을 처음으로 돌렸어요");
      HD.app.refreshAll();
    });
    body.querySelector("#btn-reset-all").addEventListener("click", function () {
      if (window.confirm("스티커와 포켓몬 마을까지 모두 처음으로 돌아가요. 계속할까요?")) {
        HD.store.resetAll();
        ui.toast("처음 상태로 돌아갔어요");
        m.close();
        HD.app.refreshAll();
      }
    });

    // 저장
    body.querySelector("#btn-save-settings").addEventListener("click", function () {
      var departure = body.querySelector("#set-departure").value || "08:28";
      var cleanMinutes = Number(body.querySelector("#set-clean").value) || 10;
      var soundOn = body.querySelector("#set-sound").value === "on";

      var placeVal = placeSel.value;
      var lat = s.lat, lon = s.lon, placeName = s.place;
      if (placeVal === "__custom") {
        lat = Number(body.querySelector("#set-lat").value);
        lon = Number(body.querySelector("#set-lon").value);
        placeName = (body.querySelector("#set-place-name").value || "").trim() || "우리 동네";
        if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
          ui.toast("위도·경도를 다시 확인해 주세요");
          return;
        }
      } else {
        var opt = placeSel.options[placeSel.selectedIndex];
        lat = Number(opt.getAttribute("data-lat"));
        lon = Number(opt.getAttribute("data-lon"));
        placeName = placeVal;
      }

      function collect(group) {
        return Array.prototype.slice.call(body.querySelectorAll('[data-task-row="' + group + '"]')).map(function (row, i) {
          var input = row.querySelector(".task-label");
          var id = input.getAttribute("data-id") || (group.charAt(0) + "_" + Date.now() + "_" + i);
          return { id: id, label: (input.value || "").trim() };
        }).filter(function (t) { return t.label; });
      }

      var morning = collect("morning");
      var evening = collect("evening");
      if (!morning.length) { ui.toast("아침 할 일을 하나 이상 남겨 주세요"); return; }
      if (!evening.length) { ui.toast("저녁 할 일을 하나 이상 남겨 주세요"); return; }
      // 대시보드 카드 그림/포켓몬은 기존 id 기준으로 유지, 새 항목은 기본값
      morning = morning.map(function (t, i) {
        var old = s.morningTasks.filter(function (x) { return x.id === t.id; })[0];
        return { id: t.id, label: t.label, pokemonId: old ? old.pokemonId : [7, 1, 4][i % 3] };
      });

      var study = s.study.map(function (sub) {
        var row = body.querySelector('[data-study-row="' + sub.id + '"]');
        if (!row) return sub;
        return Object.assign({}, sub, {
          name: (row.querySelector(".study-name").value || sub.name).trim() || sub.name,
          note: row.querySelector(".study-note").value.trim()
        });
      });

      HD.store.updateSettings({
        departure: departure,
        cleanMinutes: cleanMinutes,
        sound: soundOn,
        lat: lat, lon: lon, place: placeName,
        morningTasks: morning,
        eveningTasks: evening,
        study: study,
        momNote: body.querySelector("#set-mom").value.trim(),
        dadNote: body.querySelector("#set-dad").value.trim()
      });

      ui.toast("설정을 저장했어요 ✓");
      HD.sound.pop();
      m.close();
      HD.app.refreshAll();
      HD.weather.reload();
    });
  }

  HD.settings = { requireParent: requireParent, open: open };
})(window.HD);
