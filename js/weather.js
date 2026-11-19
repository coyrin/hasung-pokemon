/* =========================================================
   weather.js — Open-Meteo 날씨 + 미세먼지
   ========================================================= */
(function (HD) {
  "use strict";

  var cache = null;       // { key, at, data }
  var loading = false;
  var error = null;
  var host = null;
  var TTL = 15 * 60 * 1000;

  function gradeOf(pm10, pm25) {
    function pm10Grade(v) {
      if (v == null || isNaN(v)) return null;
      if (v <= 30) return 0;
      if (v <= 80) return 1;
      if (v <= 150) return 2;
      return 3;
    }
    function pm25Grade(v) {
      if (v == null || isNaN(v)) return null;
      if (v <= 15) return 0;
      if (v <= 35) return 1;
      if (v <= 75) return 2;
      return 3;
    }
    var a = pm10Grade(pm10), b = pm25Grade(pm25);
    var vals = [a, b].filter(function (x) { return x !== null; });
    if (!vals.length) return null;
    var worst = Math.max.apply(null, vals);
    return [
      { label: "좋음", cls: "good", face: "😊" },
      { label: "보통", cls: "normal", face: "🙂" },
      { label: "나쁨", cls: "bad", face: "😷" },
      { label: "매우나쁨", cls: "verybad", face: "🤢" }
    ][worst];
  }

  function makeTip(cur, hourly, air) {
    var bits = [];
    var rainMax = null;
    (hourly || []).forEach(function (h) {
      if (h.hour >= 6 && h.hour <= 21 && (rainMax === null || h.rain > rainMax.rain)) rainMax = h;
    });
    if (rainMax && rainMax.rain >= 50) {
      bits.push(rainMax.hour + "시쯤 비 " + Math.round(rainMax.rain) + "% → 우산 챙기기");
    } else if (rainMax && rainMax.rain >= 30) {
      bits.push("비 " + Math.round(rainMax.rain) + "% → 작은 우산 챙기기");
    } else {
      bits.push("비 소식은 거의 없어요");
    }
    var t = cur.temp;
    if (t <= 3) bits.push("아침 " + Math.round(t) + "° 많이 추워요 — 패딩·목도리");
    else if (t <= 9) bits.push("아침 " + Math.round(t) + "° 쌀쌀 — 겉옷 챙기기");
    else if (t <= 16) bits.push("아침 " + Math.round(t) + "° 선선 — 가벼운 겉옷");
    else if (t <= 24) bits.push("아침 " + Math.round(t) + "° 딱 좋아요");
    else bits.push("아침 " + Math.round(t) + "° 더워요 — 시원한 옷");
    if (air && air.grade && air.grade.cls !== "good" && air.grade.cls !== "normal") {
      bits.push("미세먼지 " + air.grade.label + " — 마스크 챙기기");
    }
    return bits.join(" · ");
  }

  function fetchJson(url, ms) {
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms || 8000);
    return fetch(url, ctrl ? { signal: ctrl.signal, cache: "no-store" } : { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .finally(function () { clearTimeout(timer); });
  }

  function currentPlaceKey() {
    var s = HD.store.settings();
    return [s.lat, s.lon].join(",");
  }

  function load(force) {
    var s = HD.store.settings();
    var key = currentPlaceKey();
    if (!force && cache && cache.key === key && Date.now() - cache.at < TTL) return Promise.resolve(cache.data);
    if (loading) return Promise.resolve(cache ? cache.data : null);

    loading = true;
    error = null;
    render();

    var base = "https://api.open-meteo.com/v1/forecast?latitude=" + encodeURIComponent(s.lat) +
      "&longitude=" + encodeURIComponent(s.lon) +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code" +
      "&hourly=temperature_2m,precipitation_probability,weather_code" +
      "&daily=temperature_2m_max,temperature_2m_min" +
      "&timezone=Asia%2FSeoul&forecast_days=2&wind_speed_unit=ms";
    var airUrl = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=" + encodeURIComponent(s.lat) +
      "&longitude=" + encodeURIComponent(s.lon) + "&current=pm10,pm2_5&timezone=Asia%2FSeoul";

    var pMain = fetchJson(base);
    var pAir = fetchJson(airUrl).catch(function () { return null; });

    return Promise.all([pMain, pAir]).then(function (res) {
      var forecast = res[0];
      var airRaw = res[1];
      var cur = forecast.current || {};
      var daily = forecast.daily || {};
      var h = forecast.hourly || {};

      var now = new Date();
      var todayStr = HD.store.todayStr(now);
      var times = h.time || [];
      var wanted = [8, 12, 16, 20];
      var hourly = wanted.map(function (hr) {
        var iso = todayStr + "T" + (hr < 10 ? "0" + hr : hr) + ":00";
        var idx = times.indexOf(iso);
        if (idx < 0) {
          // 시간대 정보가 없으면 가장 가까운 값
          idx = times.findIndex(function (t) { return t.indexOf(todayStr + "T") === 0 && Number(t.slice(11, 13)) >= hr; });
        }
        var temp = idx >= 0 && h.temperature_2m ? h.temperature_2m[idx] : null;
        var rain = idx >= 0 && h.precipitation_probability ? h.precipitation_probability[idx] : null;
        var code = idx >= 0 && h.weather_code ? h.weather_code[idx] : (cur.weather_code || 0);
        return {
          hour: hr,
          temp: temp == null ? null : Number(temp),
          rain: rain == null ? 0 : Number(rain),
          code: code,
          icon: HD.weatherOf(code).i
        };
      });

      var air = null;
      if (airRaw && airRaw.current) {
        var pm10 = airRaw.current.pm10;
        var pm25 = airRaw.current.pm2_5;
        air = {
          pm10: pm10 == null ? null : Math.round(pm10),
          pm25: pm25 == null ? null : Math.round(pm25),
          grade: gradeOf(pm10, pm25)
        };
      }

      var w = HD.weatherOf(cur.weather_code != null ? cur.weather_code : 0);
      var data = {
        temp: cur.temperature_2m == null ? null : Number(cur.temperature_2m),
        feels: cur.apparent_temperature == null ? null : Number(cur.apparent_temperature),
        rh: cur.relative_humidity_2m == null ? null : Math.round(cur.relative_humidity_2m),
        desc: w.t,
        icon: w.i,
        code: cur.weather_code,
        min: daily.temperature_2m_min && daily.temperature_2m_min[0] != null ? Math.round(daily.temperature_2m_min[0]) : null,
        max: daily.temperature_2m_max && daily.temperature_2m_max[0] != null ? Math.round(daily.temperature_2m_max[0]) : null,
        hourly: hourly,
        air: air,
        place: s.place,
        at: Date.now()
      };
      data.tip = makeTip({ temp: data.temp == null ? 15 : data.temp }, hourly, air);
      cache = { key: key, at: Date.now(), data: data };
      loading = false;
      error = null;
      render();
      return data;
    }).catch(function (e) {
      loading = false;
      error = e && e.name === "AbortError" ? "시간이 오래 걸려요" : "인터넷 연결을 확인해 주세요";
      render();
      return null;
    });
  }

  function weatherBodyHtml(data) {
    var air = data.air;
    var badge = air && air.grade
      ? '<div class="air-badge ' + air.grade.cls + '"><span class="face">' + air.grade.face + '</span>미세먼지<span class="grade">' + air.grade.label + "</span></div>"
      : '<div class="air-badge"><span class="face">🌫️</span>미세먼지<span class="grade">-</span></div>';
    var hours = data.hourly.map(function (h) {
      return '<div class="hour"><div class="h-time">' + h.hour + '시</div>' +
        '<div class="h-ico">' + h.icon + "</div>" +
        '<div class="h-temp">' + (h.temp == null ? "-" : Math.round(h.temp) + "°") + "</div>" +
        '<div class="h-rain">비 ' + Math.round(h.rain || 0) + "%</div></div>";
    }).join("");

    return '' +
      '<div class="weather-top">' +
        badge +
        '<div class="weather-main">' +
          '<span class="weather-icon">' + data.icon + "</span>" +
          "<div>" +
            '<div class="weather-temp">' + (data.temp == null ? "-" : Math.round(data.temp)) + "°</div>" +
            '<div class="weather-desc">' + HD.ui.esc(data.desc) + "</div>" +
          "</div>" +
        "</div>" +
        '<div class="weather-meta">' +
          "<div>최고 <b>" + (data.max == null ? "-" : data.max + "°") + "</b> · 최저 <b>" + (data.min == null ? "-" : data.min + "°") + "</b></div>" +
          "<div>습도 <b>" + (data.rh == null ? "-" : data.rh + "%") + "</b></div>" +
          "<div>미세 <b>" + (air && air.pm10 != null ? air.pm10 : "-") + "</b> · 초미세 <b>" + (air && air.pm25 != null ? air.pm25 : "-") + "</b> ㎍</div>" +
        "</div>" +
      "</div>" +
      '<div class="hourly">' + hours + "</div>" +
      '<div class="weather-tip"><span>💡</span><span>' + HD.ui.esc(data.tip) + " · " + HD.ui.esc(data.place) + "</span></div>";
  }

  function render() {
    if (!host || !document.body.contains(host)) return;
    if (loading && !cache) {
      host.innerHTML = '<div class="weather-loading"><div style="font-size:26px">🌤️</div><div>오늘 날씨를 불러오는 중…</div></div>';
      return;
    }
    if (error && !cache) {
      host.innerHTML = '<div class="weather-error"><div>날씨를 불러오지 못했어요</div><div class="tiny">' +
        HD.ui.esc(error) + '</div><button class="btn small ghost" type="button" onclick="HD.weather.reload()">다시 시도</button></div>';
      return;
    }
    if (cache) {
      host.innerHTML = weatherBodyHtml(cache.data);
      return;
    }
    host.innerHTML = '<div class="weather-loading"><div style="font-size:26px">🌤️</div><div>날씨를 준비하고 있어요</div></div>';
  }

  HD.weather = {
    init: function (el, force) {
      host = el;
      render();
      load(force);
    },
    reload: function () { load(true); },
    get: function () { return cache ? cache.data : null; },
    render: render,
    gradeOf: gradeOf,
    makeTip: makeTip
  };
})(window.HD);
