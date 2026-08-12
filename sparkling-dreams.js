/* Sparkling Dreams Shinkansen — date patterns and encounter calculator. */
(function (root) {
  "use strict";

  const timetable = root.SHINKANSEN_TIMETABLE || { trains: [] };
  const route = typeof ROUTE !== "undefined" ? ROUTE : root.ROUTE;
  const routeStations = (route?.refStations || []).slice().sort((a, b) => a.min - b.min);
  const routeStationIds = new Set(routeStations.map((station) => station.id));
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

  function getWindowTrains(direction) {
    const seen = new Set();
    return trains
      .filter((train) => train.direction === direction)
      .filter((train) => Object.keys(train.times || {}).some((stationId) => routeStationIds.has(stationId)))
      .filter((train) => {
        const key = serviceKey(train);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        const aTime = parseClock(a.times?.[a.originStation]) ?? parseClock(a.times?.Tokyo) ?? parseClock(a.times?.["Shin-Osaka"]) ?? 9999;
        const bTime = parseClock(b.times?.[b.originStation]) ?? parseClock(b.times?.Tokyo) ?? parseClock(b.times?.["Shin-Osaka"]) ?? 9999;
        return aTime - bTime || a.number - b.number;
      });
  }

  function getScheduleState(date) {
    const dateKey = String(date || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return { status: "invalid", date: dateKey };
    if (dateKey < START_DATE || dateKey > END_DATE) return { status: "outside-range", date: dateKey };
    const pattern = DATE_PATTERNS[dateKey];
    if (!pattern || pattern === "pending") return { status: "pending", date: dateKey };
    return { status: "known", date: dateKey, pattern };
  }

  function timeAtPosition(train, position) {
    if (!train || !train.times) return null;
    const stops = routeStations
      .filter((station) => train.times[station.id] != null)
      .map((station) => ({ position: station.min, time: parseClock(train.times[station.id]) }))
      .filter((stop) => stop.time != null);
    if (stops.length < 2 || position < stops[0].position || position > stops[stops.length - 1].position) return null;
    for (let index = 0; index < stops.length - 1; index += 1) {
      const from = stops[index];
      const to = stops[index + 1];
      if (position < from.position || position > to.position) continue;
      if (position === from.position) return from.time;
      if (position === to.position) return to.time;
      const ratio = (position - from.position) / (to.position - from.position);
      return from.time + (to.time - from.time) * ratio;
    }
    return stops[stops.length - 1].time;
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

  function intersections(selectedTrain, specialTrain) {
    if (!selectedTrain || !specialTrain) return [];
    const selectedStops = routeStations.filter((station) => selectedTrain.times?.[station.id] != null);
    const specialStops = routeStations.filter((station) => specialTrain.times?.[station.id] != null);
    if (selectedStops.length < 2 || specialStops.length < 2) return [];
    const start = Math.max(selectedStops[0].min, specialStops[0].min);
    const end = Math.min(selectedStops[selectedStops.length - 1].min, specialStops[specialStops.length - 1].min);
    if (start >= end) return [];
    const positions = routeStations.map((station) => station.min).filter((position) => position >= start && position <= end);
    const results = [];
    for (let index = 0; index < positions.length - 1; index += 1) {
      const x0 = positions[index];
      const x1 = positions[index + 1];
      const selected0 = timeAtPosition(selectedTrain, x0);
      const selected1 = timeAtPosition(selectedTrain, x1);
      const special0 = timeAtPosition(specialTrain, x0);
      const special1 = timeAtPosition(specialTrain, x1);
      if ([selected0, selected1, special0, special1].some((value) => value == null)) continue;
      const difference0 = selected0 - special0;
      const difference1 = selected1 - special1;
      let position = null;
      if (Math.abs(difference0) < 0.000001) position = x0;
      else if (difference0 * difference1 < 0) position = x0 + (x1 - x0) * (difference0 / (difference0 - difference1));
      if (position == null) continue;
      if (results.some((result) => Math.abs(result.position - position) < 0.1)) continue;
      const selectedTime = timeAtPosition(selectedTrain, position);
      const segment = routeSegment(position);
      results.push({
        position,
        time: selectedTime,
        clock: formatClock(selectedTime),
        segment,
        specialTrain,
      });
    }
    return results;
  }

  function calculate(date, direction, selectedKey) {
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
    const matches = oppositeServices.flatMap((train) => intersections(selectedTrain, train)).sort((a, b) => a.time - b.time);
    return { ...schedule, status: matches.length ? "encounter" : "no-encounter", direction, selectedTrain, specialServices, matches };
  }

  const api = {
    START_DATE,
    END_DATE,
    PATTERN_SERVICES,
    DATE_PATTERNS,
    findTrain,
    getWindowTrains,
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
  const trainName = (train) => `${train.type} ${train.number}`;

  function renderTrainOptions(select, direction) {
    const candidates = getWindowTrains(direction);
    const previous = select.value;
    select.innerHTML = candidates.map((train) => `<option value="${escapeHTML(serviceKey(train))}">${escapeHTML(trainStaticLine(train, uiLanguage))}</option>`).join("");
    if (candidates.some((train) => serviceKey(train) === previous)) select.value = previous;
  }

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
      selected_train: result.selectedTrain ? trainName(result.selectedTrain) : "",
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
    const stageSelector = ".sd-x-embed, .sd-youtube-frame";
    const fallbackTimeoutMs = 5000;
    const fallbackTimers = new WeakMap();
    const markReady = (stage) => {
      if (!stage) return;
      const timer = fallbackTimers.get(stage);
      if (timer != null && typeof root.clearTimeout === "function") root.clearTimeout(timer);
      fallbackTimers.delete(stage);
      stage.classList.remove("is-loading");
      stage.classList.add("is-ready");
      stage.setAttribute("aria-busy", "false");
      stage.querySelector(".sd-embed-fallback")?.remove();
    };
    const markFallback = (stage) => {
      if (!stage) return;
      const timer = fallbackTimers.get(stage);
      if (timer != null && typeof root.clearTimeout === "function") root.clearTimeout(timer);
      fallbackTimers.delete(stage);
      stage.classList.remove("is-loading");
      stage.classList.add("is-fallback");
      stage.setAttribute("aria-busy", "false");
      const statusLink = stage.querySelector('blockquote a[href*="/status/"]')?.href;
      if (!statusLink || stage.querySelector(".sd-embed-fallback")) return;
      const fallback = document.createElement("a");
      fallback.className = "sd-embed-fallback";
      fallback.href = statusLink;
      fallback.target = "_blank";
      fallback.rel = "noopener noreferrer";
      fallback.innerHTML = uiLanguage === "en"
        ? '<span>Open the original post on X</span><span aria-hidden="true">↗</span>'
        : '<span>Xで元の投稿を見る</span><span aria-hidden="true">↗</span>';
      stage.appendChild(fallback);
    };
    const startLoading = (stage) => {
      if (!stage || stage.classList.contains("is-loading") || stage.classList.contains("is-ready")) return;
      stage.classList.add("is-loading");
      stage.setAttribute("aria-busy", "true");
      if (typeof root.setTimeout === "function") {
        fallbackTimers.set(stage, root.setTimeout(() => markFallback(stage), fallbackTimeoutMs));
      }
    };
    const bindFrame = (frame) => {
      const stage = frame.closest(stageSelector);
      if (!stage || frame.dataset.sdEmbedLoadBound === "true") return;
      frame.dataset.sdEmbedLoadBound = "true";
      frame.addEventListener("load", () => markReady(stage), { once: true });
    };
    document.querySelectorAll(stageSelector).forEach((stage) => {
      startLoading(stage);
      stage.querySelectorAll("iframe").forEach(bindFrame);
    });
    const grid = document.querySelector(".sd-post-grid");
    if (grid && typeof root.MutationObserver === "function") {
      const observer = new root.MutationObserver((records) => {
        records.forEach((record) => record.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches?.("iframe")) bindFrame(node);
          node.querySelectorAll?.("iframe").forEach(bindFrame);
        }));
      });
      observer.observe(grid, { childList: true, subtree: true });
    }
  }

  function init() {
    const form = $("#sdCalculator");
    const dateInput = $("#sdDate");
    const directionInput = $("#sdDirection");
    const trainInput = $("#sdTrain");
    if (!form || !dateInput || !directionInput || !trainInput) return;
    dateInput.value = dateToday();
    const populate = () => renderTrainOptions(trainInput, directionInput.value);
    populate();
    renderPatternLists();
    directionInput.addEventListener("change", populate);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const result = calculate(dateInput.value, directionInput.value, trainInput.value);
      renderResult(result);
    });
  }
  initEmbedLoading();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}(typeof window !== "undefined" ? window : globalThis));
