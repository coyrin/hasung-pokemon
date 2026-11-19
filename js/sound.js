/* =========================================================
   sound.js — Web Audio 효과음 (부모 설정에서 끌 수 있음)
   ========================================================= */
(function (HD) {
  "use strict";

  var ctx = null;

  function enabled() {
    var s = HD.store && HD.store.settings ? HD.store.settings() : null;
    return !s || s.sound !== false;
  }

  function audio() {
    if (!enabled()) return null;
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    if (ctx.state === "suspended" && ctx.resume) ctx.resume();
    return ctx;
  }

  function tone(freq, dur, delay, type, vol) {
    var c = audio();
    if (!c) return;
    var t0 = c.currentTime + (delay || 0);
    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.16, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  var api = {
    click: function () { tone(680, 0.07, 0, "triangle", 0.1); },
    pop: function () { tone(520, 0.08, 0, "sine", 0.14); tone(880, 0.1, 0.06, "sine", 0.1); },
    correct: function () {
      tone(659, 0.13, 0, "triangle", 0.14);
      tone(880, 0.16, 0.11, "triangle", 0.14);
    },
    wrong: function () {
      tone(300, 0.16, 0, "sine", 0.12);
      tone(220, 0.2, 0.12, "sine", 0.1);
    },
    sticker: function () {
      var notes = [523, 659, 784, 1047, 1319];
      notes.forEach(function (f, i) { tone(f, 0.16, i * 0.085, "triangle", 0.13); });
      tone(1568, 0.3, 0.44, "sine", 0.09);
    },
    timerEnd: function () {
      [0, 0.35, 0.7].forEach(function (d) {
        tone(880, 0.18, d, "square", 0.1);
        tone(1175, 0.18, d + 0.12, "square", 0.08);
      });
    },
    tick: function () { tone(1000, 0.03, 0, "sine", 0.045); },
    unlock: function () { audio(); }
  };

  HD.sound = api;
})(window.HD);
