/* Sparkling Dreams Shinkansen — date patterns and encounter calculator. */
(function (root) {
  "use strict";

  const timetable = root.SHINKANSEN_TIMETABLE || { trains: [] };
  const route = typeof ROUTE !== "undefined" ? ROUTE : root.ROUTE;
  const routeStations = (route?.refStations || []).slice().sort((a, b) => a.min - b.min);
  const trains = Array.isArray(timetable.trains) ? timetable.trains : [];
  const timetableStationNames = new Map(
    (Array.isArray(timetable.stations) ? timetable.stations : [])
      .filter((station) => station && station.id)
      .map((station) => [station.id, { ja: station.ja, en: station.en || station.ja }])
  );

  const stationName = (id, language = "ja") => timetableStationNames.get(id)?.[language] || routeStations.find((station) => station.id === id)?.[language] || routeStations.find((station) => station.id === id)?.ja || id;
  const trainStaticLine = (train, language = "ja") => {
    const from = train.originStation || (train.direction === "west" ? "Tokyo" : "Shin-Osaka");
    const to = train.destination || (train.direction === "west" ? "Shin-Osaka" : "Tokyo");
    return `${train.type} ${train.number} · ${stationName(from, language)} ${train.times?.[from] || "—"} → ${stationName(to, language)} ${train.times?.[to] || "—"}`;
  };

  const PATTERN_SERVICES = {
    A: [
      { type: "Hikari", number: 636, direction: "east" },
      { type: "Kodama", number: 815, direction: "west" },
      { type: "Kodama", number: 836, direction: "east" },
      { type: "Hikari", number: 659, direction: "west" },
    ],
    B: [
      { type: "Hikari", number: 636, direction: "east" },
      { type: "Kodama", number: 815, direction: "west" },
    ],
    C: [
      { type: "Hikari", number: 636, direction: "east" },
      { type: "Hikari", number: 659, direction: "west" },
    ],
  };

  const DATE_PATTERNS = {};
  const addMonthPatterns = (month, patterns) => patterns.forEach((pattern, index) => {
    DATE_PATTERNS[`2026-${month}-${String(index + 1).padStart(2, "0")}`] = pattern;
  });
  addMonthPatterns("08", [
    "B", "A", "C", "B", "B", "B", "A", "A", "A", "A", "A", "pending", "A", "A", "A", "A", "A", "A", "pending", "B", "A", "A", "A", "C", "pending", "pending", "pending", "A", "A", "A", "B",
  ]);
  addMonthPatterns("09", [
    "B", "pending", "B", "A", "A", "A", "B", "C", "pending", "B", "A", "A", "A", "B", "B", "pending", "A", "A", "A", "A", "A", "A", "pending", "B", "A", "A", "A", "C", "pending", "pending",
  ]);

  const START_DATE = "2026-06-19";
  const END_DATE = "2027-03-15";

  function parseClock(value) {
    const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  }

  function formatClock(minutes) {
    const rounded = Math.round(minutes);
    const hour = ((Math.floor(rounded / 60) % 24) + 24) % 24;
    const minute = ((rounded % 60) + 60) % 60;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  function serviceKey(service) {
    if (!service) return "";
    return `${service.type}-${service.number}-${service.direction}`;
  }

  function findTrain(service) {
    return trains.find((train) => train.type === service.type && train.number === service.number && train.direction === service.direction) || null;
  }

  function getScheduleState(date) {
    const dateKey = String(date || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return { status: "invalid", date: dateKey };
    if (dateKey < START_DATE || dateKey > END_DATE) return { status: "outside-range", date: dateKey };
    const pattern = DATE_PATTERNS[dateKey];
    if (!pattern || pattern === "pending") return { status: "pending", date: dateKey };
    return { status: "known", date: dateKey, pattern };
  }

  function routeSegment(position) {
    if (!routeStations.length) return { from: "沿線", to: "沿線" };
    const upperIndex = routeStations.findIndex((station) => station.min >= position);
    if (upperIndex <= 0) {
      const station = routeStations[Math.max(0, upperIndex)];
      return { from: station.ja, to: station.ja, fromEn: station.en || station.ja, toEn: station.en || station.ja };
    }
    if (upperIndex === -1) {
      const station = routeStations[routeStations.length - 1];
      return { from: station.ja, to: station.ja, fromEn: station.en || station.ja, toEn: station.en || station.ja };
    }
    return { from: routeStations[upperIndex - 1].ja, to: routeStations[upperIndex].ja, fromEn: routeStations[upperIndex - 1].en || routeStations[upperIndex - 1].ja, toEn: routeStations[upperIndex].en || routeStations[upperIndex].ja };
  }

  /* 選んだ列車（乗車駅から先）と特別列車が、時刻と位置の上で交わる点。
     停車時間を含めた位置の動き（train-select.js の positionAt、公式の着発）で比べるので、
     こだま・ひかりの停車中のすれ違いも拾える。反対方向の2列車なので交点は高々1つずつ。 */
  function stopsFrom(train, boardId) {
    const MTS = root.MADO_TRAIN_SELECT;
    if (!MTS || !train) return [];
    const all = MTS.tokaidoStops(route, train);
    const index = boardId ? all.findIndex((stop) => stop.id === boardId) : 0;
    return index >= 0 ? all.slice(index) : [];
  }

  function intersections(selectedTrain, specialTrain, boardId) {
    const MTS = root.MADO_TRAIN_SELECT;
    if (!MTS || !selectedTrain || !specialTrain) return [];
    const selectedStops = stopsFrom(selectedTrain, boardId);
    const specialStops = stopsFrom(specialTrain, null);
    if (selectedStops.length < 2 || specialStops.length < 2) return [];
    const startOf = (stops) => stops[0].clock;
    const endOf = (stops) => { const last = stops[stops.length - 1]; return last.arr != null ? last.arr : last.clock; };
    const start = Math.max(startOf(selectedStops), startOf(specialStops));
    const end = Math.min(endOf(selectedStops), endOf(specialStops));
    if (start >= end) return [];
    const gap = (clock) => {
      const a = MTS.positionAt(selectedStops, clock);
      const b = MTS.positionAt(specialStops, clock);
      return a == null || b == null ? null : a - b;
    };
    const STEP = 0.25; // 15秒刻みで符号の変化を探し、二分法で1秒程度まで詰める
    const results = [];
    let previousClock = start;
    let previousGap = gap(start);
    for (let clock = start + STEP; clock <= end + 1e-9; clock += STEP) {
      const current = gap(clock);
      if (previousGap != null && current != null && (previousGap === 0 || previousGap * current < 0)) {
        let lo = previousClock;
        let hi = clock;
        let loGap = previousGap;
        for (let k = 0; k < 20 && hi - lo > 1 / 120; k += 1) {
          const mid = (lo + hi) / 2;
          const midGap = gap(mid);
          if (midGap == null) break;
          if (loGap * midGap <= 0) hi = mid;
          else { lo = mid; loGap = midGap; }
        }
        const time = previousGap === 0 ? previousClock : (lo + hi) / 2;
        const position = MTS.positionAt(selectedStops, time);
        if (position != null && !results.some((result) => Math.abs(result.time - time) < 1)) {
          results.push({ position, time, clock: formatClock(time), segment: routeSegment(position), specialTrain });
        }
      }
      previousClock = clock;
      previousGap = current;
    }
    return results;
  }

  /* 乗車日・方向・選んだ列車（serviceKey）・乗車駅から、すれ違いを計算する。
     乗車駅を省くと始発駅から（その方向の東海道区間の端から）乗る扱い。 */
  function calculate(date, direction, selectedKey, boardId) {
    const schedule = getScheduleState(date);
    if (schedule.status !== "known") return { ...schedule, direction, selectedKey };
    const selectedTrain = trains.find((train) => serviceKey(train) === selectedKey && train.direction === direction) || null;
    if (!selectedTrain) return { ...schedule, status: "invalid-train", direction, selectedKey };
    const specialServices = (PATTERN_SERVICES[schedule.pattern] || []).map(findTrain).filter(Boolean);
    const selfMatch = specialServices.find((train) => serviceKey(train) === serviceKey(selectedTrain));
    if (selfMatch) {
      return { ...schedule, status: "self-match", direction, selectedTrain, specialServices, matches: [] };
    }
    const oppositeServices = specialServices.filter((train) => train.direction !== selectedTrain.direction);
    const matches = oppositeServices.flatMap((train) => intersections(selectedTrain, train, boardId)).sort((a, b) => a.time - b.time);
    return { ...schedule, status: matches.length ? "encounter" : "no-encounter", direction, boardId, selectedTrain, specialServices, matches };
  }

  const api = {
    START_DATE,
    END_DATE,
    PATTERN_SERVICES,
    DATE_PATTERNS,
    findTrain,
    getScheduleState,
    serviceKey,
    intersections,
    calculate,
    formatClock,
    trainStaticLine,
  };
  root.SPARKLING_DREAMS_CALCULATOR = api;
  if (typeof document === "undefined") return;

  const $ = (selector) => document.querySelector(selector);
  const uiLanguage = document.documentElement.lang === "en" ? "en" : "ja";
  const escapeHTML = (value) => String(value ?? "").replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
  const directionName = (direction) => direction === "west" ? "西向き（東京 → 新大阪）" : "東向き（新大阪 → 東京）";
  const dateToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };
  // 列車選択の候補と同じ表記（日本語は「のぞみ116」）
  const TRAIN_NAMES = { Nozomi: "のぞみ", Hikari: "ひかり", Kodama: "こだま" };
  const trainName = (train) => uiLanguage === "ja" ? `${TRAIN_NAMES[train.type] || train.type}${train.number}` : `${train.type} ${train.number}`;

  function renderPatternLists() {
    document.querySelectorAll("[data-pattern-list]").forEach((list) => {
      const pattern = list.dataset.patternList;
      const services = (PATTERN_SERVICES[pattern] || []).map(findTrain).filter(Boolean);
      if (!services.length) return;
      list.innerHTML = services.map((train) => `<li><strong>${escapeHTML(trainName(train))}</strong><span>${escapeHTML(trainStaticLine(train, uiLanguage))}</span></li>`).join("");
    });
  }

  function trackCalculation(result) {
    if (typeof root.gtag !== "function") return;
    root.gtag("event", "sparkling_dreams_calculation", {
      page_context: "sparkling_dreams",
      date: result.date || "",
      pattern: result.pattern || "unknown",
      selected_train: result.selectedTrain ? `${result.selectedTrain.type} ${result.selectedTrain.number}` : "",
      direction: result.direction || "",
      result_status: result.status || "unknown",
      encounter_count: String(result.matches?.length || 0),
    });
  }

  function renderEnglishResult(result, resultBox) {
    resultBox.classList.remove("is-success", "is-note", "is-empty");
    if (result.status === "outside-range") {
      resultBox.classList.add("is-empty");
      resultBox.innerHTML = `<h3>That date is outside the operating period</h3><p>${escapeHTML(result.date)} is outside the published operating period, June 19, 2026 to March 15, 2027. Please check official information for the latest dates.</p>`;
      return;
    }
    if (result.status === "pending") {
      resultBox.classList.add("is-note");
      resultBox.innerHTML = `<h3>The pattern for this date is not confirmed</h3><p>The operating pattern for ${escapeHTML(result.date)} has not been published yet. Please check the official schedule when it is available.</p>`;
      return;
    }
    if (result.status === "invalid" || result.status === "invalid-train") {
      resultBox.classList.add("is-empty");
      resultBox.innerHTML = "<h3>Please choose a date and train</h3><p>Check your date and direction, then try again.</p>";
      return;
    }
    const selectedName = trainName(result.selectedTrain);
    const scheduleName = `Pattern ${result.pattern}`;
    if (result.status === "self-match") {
      resultBox.classList.add("is-note");
      resultBox.innerHTML = `<h3>Your selected train is the special train</h3><p>${escapeHTML(selectedName)} is part of ${escapeHTML(scheduleName)} on ${escapeHTML(result.date)}. It is the Sparkling Dreams Shinkansen itself, so there is no passing encounter to estimate.</p>`;
      trackCalculation(result);
      return;
    }
    if (result.status === "no-encounter") {
      resultBox.classList.add("is-note");
      resultBox.innerHTML = `<h3>No likely passing encounter was found</h3><p>${escapeHTML(selectedName)} and the opposite-direction special train in ${escapeHTML(scheduleName)} do not appear to cross within the calculated route. Please still check official information, as the plan can change.</p>`;
      trackCalculation(result);
      return;
    }
    const watchSide = result.direction === "west" ? "E-seat side" : "A-seat side";
    const direction = result.direction === "west" ? "Westbound (Tokyo → Shin-Osaka)" : "Eastbound (Shin-Osaka → Tokyo)";
    const rows = result.matches.map((match) => `<li><strong>Around ${escapeHTML(match.clock)}</strong><span>${escapeHTML(trainName(match.specialTrain))} between ${escapeHTML(match.segment.fromEn || match.segment.from)} and ${escapeHTML(match.segment.toEn || match.segment.to)}</span></li>`).join("");
    resultBox.classList.add("is-success");
    resultBox.innerHTML = `<h3>Likely passing estimate</h3><p class="sd-result-lead">Your ${escapeHTML(direction)} ${escapeHTML(selectedName)} may pass the special train at the following time and place on ${escapeHTML(result.date)} (${escapeHTML(scheduleName)}).</p><ul class="sd-result-list">${rows}</ul><p class="sd-seat-note"><strong>Watch from the ${escapeHTML(watchSide)}</strong> and start looking out about ±5 minutes early. Station stops, delays, speed, and operating changes can shift the actual moment.</p>`;
    trackCalculation(result);
  }

  function renderResult(result) {
    const resultBox = $("#sdResult");
    if (!resultBox) return;
    if (uiLanguage === "en") {
      renderEnglishResult(result, resultBox);
      return;
    }
    resultBox.classList.remove("is-success", "is-note", "is-empty");
    if (result.status === "outside-range") {
      resultBox.classList.add("is-empty");
      resultBox.innerHTML = `<h3>対象期間の外です</h3><p>${escapeHTML(result.date)}は運転期間（2026-06-19〜2027年3月ごろ）の外です。公式情報で最新の運転日をご確認ください。</p>`;
      return;
    }
    if (result.status === "pending") {
      resultBox.classList.add("is-note");
      resultBox.innerHTML = `<h3>この日の運転パターンは未確定です</h3><p>${escapeHTML(result.date)}の運転予定はまだ確定していません。推測で補わず、公式スケジュールをご確認ください。</p>`;
      return;
    }
    if (result.status === "invalid" || result.status === "invalid-train") {
      resultBox.classList.add("is-empty");
      resultBox.innerHTML = "<h3>日付と列車を選んでください</h3><p>日付・方向・列車を確認してから計算してください。</p>";
      return;
    }
    const selectedName = trainName(result.selectedTrain);
    const scheduleName = `パターン${result.pattern}`;
    if (result.status === "self-match") {
      resultBox.classList.add("is-note");
      resultBox.innerHTML = `<h3>選んだ列車が特別列車です</h3><p>${escapeHTML(selectedName)}は、${escapeHTML(result.date)}の${escapeHTML(scheduleName)}で運転予定の特別列車です。すれ違い時刻ではなく、この列車そのものを楽しむ日です。</p>`;
      trackCalculation(result);
      return;
    }
    if (result.status === "no-encounter") {
      resultBox.classList.add("is-note");
      resultBox.innerHTML = `<h3>区間内のすれ違い候補はありません</h3><p>${escapeHTML(selectedName)}と${escapeHTML(scheduleName)}の反対方向の特別列車は、計算できる区間では交差しません。駅停車や運転変更の影響もあるため、公式情報を優先してください。</p>`;
      trackCalculation(result);
      return;
    }
    const watchSide = result.direction === "west" ? "E席側" : "A席側";
    const rows = result.matches.map((match) => `<li><strong>${escapeHTML(match.clock)}ごろ</strong><span>${escapeHTML(trainName(match.specialTrain))}と、${escapeHTML(match.segment.from)}〜${escapeHTML(match.segment.to)}付近</span></li>`).join("");
    resultBox.classList.add("is-success");
    resultBox.innerHTML = `<h3>すれ違いの目安</h3><p class="sd-result-lead">${escapeHTML(directionName(result.direction))}の${escapeHTML(selectedName)}なら、${escapeHTML(result.date)}の${escapeHTML(scheduleName)}と次の場所で交差する可能性があります。</p><ul class="sd-result-list">${rows}</ul><p class="sd-seat-note"><strong>${escapeHTML(watchSide)}</strong>を目安に、時計の前後${escapeHTML("±5分") }ほど窓の外を見てください。駅・線路の運用、停車や速度、当日の変更で前後することがあります。</p>`;
    trackCalculation(result);
  }

  function initEmbedLoading() {
    if (typeof document === "undefined" || typeof document.querySelectorAll !== "function") return;
    const groups = document.querySelector(".sd-video-groups");
    const stages = groups ? Array.from(groups.querySelectorAll(".sd-x-embed")) : [];
    if (!groups || !stages.length) return;
    const reveal = () => {
      stages.forEach((stage) => {
        stage.classList.remove("is-loading");
        stage.classList.toggle("has-widget", !!stage.querySelector("twitter-widget, iframe"));
        stage.setAttribute("aria-busy", "false");
      });
    };
    const loadWidgets = () => {
      if (root.__MADO_X_WIDGETS_LOADED) {
        reveal();
        return;
      }
      root.__MADO_X_WIDGETS_LOADED = true;
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://platform.twitter.com/widgets.js";
      script.charset = "utf-8";
      script.onload = () => {
        const widgets = root.twttr && root.twttr.widgets;
        if (widgets && typeof widgets.load === "function") widgets.load(groups);
        var observer = new MutationObserver(function () {
          stages.forEach(function (stage) {
            if (stage.querySelector("twitter-widget, iframe")) { stage.classList.add("has-widget"); stage.classList.remove("is-loading"); stage.setAttribute("aria-busy", "false"); }
          });
        });
        stages.forEach(function (stage) { observer.observe(stage, { childList: true, subtree: true }); });
        root.setTimeout(function () { observer.disconnect(); reveal(); }, 5000);
      };
      script.onerror = reveal;
      document.head.appendChild(script);
    };
    stages.forEach((stage) => {
      stage.classList.add("is-loading");
      stage.setAttribute("aria-busy", "true");
    });
    if (typeof root.IntersectionObserver !== "function") {
      loadWidgets();
      return;
    }
    const observer = new root.IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0)) {
        observer.disconnect();
        loadWidgets();
      }
    }, { rootMargin: "640px 0px" });
    observer.observe(groups);
  }
  /* 乗車日と、列車選択ページと同じ列車選択（train-picker.js）。列車を選ぶとすぐ計算する */
  function init() {
    const dateInput = $("#sdDate");
    const pickerRoot = $("[data-train-picker]");
    if (!dateInput || !pickerRoot || !root.MADO_TRAIN_PICKER) return;
    dateInput.value = dateToday();
    renderPatternLists();
    let picked = null;
    const resultBox = $("#sdResult");
    const placeholder = resultBox ? resultBox.innerHTML : "";
    const reset = () => {
      picked = null;
      if (!resultBox) return;
      resultBox.classList.remove("is-success", "is-note");
      resultBox.classList.add("is-empty");
      resultBox.innerHTML = placeholder;
    };
    const run = () => {
      if (!picked) return;
      renderResult(calculate(dateInput.value, picked.tr.direction, serviceKey(picked.tr), picked.boardId));
    };
    root.MADO_TRAIN_PICKER.mount(pickerRoot, {
      lang: uiLanguage,
      route,
      timetable,
      onChange: reset,
      onSelect: ({ tr }, state) => {
        picked = { tr, boardId: state.boardId };
        run();
      },
    });
    dateInput.addEventListener("change", run);
  }
  initEmbedLoading();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}(typeof window !== "undefined" ? window : globalThis));
