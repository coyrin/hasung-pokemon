/* =========================================================
   view-pokemon.js — 포켓몬 알 키우기 & 포켓몬 마을
   ========================================================= */
(function (HD) {
  "use strict";
  var ui = HD.ui;
  var el = null;

  var SLOTS = [
    { x: 13, y: 80, s: 1.00 },
    { x: 27, y: 91, s: 0.92 },
    { x: 38, y: 72, s: 1.06 },
    { x: 52, y: 86, s: 0.95 },
    { x: 64, y: 74, s: 1.10 },
    { x: 78, y: 90, s: 0.92 },
    { x: 88, y: 73, s: 1.00 },
    { x: 18, y: 64, s: 0.84 },
    { x: 46, y: 61, s: 0.80 },
    { x: 70, y: 62, s: 0.84 },
    { x: 86, y: 88, s: 0.80 },
    { x: 32, y: 96, s: 0.76 },
    { x: 58, y: 96, s: 0.80 },
    { x: 7,  y: 92, s: 0.78 }
  ];

  function villageSvg() {
    return '' +
    '<svg class="village-svg" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs>' +
        '<linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#8fd0ff"/><stop offset="0.6" stop-color="#bfe6ff"/><stop offset="1" stop-color="#e4f5ff"/>' +
        "</linearGradient>" +
        '<linearGradient id="hillG" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#a9e07a"/><stop offset="1" stop-color="#79c94f"/>' +
        "</linearGradient>" +
      "</defs>" +
      '<rect width="800" height="400" fill="url(#skyG)"/>' +
      // 구름 (픽셀 느낌)
      '<g fill="#ffffff" opacity="0.95">' +
        '<rect x="60" y="52" width="96" height="26" rx="13"/><rect x="86" y="34" width="60" height="24" rx="12"/>' +
        '<rect x="330" y="30" width="120" height="28" rx="14"/><rect x="362" y="14" width="66" height="22" rx="11"/>' +
        '<rect x="600" y="64" width="110" height="26" rx="13"/><rect x="630" y="46" width="58" height="22" rx="11"/>' +
        '<rect x="470" y="90" width="80" height="20" rx="10"/>' +
      "</g>" +
      // 해
      '<circle cx="726" cy="52" r="34" fill="#ffe27a"/><circle cx="726" cy="52" r="26" fill="#fff3b8"/>' +
      // 먼 산/언덕
      '<path d="M0 250c90-60 170-64 260-30 80 30 130 18 210-16 90-38 190-34 330 22v174H0z" fill="#c9ebae"/>' +
      '<path d="M0 292c120-52 220-40 320-10 110 33 200 6 300-26 70-22 130-18 180-2v146H0z" fill="url(#hillG)"/>' +
      // 길
      '<path d="M360 400c10-46 26-70 60-96 30-24 38-46 34-74" stroke="#f0dCA8" stroke-width="0" fill="none"/>' +
      '<path d="M330 400c20-38 54-58 84-84 24-20 34-42 34-66" stroke="#f3e3b7" stroke-width="26" stroke-linecap="round" fill="none" opacity="0.9"/>' +
      // 집 1
      '<g transform="translate(430 214)">' +
        '<rect x="0" y="26" width="86" height="56" rx="4" fill="#fff6e8" stroke="#6b5a3e" stroke-width="2.5"/>' +
        '<path d="M-10 28L43 -6l53 34z" fill="#d9694a" stroke="#6b5a3e" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<rect x="34" y="52" width="20" height="30" rx="2" fill="#a9d6f5" stroke="#6b5a3e" stroke-width="2"/>' +
        '<rect x="10" y="42" width="14" height="14" rx="2" fill="#ffe27a" stroke="#6b5a3e" stroke-width="2"/>' +
        '<rect x="64" y="42" width="14" height="14" rx="2" fill="#ffe27a" stroke="#6b5a3e" stroke-width="2"/>' +
      "</g>" +
      // 집 2
      '<g transform="translate(600 240) scale(0.82)">' +
        '<rect x="0" y="26" width="86" height="56" rx="4" fill="#fff6e8" stroke="#6b5a3e" stroke-width="3"/>' +
        '<path d="M-10 28L43 -6l53 34z" fill="#e2a33f" stroke="#6b5a3e" stroke-width="3" stroke-linejoin="round"/>' +
        '<rect x="34" y="52" width="20" height="30" rx="2" fill="#a9d6f5" stroke="#6b5a3e" stroke-width="2.4"/>' +
      "</g>" +
      // 나무들
      '<g stroke="#5c8f3e" stroke-width="2.5">' +
        '<g transform="translate(70 240)"><rect x="-4" y="24" width="9" height="26" fill="#a9793f"/><circle cy="16" r="24" fill="#7fcb57"/><circle cx="-16" cy="24" r="16" fill="#8dd863"/><circle cx="16" cy="24" r="16" fill="#8dd863"/></g>' +
        '<g transform="translate(240 258) scale(0.8)"><rect x="-4" y="24" width="9" height="26" fill="#a9793f"/><circle cy="16" r="24" fill="#7fcb57"/><circle cx="-16" cy="24" r="16" fill="#8dd863"/><circle cx="16" cy="24" r="16" fill="#8dd863"/></g>' +
        '<g transform="translate(740 262) scale(0.9)"><rect x="-4" y="24" width="9" height="26" fill="#a9793f"/><circle cy="16" r="24" fill="#7fcb57"/><circle cx="-16" cy="24" r="16" fill="#8dd863"/><circle cx="16" cy="24" r="16" fill="#8dd863"/></g>' +
      "</g>" +
      // 꽃과 풀
      '<g opacity="0.9">' +
        '<circle cx="120" cy="330" r="4" fill="#ff8fb1"/><circle cx="126" cy="336" r="4" fill="#ffd23f"/>' +
        '<circle cx="300" cy="356" r="4" fill="#ffffff"/><circle cx="306" cy="362" r="4" fill="#ff8fb1"/>' +
        '<circle cx="520" cy="346" r="4" fill="#ffd23f"/><circle cx="526" cy="352" r="4" fill="#ffffff"/>' +
        '<circle cx="690" cy="340" r="4" fill="#ff8fb1"/><circle cx="696" cy="346" r="4" fill="#ffd23f"/>' +
      "</g>" +
      '<g stroke="#5fae3a" stroke-width="3" stroke-linecap="round" opacity="0.85">' +
        '<path d="M180 372v-12M160 372v-8M420 384v-12M440 384v-8M640 376v-10"/>' +
      "</g>" +
    "</svg>";
  }

  function villagerHtml(rec, slot) {
    var mon = HD.byId(rec.id);
    var size = Math.round(76 * slot.s);
    return '' +
      '<div class="villager" style="left:' + slot.x + "%;top:" + slot.y + "%;animation-delay:" + (slot.x / 40).toFixed(2) + 's">' +
        ui.spriteHtml(mon, size) +
        '<span class="vl-label">' + ui.esc(mon.name) + "</span>" +
      "</div>";
  }

  function relDate(ts) {
    var d = new Date(ts);
    return (d.getMonth() + 1) + "/" + d.getDate();
  }

  function render() {
    if (!el) return;
    var st = HD.store.get();
    var egg = st.egg;
    var need = egg.need;
    var prog = egg.progress;
    var coll = st.collection.slice(0, SLOTS.length);
    var rest = Math.max(0, st.collection.length - coll.length);

    var dots = "";
    for (var i = 0; i < need; i++) dots += '<i class="' + (i < prog ? "on" : "") + '"></i>';

    var log = st.stickerLog.slice(0, 12);

    el.innerHTML = '' +
      '<div class="poke-grid">' +
        '<div class="card egg-panel">' +
          '<h2 class="section-label pink" style="width:100%">지금 키우는 포켓몬<span class="count" style="color:#c2456b">스티커 ' + st.stickers + '장</span></h2>' +
          '<div class="egg-stage">' + HD.ART.egg(132) + "</div>" +
          '<div class="egg-name">포켓몬 알</div>' +
          '<div class="egg-sub">' + egg.no + "번째 알 · 무슨 포켓몬일까?</div>" +
          '<div class="egg-mini">' + HD.ART.egg(46) + '<span class="star">⭐</span></div>' +
          '<div class="egg-progress">' + dots + "</div>" +
          '<div class="egg-box">' +
            "새 포켓몬 알을 받았어요! 무슨 포켓몬일까?" +
            '<div class="next">다음: 스티커 ' + Math.max(0, need - prog) + "장이면 부화</div>" +
          "</div>" +
        "</div>" +
        '<div class="stack">' +
          '<div class="card village-panel">' +
            '<h2 class="section-label" style="margin:0">하성의 포켓몬 마을 <span class="muted" style="font-weight:800;font-size:14px">· 다 키운 포켓몬 ' + st.collection.length + "마리</span></h2>" +
            '<div class="village-frame">' + villageSvg() +
              (coll.length ? coll.map(function (c, k) { return villagerHtml(c, SLOTS[k]); }).join("") :
                '<div class="village-empty">아직은 마을이 조용해요.<br>루틴을 해서 첫 포켓몬을 만나요!</div>') +
              (rest > 0 ? '<div class="village-empty" style="align-items:flex-end;justify-content:flex-end;padding:10px;font-size:12px">+' + rest + "마리 더 있어요</div>" : "") +
            "</div>" +
            '<p class="tiny muted" style="margin:0">스티커를 모으면 알이 부화하고, 포켓몬이 마을에 살아요.</p>' +
          "</div>" +
          '<div class="card recent-sticker">' +
            '<h2 class="section-label blue" style="margin:0 0 4px">최근 스티커</h2>' +
            (log.length ? '<div class="recent-list">' + log.map(function (l) {
              return '<div class="recent-row"><span class="date">' + relDate(l.ts) + '</span>' +
                '<span class="plus">+' + l.amount + "장</span>" +
                '<span class="why">' + ui.esc(l.reason) + "</span>" +
                '<span class="kind">' + (l.kind === "study" ? "공부" : l.kind === "clean" ? "정리" : "할 일") + "</span></div>";
            }).join("") + "</div>" : '<p class="tiny muted" style="margin:6px 0 0">아직 스티커 기록이 없어요. 루틴을 하면 여기에 쌓여요!</p>') +
          "</div>" +
        "</div>" +
      "</div>";

    var frame = el.querySelector(".village-frame");
    if (frame) {
      // 터치하면 포켓몬 이름을 읽어준다
      frame.addEventListener("click", function (e) {
        var v = e.target.closest(".villager");
        if (!v) return;
        var name = v.querySelector(".vl-label");
        if (name) {
          ui.speak(name.textContent + "!", "ko-KR");
          var r = v.getBoundingClientRect();
          ui.sparkleAt(r.left + r.width / 2, r.top, 5);
        }
      });
    }
  }

  HD.views = HD.views || {};
  HD.views.pokemon = { mount: function (node) { el = node; render(); }, render: render };
})(window.HD);
