/* =========================================================
   data.js — 포켓몬 도감, 기본 설정, 퀴즈, 그림 조각
   ========================================================= */
window.HD = window.HD || {};
(function (HD) {
  "use strict";

  /* ---------- 포켓몬 도감 ---------- */
  // name: 화면에 보이는 이름, emoji: 스프라이트 실패 시 폴백
  HD.POKEDEX = [
    { id: 1,   name: "이상해씨", emoji: "🌱" },
    { id: 4,   name: "파이리",   emoji: "🔥" },
    { id: 7,   name: "꼬부기",   emoji: "💧" },
    { id: 25,  name: "피카츄",   emoji: "⚡" },
    { id: 39,  name: "푸린",     emoji: "🎤" },
    { id: 52,  name: "냐옹이",   emoji: "🐱" },
    { id: 54,  name: "고라파덕", emoji: "🦆" },
    { id: 58,  name: "가디",     emoji: "🐕" },
    { id: 63,  name: "캐이시",   emoji: "🥄" },
    { id: 77,  name: "포니타",   emoji: "🐎" },
    { id: 79,  name: "야돈",     emoji: "🐷" },
    { id: 92,  name: "고오스",   emoji: "👻" },
    { id: 95,  name: "롱스톤",   emoji: "🪨" },
    { id: 104, name: "탕구리",   emoji: "🦴" },
    { id: 113, name: "럭키",     emoji: "🥚" },
    { id: 131, name: "라프라스", emoji: "🐢" },
    { id: 133, name: "이브이",   emoji: "🐾" },
    { id: 143, name: "잠만보",   emoji: "😴" },
    { id: 147, name: "미뇽",     emoji: "🐍" },
    { id: 151, name: "뮤",       emoji: "✨" },
    { id: 175, name: "토게피",   emoji: "🐣" },
    { id: 183, name: "마릴",     emoji: "🐭" },
    { id: 187, name: "통통코",   emoji: "🍃" },
    { id: 194, name: "우파",     emoji: "🐸" },
    { id: 209, name: "블루",     emoji: "🐶" },
    { id: 231, name: "코코리",   emoji: "🐘" },
    { id: 246, name: "애버라스", emoji: "🪨" }
  ];
  HD.byId = function (id) {
    for (var i = 0; i < HD.POKEDEX.length; i++) {
      if (HD.POKEDEX[i].id === id) return HD.POKEDEX[i];
    }
    return { id: id, name: "포켓몬", emoji: "❔" };
  };

  HD.SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

  /* ---------- 기본 설정 ---------- */
  HD.DEFAULT_SETTINGS = {
    departure: "08:28",
    place: "울산 중구",
    lat: 35.569,
    lon: 129.332,
    sound: true,
    morningTasks: [
      { id: "wash",  label: "세수/양치", pokemonId: 7 },
      { id: "meal",  label: "밥먹기",    pokemonId: 1 },
      { id: "cloth", label: "옷입기",    pokemonId: 4 }
    ],
    eveningTasks: [
      { id: "tidy",   label: "정리하기" },
      { id: "wash2",  label: "세수/양치하기" },
      { id: "read",   label: "책 읽기" },
      { id: "bag",    label: "가방 챙기기" },
      { id: "study2", label: "공부하기" }
    ],
    study: [
      { id: "top",   name: "최상위사고력", color: "#2f6ff0", plot: "생각", stickerId: 133,
        note: "오늘 2쪽 · 규칙 찾기 놀이", emoji: "🔴🔵🔴🔵" },
      { id: "wonri", name: "원리셈",       color: "#7a5cf0", plot: "수",   stickerId: 175,
        note: "오늘 1장 · 1부터 10까지 세기", emoji: "1️⃣2️⃣3️⃣➕" },
      { id: "s1031", name: "1031",         color: "#d9792b", plot: "생각", stickerId: 54,
        note: "오늘 2쪽 · 모양 분류하기", emoji: "🔺⚪⬛" },
      { id: "plato", name: "플라토",       color: "#2fa74e", plot: "도형", stickerId: 7,
        note: "오늘 2쪽 · 도형 짝 맞추기", emoji: "🔺🟦⚪" },
      { id: "hanja", name: "한자",         color: "#c0392b", plot: "한자", stickerId: 4,
        note: "오늘 2자 · 日 月 火 水", emoji: "日月火水" }
    ],
    momNote: "저녁에 같이 맛있는 거 먹자 🍚",
    dadNote: "오늘도 하성 최고! 💪",
    cleanMinutes: 10,
    eggFirst: 3,
    eggNext: 5,
    timerMinutes: 25
  };

  /* ---------- 날씨 코드 ---------- */
  HD.WEATHER = {
    0:  { t: "맑음",        i: "☀️" },
    1:  { t: "대체로 맑음", i: "🌤️" },
    2:  { t: "구름 조금",   i: "⛅" },
    3:  { t: "흐림",        i: "☁️" },
    45: { t: "안개",        i: "🌫️" },
    48: { t: "안개",        i: "🌫️" },
    51: { t: "이슬비",      i: "🌦️" },
    53: { t: "이슬비",      i: "🌦️" },
    55: { t: "이슬비",      i: "🌦️" },
    56: { t: "어는 이슬비", i: "🌧️" },
    57: { t: "어는 이슬비", i: "🌧️" },
    61: { t: "약한 비",     i: "🌧️" },
    63: { t: "비",          i: "🌧️" },
    65: { t: "강한 비",     i: "🌧️" },
    66: { t: "어는 비",     i: "🌧️" },
    67: { t: "어는 비",     i: "🌧️" },
    71: { t: "약한 눈",     i: "🌨️" },
    73: { t: "눈",          i: "🌨️" },
    75: { t: "많은 눈",     i: "❄️" },
    77: { t: "눈날림",      i: "❄️" },
    80: { t: "소나기",      i: "🌦️" },
    81: { t: "소나기",      i: "🌦️" },
    82: { t: "센 소나기",   i: "⛈️" },
    85: { t: "눈 소나기",   i: "🌨️" },
    86: { t: "눈 소나기",   i: "🌨️" },
    95: { t: "천둥번개",    i: "⛈️" },
    96: { t: "천둥번개",    i: "⛈️" },
    99: { t: "천둥번개",    i: "⛈️" }
  };
  HD.weatherOf = function (code) {
    return HD.WEATHER[code] || { t: "알 수 없음", i: "🌡️" };
  };

  /* ---------- 지역 ---------- */
  HD.PLACES = [
    { name: "울산 중구", lat: 35.569, lon: 129.332 },
    { name: "울산 남구", lat: 35.538, lon: 129.330 },
    { name: "서울",      lat: 37.566, lon: 126.978 },
    { name: "부산",      lat: 35.179, lon: 129.075 },
    { name: "대구",      lat: 35.871, lon: 128.601 }
  ];

  /* ---------- 루틴 그림 (SVG 문자열) ---------- */
  HD.ART = {};

  // 세수/양치 — 이를 닦는 이 캐릭터
  HD.ART.teeth = function () {
    return '' +
    '<svg width="120" height="104" viewBox="0 0 120 104" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<ellipse cx="60" cy="94" rx="34" ry="6" fill="#e6eef6"/>' +
      '<path d="M30 16c10-8 50-8 60 0 8 6 9 20 4 34-3 9-3 20-6 28-2 6-10 7-12 0-2-8-2-16-5-16s-3 8-5 16c-2 7-10 6-12 0-3-8-3-19-6-28-5-14-4-28 4-34z" fill="#ffffff" stroke="#2c3444" stroke-width="2.4"/>' +
      '<circle cx="48" cy="40" r="4" fill="#2c3444"/><circle cx="72" cy="40" r="4" fill="#2c3444"/>' +
      '<path d="M52 52c4 5 12 5 16 0" stroke="#2c3444" stroke-width="2.6" stroke-linecap="round"/>' +
      '<circle cx="38" cy="50" r="4" fill="#ffb3c7" opacity=".8"/><circle cx="82" cy="50" r="4" fill="#ffb3c7" opacity=".8"/>' +
      '<g transform="rotate(28 92 62)"><rect x="84" y="26" width="9" height="34" rx="4" fill="#55b8f0" stroke="#2c3444" stroke-width="2.2"/><rect x="84.5" y="20" width="8" height="10" rx="4" fill="#ff8fb1" stroke="#2c3444" stroke-width="2.2"/><rect x="84" y="54" width="9" height="16" rx="4" fill="#ffffff" stroke="#2c3444" stroke-width="2.2"/></g>' +
      '<circle cx="26" cy="26" r="6" fill="#cfeaff" stroke="#8fc9ee" stroke-width="2"/>' +
      '<circle cx="18" cy="14" r="4" fill="#e7f6ff" stroke="#8fc9ee" stroke-width="1.8"/>' +
      '<path d="M104 14l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#ffd23f" stroke="#d9a400" stroke-width="1.4"/>' +
      '<path d="M20 62l1.4 3.4 3.4 1.4-3.4 1.4L20 71.6l-1.4-3.4-3.4-1.4 3.4-1.4z" fill="#a8e0ff" stroke="#7fc3e8" stroke-width="1.2"/>' +
    '</svg>';
  };

  // 밥먹기 — 밥그릇과 숟가락
  HD.ART.meal = function () {
    return '' +
    '<svg width="120" height="104" viewBox="0 0 120 104" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<ellipse cx="60" cy="94" rx="38" ry="6" fill="#f0e6d6"/>' +
      '<path d="M18 54h84c0 22-16 34-42 34S18 76 18 54z" fill="#ffffff" stroke="#2c3444" stroke-width="2.4"/>' +
      '<path d="M18 54h84" stroke="#2c3444" stroke-width="2.4"/>' +
      '<path d="M30 62c6 12 18 18 30 18s24-6 30-18" stroke="#ffd23f" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M34 52c2-14 12-22 26-22s24 8 26 22z" fill="#fffdf5" stroke="#2c3444" stroke-width="2.4"/>' +
      '<circle cx="52" cy="42" r="5" fill="#ff9d52"/><circle cx="70" cy="38" r="4" fill="#ff9d52"/>' +
      '<path d="M64 30c4-3 8-2 9 1" stroke="#2c3444" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M46 22c-3-4 3-6 0-10" stroke="#b9d9ee" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M58 18c-3-4 3-6 0-10" stroke="#b9d9ee" stroke-width="3" stroke-linecap="round"/>' +
      '<g transform="rotate(18 96 46)"><rect x="92" y="18" width="7" height="40" rx="3.5" fill="#ffd23f" stroke="#2c3444" stroke-width="2.2"/><ellipse cx="95.5" cy="16" rx="7" ry="9" fill="#ffd23f" stroke="#2c3444" stroke-width="2.2"/></g>' +
      '<path d="M104 66c2 6 6 8 6 8" stroke="#2c3444" stroke-width="2"/>' +
      '<circle cx="14" cy="40" r="3" fill="#ffd23f"/><circle cx="110" cy="34" r="3" fill="#a8e0ff"/>' +
    '</svg>';
  };

  // 옷입기 — 티셔츠와 바지
  HD.ART.clothes = function () {
    return '' +
    '<svg width="120" height="104" viewBox="0 0 120 104" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<ellipse cx="60" cy="96" rx="36" ry="5" fill="#e6eef6"/>' +
      '<path d="M40 22l-18 10 6 14 10-4v40c0 3 2 5 5 5h34c3 0 5-2 5-5V42l10 4 6-14-18-10c-4 6-10 8-20 8s-16-2-20-8z" fill="#ffcf3f" stroke="#2c3444" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M48 22c2 4 6 6 12 6s10-2 12-6" stroke="#2c3444" stroke-width="2.2"/>' +
      '<path d="M40 62h40" stroke="#e0a800" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M56 70l4 4 8-9" stroke="#2c3444" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M70 78h30" stroke="#2c3444" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M78 78v12M92 78v12" stroke="#2c3444" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M20 20l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#ffd23f" stroke="#d9a400" stroke-width="1.3"/>' +
      '<path d="M102 46l1.4 3.4 3.4 1.4-3.4 1.4-1.4 3.4-1.4-3.4-3.4-1.4 3.4-1.4z" fill="#a8e0ff" stroke="#7fc3e8" stroke-width="1.2"/>' +
    '</svg>';
  };

  HD.ART.byId = function (id) {
    if (id === "wash" || id === "wash2") return HD.ART.teeth();
    if (id === "meal") return HD.ART.meal();
    if (id === "cloth" || id === "bag") return HD.ART.clothes();
    return HD.ART.teeth();
  };

  // 포켓몬 알
  HD.ART.egg = function (size) {
    var s = size || 128;
    return '' +
    '<svg width="' + s + '" height="' + Math.round(s * 1.23) + '" viewBox="0 0 128 158" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M64 4c30 0 56 40 56 82 0 38-25 68-56 68S8 124 8 86C8 44 34 4 64 4z" fill="#fffdf8" stroke="#2c3444" stroke-width="3"/>' +
      '<ellipse cx="44" cy="52" rx="16" ry="13" fill="#d9f2dd"/>' +
      '<ellipse cx="82" cy="82" rx="19" ry="15" fill="#cfeaff"/>' +
      '<ellipse cx="50" cy="108" rx="15" ry="12" fill="#ffe3ec"/>' +
      '<ellipse cx="86" cy="34" rx="9" ry="7" fill="#fff4c9"/>' +
      '<ellipse cx="38" cy="30" rx="7" ry="10" fill="#ffffff" opacity=".9"/>' +
    '</svg>';
  };

  /* ---------- 공부 퀴즈 ---------- */
  HD.QUIZZES = {
    top: [
      { art: "🔴🔵🔴🔵", q: "다음에 올 색은 무엇일까요?", choices: ["🔵 파랑", "🔴 빨강", "🟡 노랑", "🟢 초록"], answer: 1,
        speak: "빨강, 파랑, 빨강, 파랑 하고 반복돼요. 다음엔 무슨 색일까요?" },
      { art: "1  2  3  4  ?", q: "숫자가 하나씩 커져요. ?에 들어갈 수는?", choices: ["4", "5", "6", "7"], answer: 1,
        speak: "하나, 둘, 셋, 넷 다음에는 몇 일까요?" },
      { art: "🍎🍌🍎🍌", q: "🍎 다음에 오는 것은?", choices: ["🍎", "🍌", "🍇", "🍓"], answer: 1,
        speak: "사과, 바나나, 사과, 바나나. 다음엔 무엇이 올까요?" },
      { art: "🐘 🐭 🐱", q: "가장 큰 동물은 누구일까요?", choices: ["🐭 쥐", "🐱 고양이", "🐘 코끼리", "🐰 토끼"], answer: 2,
        speak: "쥐, 고양이, 코끼리 중에서 가장 큰 동물은 무엇일까요?" },
      { art: "🔺🔺⬛🔺🔺⬛", q: "규칙을 찾아보세요. 다음은 무엇일까요?", choices: ["⬛", "🔺", "⚪", "⭐"], answer: 1,
        speak: "세모, 세모, 네모가 반복되고 있어요. 다음엔 무엇일까요?" }
    ],
    wonri: [
      { art: "🍓🍓🍓", q: "딸기가 몇 개 있을까요?", choices: ["2개", "3개", "4개", "5개"], answer: 1,
        speak: "딸기가 몇 개인지 세어 보세요." },
      { art: "2 + 1 = ?", q: "2 더하기 1은 얼마일까요?", choices: ["1", "2", "3", "4"], answer: 2,
        speak: "둘 더하기 하나는 얼마일까요?" },
      { art: "🍪🍪🍪🍪🍪 → 🍪🍪", q: "쿠키 5개 중에 2개를 먹었어요. 남은 쿠키는?", choices: ["2개", "3개", "4개", "5개"], answer: 1,
        speak: "쿠키 다섯 개 중에 두 개를 먹었어요. 몇 개가 남았을까요?" },
      { art: "1 2 3 4 5 ?", q: "5 다음에 오는 수는?", choices: ["4", "6", "7", "10"], answer: 1,
        speak: "하나부터 다섯까지 세었어요. 다음 수는 무엇일까요?" },
      { art: "🧸🧸🧸 + 🧸🧸", q: "곰인형 3개와 2개를 모았어요. 모두 몇 개?", choices: ["4개", "5개", "6개", "7개"], answer: 1,
        speak: "곰인형 세 개와 두 개를 합하면 모두 몇 개일까요?" }
    ],
    s1031: [
      { art: "⚪ 🔺 ⬛ ⭐", q: "동그라미를 골라 보세요.", choices: ["🔺", "⬛", "⚪", "⭐"], answer: 2,
        speak: "동그라미 모양을 찾아보세요." },
      { art: "🔺🔺⬛ 🔺🔺⬛ 🔺🔺", q: "규칙대로라면 다음은 무엇일까요?", choices: ["🔺", "⬛", "⚪", "🔶"], answer: 1,
        speak: "세모, 세모, 네모가 계속 반복돼요. 다음엔 무엇일까요?" },
      { art: "3 · 5 · 7 · 9", q: "5보다 큰 수를 모두 골라 보세요.", choices: ["3", "5", "7", "2"], answer: 2,
        speak: "오보다 큰 수는 무엇일까요?" },
      { art: "👟 ↔ 🧦", q: "짝이 맞는 것은 무엇일까요?", choices: ["👟 신발 – 🧦 양말", "🍎 사과 – 🚗 자동차", "🌞 해 – 🌙 달", "🐟 물고기 – 🪑 의자"], answer: 0,
        speak: "함께 쓰는 짝을 찾아보세요. 신발과 짝이 되는 것은 무엇일까요?" },
      { art: "🍎 🍎 🍌 🍎 🍎 🍌", q: "🍌 다음에 오는 것은?", choices: ["🍎", "🍌", "🍇", "🍓"], answer: 0,
        speak: "사과, 사과, 바나나가 반복돼요. 바나나 다음엔 무엇일까요?" }
    ],
    plato: [
      { art: "🔺 🔺 🔺", q: "세모가 몇 개 있을까요?", choices: ["2개", "3개", "4개", "5개"], answer: 1,
        speak: "세모가 몇 개인지 세어 보세요." },
      { art: "⬛ ← ⚪", q: "동그란 구멍에 쏙 들어갈 모양은?", choices: ["⬛ 네모", "🔺 세모", "⚪ 동그라미", "⭐ 별"], answer: 2,
        speak: "동그란 구멍에 들어갈 모양은 무엇일까요?" },
      { art: "⚪ → 🌙", q: "동그라미를 반으로 자르면 무엇이 될까요?", choices: ["🌙 반달", "⬛ 네모", "🔺 세모", "❤️ 하트"], answer: 0,
        speak: "동그라미를 반으로 자르면 어떤 모양이 될까요?" },
      { art: "⬛ ⬛ ⬛", q: "네모의 변은 몇 개일까요?", choices: ["3개", "4개", "5개", "6개"], answer: 1,
        speak: "네모에는 변이 몇 개 있을까요?" },
      { art: "🔺 🟦 ⚪ 🔺", q: "세모와 같은 모양을 골라 보세요.", choices: ["🟦", "⚪", "🔺", "🟥"], answer: 2,
        speak: "세모와 똑같은 모양을 찾아보세요." }
    ],
    hanja: [
      { art: "日", big: true, q: "이 한자는 무엇일까요?", choices: ["해 일", "달 월", "불 화", "나무 목"], answer: 0,
        speak: "해 일 자예요. 해 일." },
      { art: "月", big: true, q: "이 한자는 무엇일까요?", choices: ["해 일", "달 월", "물 수", "산 산"], answer: 1,
        speak: "달 월 자예요. 달 월." },
      { art: "火", big: true, q: "이 한자는 무엇일까요?", choices: ["불 화", "물 수", "흙 토", "사람 인"], answer: 0,
        speak: "불 화 자예요. 불 화." },
      { art: "水", big: true, q: "이 한자는 무엇일까요?", choices: ["나무 목", "불 화", "물 수", "달 월"], answer: 2,
        speak: "물 수 자예요. 물 수." },
      { art: "木", big: true, q: "이 한자는 무엇일까요?", choices: ["나무 목", "산 산", "큰 대", "작을 소"], answer: 0,
        speak: "나무 목 자예요. 나무 목." }
    ]
  };

  /* ---------- 영어 낱말 (읽어주기 예시) ---------- */
  HD.ENGLISH_WORDS = [
    { emoji: "🍎", ko: "사과", en: "apple" },
    { emoji: "🐶", ko: "강아지", en: "dog" },
    { emoji: "☀️", ko: "해", en: "sun" },
    { emoji: "⭐", ko: "별", en: "star" },
    { emoji: "🐟", ko: "물고기", en: "fish" }
  ];

  /* ---------- 스티커 사유 라벨 ---------- */
  HD.STICKER_REASONS = {
    morning: "아침 할 일을 다 했어요",
    evening: "저녁 할 일을 다 했어요",
    clean: "정리 타이머를 끝냈어요",
    study: "공부를 다 했어요",
    quiz: "연습 퀴즈를 다 풀었어요",
    test: "부모님이 선물했어요"
  };

})(window.HD);
