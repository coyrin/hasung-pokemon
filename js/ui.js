/* =========================================================
   ui.js — 작은 도우미들 (모달, 토스트, 효과음 위치, 스프라이트)
   ========================================================= */
(function (HD) {
  "use strict";

  /* ---------- 이벤트 버스 ---------- */
  var listeners = {};
  HD.bus = {
    on: function (name, fn) {
      (listeners[name] = listeners[name] || []).push(fn);
      return function () {
        listeners[name] = (listeners[name] || []).filter(function (f) { return f !== fn; });
      };
    },
    emit: function (name, payload) {
      (listeners[name] || []).forEach(function (fn) {
        try { fn(payload); } catch (e) { console.error(e); }
      });
    }
  };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function clockParts(d) {
    var h = d.getHours();
    var ampm = h < 12 ? "오전" : "오후";
    var h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return { ampm: ampm, h: h12, hh24: h, m: d.getMinutes(), s: d.getSeconds(), mm: pad2(d.getMinutes()), ss: pad2(d.getSeconds()) };
  }

  function dateKo(d) {
    var w = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"][d.getDay()];
    return (d.getMonth() + 1) + "월 " + d.getDate() + "일 " + w;
  }

  function timeLabel(hhmm) {
    var p = String(hhmm || "08:28").split(":");
    var h = Number(p[0]) || 0;
    var m = Number(p[1]) || 0;
    var ampm = h < 12 ? "오전" : "오후";
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    return ampm + " " + h12 + ":" + pad2(m);
  }

  /* ---------- 포켓몬 스프라이트 ---------- */
  function spriteHtml(pokemon, size, opts) {
    var o = opts || {};
    var id = pokemon.id;
    var name = pokemon.name || HD.byId(id).name;
    var emoji = pokemon.emoji || HD.byId(id).emoji;
    var url = HD.SPRITE_BASE + "versions/generation-v/black-white/animated/" + id + ".gif";
    var style = "width:" + size + "px;height:" + size + "px;";
    var cls = "sprite" + (o.className ? " " + o.className : "");
    if (o.bounce) style += "animation:bob 1.3s ease-in-out infinite;";
    return '<img class="' + cls + '" src="' + url + '" alt="' + esc(name) + '" title="' + esc(name) +
      '" data-pid="' + id + '" data-emoji="' + esc(emoji) + '" data-size="' + size +
      '" style="' + style + '" loading="lazy" decoding="async" onerror="HD.ui.spriteFail(this)">';
  }

  function spriteFail(img) {
    var step = Number(img.getAttribute("data-step") || 0);
    if (step === 0) {
      img.setAttribute("data-step", "1");
      img.src = HD.SPRITE_BASE + img.getAttribute("data-pid") + ".png";
      return;
    }
    // 이모지 폴백
    var size = Number(img.getAttribute("data-size")) || 48;
    var span = document.createElement("span");
    span.className = "sprite-emoji";
    span.textContent = img.getAttribute("data-emoji") || "❔";
    span.setAttribute("aria-label", img.getAttribute("alt") || "포켓몬");
    span.style.width = size + "px";
    span.style.height = size + "px";
    span.style.fontSize = Math.round(size * 0.8) + "px";
    if (img.parentNode) img.parentNode.replaceChild(span, img);
  }

  /* ---------- 토스트 ---------- */
  function toast(text, opts) {
    var o = opts || {};
    var root = document.getElementById("toast-root");
    if (!root) return;
    var el = document.createElement("div");
    el.className = "toast" + (o.sticker ? " sticker" : "");
    el.innerHTML = (o.sticker ? "⭐ " : "") + esc(text);
    root.appendChild(el);
    setTimeout(function () {
      el.style.transition = "opacity .3s ease, transform .3s ease";
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
    }, o.ms || 2400);
  }

  /* ---------- 색종이 / 반짝이 ---------- */
  function confetti(n) {
    var root = document.getElementById("fx-root");
    if (!root) return;
    var colors = ["#ffcf3f", "#4a86e8", "#35b558", "#ff8fb1", "#7a5cf0", "#ff9d52"];
    var count = n || 28;
    for (var i = 0; i < count; i++) {
      var c = document.createElement("i");
      c.className = "confetti";
      c.style.left = (Math.random() * 96 + 2) + "%";
      c.style.top = (Math.random() * 10) + "%";
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = (Math.random() * 0.35) + "s";
      c.style.animationDuration = (1.2 + Math.random() * 0.8) + "s";
      root.appendChild(c);
      (function (node) {
        setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 2400);
      })(c);
    }
  }

  function sparkleAt(x, y, n) {
    var root = document.getElementById("fx-root");
    if (!root) return;
    var glyphs = ["✨", "⭐", "🌟", "💫"];
    for (var i = 0; i < (n || 6); i++) {
      var s = document.createElement("span");
      s.className = "sparkle";
      s.textContent = glyphs[i % glyphs.length];
      s.style.left = (x + (Math.random() * 90 - 45)) + "px";
      s.style.top = (y + (Math.random() * 60 - 30)) + "px";
      s.style.animationDelay = (Math.random() * 0.25) + "s";
      root.appendChild(s);
      (function (node) {
        setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 1400);
      })(s);
    }
  }

  /* ---------- 모달 ---------- */
  var modalStack = [];

  function modal(cfg) {
    var root = document.getElementById("modal-root");
    var wrap = document.createElement("div");
    wrap.className = "modal-inner";
    wrap.innerHTML =
      '<div class="modal-backdrop" data-close="1"></div>' +
      '<div class="modal' + (cfg.size === "sm" ? " sm" : "") + '" role="dialog" aria-modal="true" aria-label="' + esc(cfg.title || "창") + '">' +
        '<div class="modal-head">' +
          '<h2>' + esc(cfg.title || "") + "</h2>" +
          '<button class="modal-close" type="button" aria-label="닫기" data-close="1">✕</button>' +
        "</div>" +
        (cfg.sub ? '<p class="modal-sub">' + esc(cfg.sub) + "</p>" : "") +
        '<div class="modal-body"></div>' +
        (cfg.foot ? '<div class="modal-foot"></div>' : "") +
      "</div>";
    var body = $(".modal-body", wrap);
    if (typeof cfg.body === "string") body.innerHTML = cfg.body;
    else if (cfg.body) body.appendChild(cfg.body);
    if (cfg.foot) {
      var foot = $(".modal-foot", wrap);
      if (typeof cfg.foot === "string") foot.innerHTML = cfg.foot;
      else foot.appendChild(cfg.foot);
    }

    root.appendChild(wrap);
    root.classList.add("is-open");

    function close() {
      if (cfg.onClose) { try { cfg.onClose(); } catch (e) { console.error(e); } }
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      modalStack = modalStack.filter(function (m) { return m !== close; });
      if (!modalStack.length) root.classList.remove("is-open");
    }
    wrap.addEventListener("click", function (e) {
      var t = e.target;
      if (t && t.getAttribute && t.getAttribute("data-close")) close();
    });
    modalStack.push(close);
    if (cfg.onMount) cfg.onMount(wrap, close);
    return { el: wrap, close: close };
  }

  function closeAllModals() {
    modalStack.slice().forEach(function (fn) { fn(); });
  }

  /* ---------- 읽어주기 ---------- */
  var speaking = false;
  function speak(text, lang) {
    if (!("speechSynthesis" in window)) {
      toast("이 기기에서는 읽어주기를 쓸 수 없어요");
      return false;
    }
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang || "ko-KR";
      u.rate = lang === "en-US" ? 0.85 : 0.92;
      u.pitch = 1.12;
      var voices = window.speechSynthesis.getVoices() || [];
      var pick = voices.filter(function (v) { return v.lang && v.lang.replace("_", "-").indexOf(u.lang) === 0; })[0];
      if (pick) u.voice = pick;
      speaking = true;
      u.onend = function () { speaking = false; };
      u.onerror = function () { speaking = false; };
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) {
      speaking = false;
      return false;
    }
  }

  HD.ui = {
    $: $, $$: $$, esc: esc, pad2: pad2,
    clockParts: clockParts, dateKo: dateKo, timeLabel: timeLabel,
    spriteHtml: spriteHtml, spriteFail: spriteFail,
    toast: toast, confetti: confetti, sparkleAt: sparkleAt,
    modal: modal, closeAllModals: closeAllModals, speak: speak,
    isSpeaking: function () { return speaking; }
  };
})(window.HD);
