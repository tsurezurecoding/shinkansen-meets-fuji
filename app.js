const translations = {
  ja: {
    kicker: "車窓からの富士山探検",
    titleLineOne: "新幹線",
    titleMeet: "meets",
    titleFuji: "富士山",
    lead: "列車を選ぶと、富士山の見どころ時間帯を確認できます。",
    stepOne: "Step 1",
    plannerTitle: "列車を選ぶ",
    westbound: "下り 新大阪・博多方面",
    eastbound: "上り 東京方面",
    rightSide: "進行方向の右側",
    leftSide: "進行方向の左側",
    highlightWindow: "見どころ時間帯",
    originDeparture: "始発",
    destination: "行き先",
    bestSection: "見どころ",
    fujiSide: "富士山側",
    alertTiming: "通知",
    westSection: "三島〜新富士",
    eastSection: "新富士〜三島",
    fujiSideNoteWest: "この列車では、富士山は進行方向の右側に見える目安です。",
    fujiSideNoteEast: "この列車では、富士山は進行方向の左側に見える目安です。",
    stationTimeline: "Station timeline",
    timelineTitle: "停車駅と見どころ",
    station: "駅",
    departure: "時刻",
    view: "メモ",
    viewPoint: "富士山見どころ",
    viewPointNoteWest: "進行方向の右側に見える目安",
    viewPointNoteEast: "進行方向の左側に見える目安",
    notStop: "通過",
    cautionLabel: "Caution",
    cautionTitle: "注意事項",
    tipOne: "下りは進行方向の右側、上りは左側が富士山側です。",
    tipTwo: "三島〜新富士、新富士駅通過前後が特に見やすい区間です。",
    tipThree: "天候、遅延、窓枠や防音壁により見え方は変わります。",
    testAlert: "通知をテスト",
    scheduleFuture: "このページを開いている間、見どころの5分前と1分前に画面内アラートを表示します。",
    schedulePast: "今日の見どころ時間帯は過ぎています。時刻確認用として利用できます。",
    browserAlertTitle: "まもなく富士山",
    browserAlertBody: "富士山が見える区間に近づいています。富士山側の窓をご覧ください。",
    selectedToast: "列車を選択しました。",
    hamanakoLabel: "浜名湖",
    hamanakoNote: "右側（下り）・左側（上り）の見える目安",
    tipHamanako: "浜名湖は浜松〜豊橋間、進行方向の右側（下り）・左側（上り）に見えます。",
  },
  en: {
    kicker: "Mt. Fuji window quest",
    titleLineOne: "Shinkansen",
    titleMeet: "Meets",
    titleFuji: "Fuji",
    lead: "Choose a train to see the Mt. Fuji viewing window.",
    stepOne: "Step 1",
    plannerTitle: "Choose a train",
    westbound: "Westbound",
    eastbound: "Eastbound",
    rightSide: "Right side facing forward",
    leftSide: "Left side facing forward",
    highlightWindow: "View window",
    originDeparture: "Origin",
    destination: "Destination",
    bestSection: "Best section",
    fujiSide: "Mt. Fuji side",
    alertTiming: "Alerts",
    westSection: "Mishima to Shin-Fuji",
    eastSection: "Shin-Fuji to Mishima",
    fujiSideNoteWest: "On this train, Mt. Fuji is usually on the right side facing forward.",
    fujiSideNoteEast: "On this train, Mt. Fuji is usually on the left side facing forward.",
    stationTimeline: "Station timeline",
    timelineTitle: "Stops and view point",
    station: "Station",
    departure: "Time",
    view: "Note",
    viewPoint: "Mt. Fuji view",
    viewPointNoteWest: "Look to the right side facing forward",
    viewPointNoteEast: "Look to the left side facing forward",
    notStop: "Passes",
    cautionLabel: "Caution",
    cautionTitle: "Notes",
    tipOne: "Westbound trains show Mt. Fuji on the right; eastbound trains show it on the left.",
    tipTwo: "The Mishima to Shin-Fuji section, especially around Shin-Fuji, is the highlight.",
    tipThree: "Weather, delays, window frames, and sound barriers can affect visibility.",
    testAlert: "Test alert",
    scheduleFuture: "Keep this page open to receive in-page alerts 5 min and 1 min before the view.",
    schedulePast: "Today's view window has passed. You can still use this for timing guidance.",
    browserAlertTitle: "Mt. Fuji is coming up",
    browserAlertBody: "You are approaching a Mt. Fuji viewing section. Look toward the Mt. Fuji side.",
    selectedToast: "Train selected.",
    hamanakoLabel: "Lake Hamana",
    hamanakoNote: "Right side westbound / Left side eastbound",
    tipHamanako: "Lake Hamana is visible between Hamamatsu and Toyohashi — right side westbound, left side eastbound.",
  },
};

let timetableData = null;
let majorStations = [];
let stationOffsetsToFuji = {};
let trainTimetable = [];

let currentLang = "ja";
let selectedDirection = "west";
let selectedTrain = null;
let alertTimers = [];
let pointerStartX = null;
let pointerStartY = null;
let pointerMoved = false;
let previousSelectedTrain = null;

const coverFlowEl = document.querySelector("#cover-flow");
const timeJumpsEl = document.querySelector("#time-jumps");
const selectedTrainEl = document.querySelector("#selected-train");
const fujiSideNoteEl = document.querySelector("#fuji-side-note");
const scheduleStatusEl = document.querySelector("#schedule-status");
const timelineTableEl = document.querySelector("#timeline-table");
const toastEl = document.querySelector("#toast");
const testAlertButton = document.querySelector("#test-alert-button");

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => {
    currentLang = button.dataset.lang;
    document.documentElement.lang = currentLang;
    document.querySelectorAll("[data-lang]").forEach((item) => item.classList.toggle("active", item === button));
    translatePage();
    renderAll();
  });
});

document.querySelectorAll("[data-direction]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedDirection = button.dataset.direction;
    document.querySelectorAll("[data-direction]").forEach((item) => item.classList.toggle("active", item === button));
    pickDefaultTrain();
    renderAll();
  });
});

coverFlowEl.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveSelection(-1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveSelection(1);
  }
});

document.addEventListener("keydown", (event) => {
  const target = event.target;
  const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName);

  if (isTyping || event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveSelection(-1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveSelection(1);
  }
});

coverFlowEl.addEventListener("pointerdown", (event) => {
  pointerStartX = event.clientX;
  pointerStartY = event.clientY;
  pointerMoved = false;
  const card = event.target.closest(".train-card");
  if (card) {
    selectTrainByKey(card.dataset.trainKey);
  }
  coverFlowEl.setPointerCapture?.(event.pointerId);
});

coverFlowEl.addEventListener("pointermove", (event) => {
  if (pointerStartX === null || pointerStartY === null) {
    return;
  }

  const deltaX = event.clientX - pointerStartX;
  const deltaY = event.clientY - pointerStartY;
  pointerMoved = Math.abs(deltaX) > 12 && Math.abs(deltaX) > Math.abs(deltaY);
});

coverFlowEl.addEventListener("pointerup", (event) => {
  if (pointerStartX === null) {
    return;
  }

  const deltaX = event.clientX - pointerStartX;
  const didSwipe = pointerMoved && Math.abs(deltaX) >= 36;
  pointerStartX = null;
  pointerStartY = null;
  pointerMoved = false;

  if (!didSwipe) {
    return;
  }

  moveSelection(deltaX > 0 ? -1 : 1);
});

testAlertButton.addEventListener("click", () => {
  fireAlert();
});

function translatePage() {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (translations[currentLang][key]) {
      element.textContent = translations[currentLang][key];
    }
  });
}

async function loadTimetableData() {
  if (window.SHINKANSEN_TIMETABLE) {
    timetableData = window.SHINKANSEN_TIMETABLE;
    majorStations = timetableData.stations.map((station) => station.id);
    stationOffsetsToFuji = timetableData.fujiOffsetsMinutes;
    trainTimetable = timetableData.trains;
    return;
  }

  const response = await fetch("data/timetable.json", { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Timetable load failed: ${response.status}`);
  }

  timetableData = await response.json();
  majorStations = timetableData.stations.map((station) => station.id);
  stationOffsetsToFuji = timetableData.fujiOffsetsMinutes;
  trainTimetable = timetableData.trains;
}

function pickDefaultTrain() {
  selectedTrain = getVisibleTrains()[0] || null;
}

function getVisibleTrains() {
  return trainTimetable
    .filter((train) => train.direction === selectedDirection)
    .sort((a, b) => getSortTimeAtStation(a, "Shin-Yokohama") - getSortTimeAtStation(b, "Shin-Yokohama"));
}

function renderAll() {
  renderTimeJumps();
  renderTrainCards();
  renderResult();
}

function renderTimeJumps() {
  timeJumpsEl.innerHTML = "";
  const trains = getVisibleTrains();
  const buckets = new Map();

  trains.forEach((train) => {
    const sortMinutes = getSortTimeAtStation(train, "Shin-Yokohama");
    const bucketHour = Math.floor(sortMinutes / 240) * 4;
    if (!buckets.has(bucketHour)) {
      buckets.set(bucketHour, train);
    }
  });

  [...buckets.entries()].forEach(([hour, train]) => {
    const button = document.createElement("button");
    button.className = "time-jump";
    button.type = "button";
    button.textContent = `${String(hour).padStart(2, "0")}:00`;
    button.addEventListener("click", () => {
      previousSelectedTrain = selectedTrain;
      selectedTrain = train;
      renderAll();
      coverFlowEl.focus();
    });
    timeJumpsEl.append(button);
  });
}

function renderTrainCards() {
  coverFlowEl.innerHTML = "";
  const trains = getVisibleTrains();
  const selectedIndex = Math.max(0, trains.indexOf(selectedTrain));
  const previousIndex = previousSelectedTrain ? trains.indexOf(previousSelectedTrain) : selectedIndex;
  const visibleTrains = [-2, -1, 0, 1, 2]
    .map((offset) => ({
      offset,
      train: trains[selectedIndex + offset],
    }))
    .filter((item) => item.train);

  visibleTrains.forEach(({ train, offset }) => {
    const button = document.createElement("button");
    button.className = "train-card";
    button.type = "button";
    button.dataset.trainKey = trainKey(train);
    const previousOffset = previousIndex >= 0 ? trains.indexOf(train) - previousIndex : offset;
    applyCoverFlowPosition(button, previousOffset);
    button.classList.toggle("active", selectedTrain === train);
    button.innerHTML = `
      <span class="train-name">${trainLabel(train)}</span>
      <span class="train-number">${train.number}${currentLang === "ja" ? "号" : ""}</span>
      <span class="train-route">${stationName(train.originStation)} ${originTime(train)} → ${stationName(train.destination)}</span>
      <span class="train-window">${createViewWindow(getFujiCenterTime(train), train.direction)}</span>
    `;
    button.addEventListener("click", () => {
      const clickedIndex = trains.indexOf(train);
      const selectedIndex = trains.indexOf(selectedTrain);
      previousSelectedTrain = selectedTrain;
      selectedTrain = train;
      renderAll();
      coverFlowEl.focus();
      showToast(t("selectedToast"));
    });
    coverFlowEl.append(button);
    button.getBoundingClientRect();
    applyCoverFlowPosition(button, offset);
  });
}

function renderResult() {
  if (!selectedTrain) {
    return;
  }

  const viewTime = getFujiCenterTime(selectedTrain);
  const viewWindow = createViewWindow(viewTime, selectedTrain.direction);

  selectedTrainEl.textContent = `${trainLabel(selectedTrain)} ${stationName(selectedTrain.destination)}${currentLang === "ja" ? "行き" : ""}`;
  fujiSideNoteEl.textContent = selectedTrain.direction === "west" ? t("fujiSideNoteWest") : t("fujiSideNoteEast");

  renderTimeline(selectedTrain, viewTime, viewWindow);
  scheduleAlerts(viewTime);
}

function moveSelection(delta) {
  const trains = getVisibleTrains();
  const currentIndex = trains.indexOf(selectedTrain);
  const nextIndex = Math.min(Math.max(currentIndex + delta, 0), trains.length - 1);

  if (nextIndex === currentIndex) {
    return;
  }

  previousSelectedTrain = selectedTrain;
  selectedTrain = trains[nextIndex];
  renderAll();
}

function selectTrainByKey(key) {
  const trains = getVisibleTrains();
  const train = trains.find((item) => trainKey(item) === key);

  if (!train || train === selectedTrain) {
    return;
  }

  previousSelectedTrain = selectedTrain;
  selectedTrain = train;
  renderAll();
}

function trainKey(train) {
  return `${train.direction}:${train.type}:${train.number}:${train.originStation}:${train.destination}`;
}

function applyCoverFlowPosition(element, offset) {
  const positions = {
    "-2": { x: "clamp(-290px, -44vw, -156px)", rotate: 68, scale: 0.64, opacity: 0.22, z: 0 },
    "-1": { x: "clamp(-190px, -26vw, -102px)", rotate: 54, scale: 0.82, opacity: 0.58, z: 1 },
    "0": { x: "0px", rotate: 0, scale: 1.08, opacity: 1, z: 3 },
    "1": { x: "clamp(102px, 26vw, 190px)", rotate: -54, scale: 0.82, opacity: 0.58, z: 1 },
    "2": { x: "clamp(156px, 44vw, 290px)", rotate: -68, scale: 0.64, opacity: 0.22, z: 0 },
  };
  const hidden = offset < -2
    ? { x: "clamp(-340px, -52vw, -210px)", rotate: 74, scale: 0.56, opacity: 0, z: 0 }
    : { x: "clamp(210px, 52vw, 340px)", rotate: -74, scale: 0.56, opacity: 0, z: 0 };
  const position = positions[String(offset)] || hidden;

  element.style.transform = `translateX(${position.x}) rotateY(${position.rotate}deg) scale(${position.scale})`;
  element.style.opacity = String(position.opacity);
  element.style.zIndex = String(position.z);
}

function renderTimeline(train, viewTime, viewWindow) {
  timelineTableEl.innerHTML = "";

  const header = document.createElement("div");
  header.className = "timeline-row timeline-header";
  header.innerHTML = `<span>${t("departure")}</span><span>${t("station")}</span><span>${t("view")}</span>`;
  timelineTableEl.append(header);

  getTimelineItems(train, viewTime, viewWindow).forEach((item) => {
    const row = document.createElement("div");
    row.className = item.kind === "view" ? "timeline-row view-row" : "timeline-row";
    row.innerHTML = `
      <span>${item.time}</span>
      <span>${item.label}</span>
      <span>${item.note}</span>
    `;
    timelineTableEl.append(row);
  });
}

function getTimelineItems(train, viewTime, viewWindow) {
  const nozomiStops = train.direction === "west"
    ? ["Tokyo", "Shinagawa", "Shin-Yokohama", "Nagoya", "Kyoto", "Shin-Osaka", "Shin-Kobe", "Okayama", "Hiroshima", "Kokura", "Hakata"]
    : ["Hakata", "Kokura", "Hiroshima", "Okayama", "Shin-Kobe", "Shin-Osaka", "Kyoto", "Nagoya", "Shin-Yokohama", "Shinagawa", "Tokyo"];
  const originIndex = majorStations.indexOf(train.originStation);
  const destinationIndex = majorStations.indexOf(train.destination);
  const routeStops = nozomiStops.filter((station) => {
    const stationIndex = majorStations.indexOf(station);
    if (stationIndex === -1 || originIndex === -1 || destinationIndex === -1) {
      return Boolean(train.times[station]);
    }
    return train.direction === "west"
      ? stationIndex >= originIndex && stationIndex <= destinationIndex
      : stationIndex <= originIndex && stationIndex >= destinationIndex;
  });
  const stopItems = routeStops.map((station) => ({
    kind: "station",
    label: stationName(station),
    time: train.times[station] || t("notStop"),
    note: "",
    sortTime: train.times[station] ? timeToMinutes(train.times[station]) : estimateStationSortTime(train, station),
  }));
  const viewItem = {
    kind: "view",
    label: t("viewPoint"),
    time: viewWindow,
    note: train.direction === "west" ? t("viewPointNoteWest") : t("viewPointNoteEast"),
    sortTime: timeToMinutes(viewTime),
  };

  const hamanakoOffset = train.direction === "west" ? 37 : -37;
  const hamanakoTime = addMinutes(viewTime, hamanakoOffset);
  const hamanakoItem = {
    kind: "view",
    label: t("hamanakoLabel"),
    time: createViewWindow(hamanakoTime, train.direction),
    note: t("hamanakoNote"),
    sortTime: timeToMinutes(hamanakoTime),
  };

  return [...stopItems, viewItem, hamanakoItem].sort((a, b) => a.sortTime - b.sortTime);
}

function estimateStationSortTime(train, station) {
  const offset = stationOffsetsToFuji[train.direction][station];
  if (offset !== undefined) {
    return timeToMinutes(addMinutes(getFujiCenterTime(train), -offset));
  }

  return train.direction === "west" ? 1440 : -1;
}

function getSortTimeAtStation(train, station) {
  if (train.times[station]) {
    return timeToMinutes(train.times[station]);
  }

  const offset = stationOffsetsToFuji[train.direction]?.[station];
  if (offset !== undefined) {
    return timeToMinutes(addMinutes(getFujiCenterTime(train), -offset));
  }

  return timeToMinutes(originTime(train));
}

function getFujiCenterTime(train) {
  if (train.times["Shin-Fuji"]) {
    return train.times["Shin-Fuji"];
  }

  const preferredStations = train.direction === "west"
    ? ["Shin-Fuji", "Mishima", "Shizuoka", "Shin-Yokohama", "Shinagawa", "Tokyo", "Nagoya", "Kyoto", "Shin-Osaka"]
    : ["Shin-Fuji", "Mishima", "Shizuoka", "Nagoya", "Kyoto", "Shin-Osaka", "Shin-Yokohama", "Shinagawa", "Tokyo"];

  const station = preferredStations.find((item) => train.times[item] && stationOffsetsToFuji[train.direction][item] !== undefined);
  return addMinutes(train.times[station], stationOffsetsToFuji[train.direction][station]);
}

function createViewWindow(viewTime, direction) {
  const startOffset = direction === "west" ? -2 : -3;
  const endOffset = direction === "west" ? 3 : 2;
  return `${addMinutes(viewTime, startOffset)}-${addMinutes(viewTime, endOffset)}`;
}

function addMinutes(time, minutes) {
  const total = timeToMinutes(time) + minutes;
  const normalized = ((total % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function originTime(train) {
  return train.times[train.originStation];
}

function trainLabel(train) {
  const names = {
    Nozomi: currentLang === "ja" ? "のぞみ" : "Nozomi",
    Hikari: currentLang === "ja" ? "ひかり" : "Hikari",
    Kodama: currentLang === "ja" ? "こだま" : "Kodama",
  };
  return `${names[train.type]}${train.number}${currentLang === "ja" ? "号" : ""}`;
}

function stationName(station) {
  const stationData = timetableData?.stations.find((item) => item.id === station);
  return stationData ? stationData[currentLang] : station;
}

function scheduleAlerts(viewTime) {
  alertTimers.forEach((timer) => window.clearTimeout(timer));
  alertTimers = [];

  const target = timeToToday(viewTime);
  const now = new Date();
  const alerts = [5, 1]
    .map((minutesBefore) => ({
      minutesBefore,
      at: new Date(target.getTime() - minutesBefore * 60 * 1000),
    }))
    .filter((alert) => alert.at > now);

  if (!alerts.length) {
    scheduleStatusEl.textContent = t("schedulePast");
    return;
  }

  alerts.forEach((alert) => {
    const delay = alert.at.getTime() - now.getTime();
    const timer = window.setTimeout(() => fireAlert(alert.minutesBefore), delay);
    alertTimers.push(timer);
  });

  scheduleStatusEl.textContent = t("scheduleFuture");
}

function timeToToday(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

async function fireAlert(minutesBefore) {
  const prefix = minutesBefore ? `${minutesBefore} min: ` : "";
  showToast(`${prefix}${t("browserAlertBody")}`);

  if (!("Notification" in window)) {
    return;
  }

  const permission = Notification.permission === "default"
    ? await Notification.requestPermission()
    : Notification.permission;

  if (permission === "granted") {
    new Notification(t("browserAlertTitle"), {
      body: t("browserAlertBody"),
    });
  }
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    toastEl.hidden = true;
  }, 3200);
}

function t(key) {
  return translations[currentLang][key] || key;
}

async function init() {
  translatePage();
  registerServiceWorker();
  coverFlowEl.textContent = currentLang === "ja" ? "時刻表データを読み込んでいます。" : "Loading timetable data.";

  try {
    await loadTimetableData();
    pickDefaultTrain();
    renderAll();
  } catch (error) {
    coverFlowEl.textContent = currentLang === "ja"
      ? "時刻表データを読み込めませんでした。GitHub PagesなどHTTP配信で開いてください。"
      : "Could not load timetable data. Please open this via GitHub Pages or another HTTP server.";
    console.error(error);
  }
}

init();

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  });
}
