const data = window.SHINKANSEN_TIMETABLE;
const screen = document.body.dataset.screen;
const params = new URLSearchParams(window.location.search);
const toast = document.querySelector("#toast");
const storedLang = safeStorageGet("smf-lang");
let currentLang = normalizeLang(params.get("lang") || storedLang || navigator.language);

const stationNames = new Map(data.stations.map((station) => [station.id, station]));

const messages = {
  ja: {
    appTitle: "新幹線 meets 富士山",
    appLead: "乗る列車を選ぶだけで、富士山や車窓の見どころをいつ見るか確認できます。",
    stepCondition: "1 条件設定",
    stepCandidates: "2 列車選択",
    stepHighlights: "3 見どころ情報",
    conditionTitle: "条件設定",
    directionWest: "下り 新大阪方面",
    directionEast: "上り 東京方面",
    boardingStation: "乗車駅",
    departureTime: "出発時刻",
    travelDate: "乗車日",
    timeSearchTitle: "時間で探す",
    timeSearchLead: "乗車駅とだいたいの出発時刻から近い列車を選びます。",
    numberSearchTitle: "列車番号で探す",
    numberSearchLead: "乗る列車が分かっている場合はこちら。",
    trainNumberOptional: "列車番号",
    trainNumberPlaceholder: "例: 23",
    searchByCondition: "この条件で候補を見る",
    searchByNumber: "列車番号で候補を見る",
    backToConditions: "条件へ戻る",
    candidatePageTitle: "候補列車",
    selectTrain: "列車を選択",
    prevTime: "前の時間帯",
    nextTime: "次の時間帯",
    detailPageTitle: "見どころ確認",
    backToCandidates: "候補へ戻る",
    fujiWindowLabel: "富士山の目安",
    trainLabel: "列車",
    seatSideLabel: "見る側",
    routeTitle: "駅順で見る",
    weatherLabel: "天気・視界",
    weatherLoading: "新富士付近の天気を確認しています。",
    weatherUnavailable: "天気を取得できませんでした。見え方は雲量・降水・日の入りで変わります。",
    weatherClear: "新富士付近は雲が少なめです。富士山が見える可能性があります。",
    weatherCloudy: "新富士付近は雲が多めです。富士山は見えにくいかもしれません。",
    weatherRain: "新富士付近で降水があります。車窓の見通しは期待しすぎない方がよさそうです。",
    weatherNight: "見どころ時刻は日の出前または日没後です。景色は見えにくい可能性があります。",
    darkBadge: "夜",
    candidateDark: "夜のため富士山は見えません",
    daylightBadge: "日中",
    editConditions: "条件を変更",
    details: "詳しく",
    closeDetails: "閉じる",
    select: "選択",
    arrive: "着",
    depart: "発",
    notStop: "は停車しません",
    west: "下り",
    east: "上り",
    around: "発付近",
    noCandidates: "候補が見つかりませんでした。前後の時間帯へ移動するか、条件を戻って変更してください。",
    boarding: "乗車",
    fujiGuide: "富士山目安",
    mainStation: "主要駅",
    visibilityNote: "天候、遅延、日の入り後、窓枠や防音壁により見え方は変わります。時刻と席側は目安として確認してください。",
    countdownUnknown: "見どころ時刻は未定です",
    countdownPast: "今日の見どころ時刻は過ぎています",
    countdownIn: "あと約{minutes}分",
    unknownTime: "時刻未定",
    estimate: "目安",
    photoCredit: "写真出典",
    seatWest: "E席側",
    seatEast: "E席側",
    trainTypes: { Nozomi: "のぞみ", Hikari: "ひかり", Kodama: "こだま" },
  },
  en: {
    appTitle: "Shinkansen Meets Fuji",
    appLead: "Choose your train and see when to look for Mt. Fuji and other views from the window.",
    stepCondition: "1 Conditions",
    stepCandidates: "2 Train",
    stepHighlights: "3 Views",
    conditionTitle: "Search Conditions",
    directionWest: "Westbound to Shin-Osaka",
    directionEast: "Eastbound to Tokyo",
    boardingStation: "Boarding station",
    departureTime: "Departure time",
    travelDate: "Travel date",
    timeSearchTitle: "Search by time",
    timeSearchLead: "Find nearby trains from your boarding station and approximate departure time.",
    numberSearchTitle: "Search by train number",
    numberSearchLead: "Use this if you already know the train you will ride.",
    trainNumberOptional: "Train number",
    trainNumberPlaceholder: "e.g. 23",
    searchByCondition: "Show train options",
    searchByNumber: "Search by train number",
    backToConditions: "Back to search",
    candidatePageTitle: "Train Options",
    selectTrain: "Select a Train",
    prevTime: "Earlier trains",
    nextTime: "Later trains",
    detailPageTitle: "View Plan",
    backToCandidates: "Back to trains",
    fujiWindowLabel: "Mt. Fuji window",
    trainLabel: "Train",
    seatSideLabel: "View side",
    routeTitle: "Route Timeline",
    weatherLabel: "Weather / visibility",
    weatherLoading: "Checking weather near Shin-Fuji.",
    weatherUnavailable: "Weather could not be loaded. Visibility depends on clouds, rain, and daylight.",
    weatherClear: "Cloud cover near Shin-Fuji looks relatively low. Mt. Fuji may be visible.",
    weatherCloudy: "Cloud cover near Shin-Fuji looks high. Mt. Fuji may be hard to see.",
    weatherRain: "Rain is reported near Shin-Fuji. Visibility may be limited.",
    weatherNight: "This view is before sunrise or after sunset. Scenery may be difficult to see.",
    darkBadge: "Night",
    candidateDark: "Mt. Fuji is not visible at night",
    daylightBadge: "Daylight",
    editConditions: "Edit search",
    details: "Details",
    closeDetails: "Close",
    select: "Select",
    arrive: "arr.",
    depart: "dep.",
    notStop: "does not stop",
    west: "Westbound",
    east: "Eastbound",
    around: "around",
    noCandidates: "No trains found. Try earlier/later trains or change your search.",
    boarding: "Boarding",
    fujiGuide: "Fuji guide",
    mainStation: "Main stop",
    visibilityNote: "Weather, delays, darkness, window frames, and sound barriers can change visibility. Times and seat sides are guides.",
    countdownUnknown: "View time is unknown",
    countdownPast: "This view time has passed today",
    countdownIn: "About {minutes} min",
    unknownTime: "Unknown",
    estimate: "Est.",
    photoCredit: "Photo credit",
    seatWest: "Seat E",
    seatEast: "Seat E",
    trainTypes: { Nozomi: "Nozomi", Hikari: "Hikari", Kodama: "Kodama" },
  },
};

const primaryStations = [
  "Tokyo",
  "Shinagawa",
  "Shin-Yokohama",
  "Odawara",
  "Atami",
  "Mishima",
  "Shin-Fuji",
  "Shizuoka",
  "Hamamatsu",
  "Toyohashi",
  "Nagoya",
  "Gifu-Hashima",
  "Maibara",
  "Kyoto",
  "Shin-Osaka",
];

const scenicSpots = [
  {
    id: "fuji",
    name: "富士山",
    nameEn: "Mt. Fuji",
    area: "三島〜新富士",
    areaEn: "Mishima to Shin-Fuji",
    after: "Mishima",
    before: "Shin-Fuji",
    westAfter: "Mishima",
    eastAfter: "Shin-Fuji",
    side: "mountain",
    timing: { type: "fuji", before: 3, after: 4 },
    note: "このアプリの中心になる見どころ。",
    noteEn: "The signature view for this app.",
    detail: "三島から新富士の前後で、車窓に富士山が大きく現れる区間があります。見える時間は長くないので、目安時刻の少し前から窓側を意識しておくと安心です。",
    detailEn: "Around the Mishima to Shin-Fuji section, Mt. Fuji can appear prominently from the train window. The view window is short, so it helps to be ready a little before the suggested time.",
    image: "images/20240211_Mt.Fuji.jpg",
    ownedPhoto: true,
  },
  {
    id: "odawara",
    name: "小田原城と相模湾",
    nameEn: "Odawara Castle and Sagami Bay",
    area: "新横浜〜熱海",
    areaEn: "Shin-Yokohama to Atami",
    after: "Odawara",
    before: "Atami",
    westAfter: "Odawara",
    eastAfter: "Atami",
    side: "sea",
    timing: { type: "station", station: "Odawara", before: 2, after: 2 },
    note: "東京側の市街地から、海沿いの旅へ切り替わる区間。",
    noteEn: "Where the ride begins to shift from city scenery to the coast.",
    detail: "小田原の前後では、相模湾側へ景色が開き始めます。小田原城は一瞬なので、駅の前後で外を眺めるきっかけとして扱うのがよさそうです。",
    detailEn: "Around Odawara, the scenery begins to open toward Sagami Bay. The castle itself is brief, so it works best as a cue to start looking outside near the station.",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Odawara_Castle_01.jpg?width=900",
    credit: "Wikimedia Commons / Odawara Castle 01",
    source: "https://commons.wikimedia.org/wiki/File:Odawara_Castle_01.jpg",
  },
  {
    id: "tea",
    name: "静岡の茶畑",
    nameEn: "Shizuoka Tea Fields",
    area: "新富士〜静岡",
    areaEn: "Shin-Fuji to Shizuoka",
    after: "Shin-Fuji",
    before: "Shizuoka",
    westAfter: "Shin-Fuji",
    eastAfter: "Shizuoka",
    side: "mountain",
    timing: { type: "between", start: "Shin-Fuji", end: "Shizuoka", before: 4, after: 4 },
    note: "静岡らしさを感じやすい車窓。",
    noteEn: "A window view that feels unmistakably Shizuoka.",
    detail: "新富士から静岡にかけては、季節によって茶畑の緑や山並みの見え方が変わります。富士山が雲に隠れる日でも、移動中の楽しみとして案内できます。",
    detailEn: "Between Shin-Fuji and Shizuoka, tea fields and hills change with the season. Even when Fuji is hidden by clouds, this can still be a satisfying view from the train.",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Tea_plantation_in_Shizuoka.jpg?width=900",
    credit: "Wikimedia Commons / Tea plantation in Shizuoka",
    source: "https://commons.wikimedia.org/wiki/File:Tea_plantation_in_Shizuoka.jpg",
  },
  {
    id: "hamanako",
    name: "浜名湖",
    nameEn: "Lake Hamana",
    area: "浜松〜豊橋",
    areaEn: "Hamamatsu to Toyohashi",
    after: "Hamamatsu",
    before: "Toyohashi",
    westAfter: "Hamamatsu",
    eastAfter: "Toyohashi",
    side: "sea",
    timing: { type: "between", start: "Hamamatsu", end: "Toyohashi", before: 4, after: 4 },
    note: "水辺の広がりを感じられる区間。",
    noteEn: "A broad waterside view along the route.",
    detail: "浜松から豊橋の間では、浜名湖の水面が車窓に広がります。晴れた日は光の反射がきれいで、西へ向かう旅の印象が変わるポイントです。",
    detailEn: "Between Hamamatsu and Toyohashi, Lake Hamana opens up from the train window. On clear days, the reflected light on the water makes this section feel distinctly different.",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Lake_Hamana.JPG?width=900",
    credit: "Wikimedia Commons / Lake Hamana",
    source: "https://commons.wikimedia.org/wiki/File:Lake_Hamana.JPG",
  },
  {
    id: "ibuki",
    name: "伊吹山",
    nameEn: "Mt. Ibuki",
    area: "岐阜羽島〜米原",
    areaEn: "Gifu-Hashima to Maibara",
    after: "Gifu-Hashima",
    before: "Maibara",
    westAfter: "Gifu-Hashima",
    eastAfter: "Maibara",
    side: "mountain",
    timing: { type: "stationDirectional", station: "Maibara", west: -3, east: 3, before: 2, after: 2 },
    note: "関ヶ原を越えるあたりの山の見どころ。",
    noteEn: "A mountain view around the Sekigahara area.",
    detail: "伊吹山は米原の名古屋寄りで見える山として知られています。冬は雪をかぶった姿が印象的で、天気がよければE席側を意識したい区間です。",
    detailEn: "Mt. Ibuki is known as a view near Maibara on the Nagoya side. In winter, its snow-covered shape can be especially memorable.",
    image: "images/20240114_ibukiyama.png",
    ownedPhoto: true,
  },
  {
    id: "toji",
    name: "東寺 五重塔",
    nameEn: "To-ji Pagoda",
    area: "京都駅前後",
    areaEn: "Around Kyoto Station",
    after: "Kyoto",
    before: "Shin-Osaka",
    westAfter: "Kyoto",
    eastAfter: "Shin-Osaka",
    side: "sea",
    timing: { type: "stationDirectional", station: "Kyoto", west: 2, east: -2, before: 1, after: 1 },
    note: "京都らしさが一瞬で伝わる車窓。",
    noteEn: "A brief view that immediately feels like Kyoto.",
    detail: "東寺の五重塔は京都駅の南側にあります。京都発着の前後で見える可能性があるため、京都に近づいたら海側の窓を意識すると見つけやすくなります。",
    detailEn: "The five-story pagoda of To-ji sits south of Kyoto Station. Around arrival or departure at Kyoto, watch the sea-side window.",
    image: "images/20260510_toji.png",
    ownedPhoto: true,
  },
];

function init() {
  applyLanguage();
  bindLanguageSwitch();
  registerServiceWorker();
  if (screen === "conditions") {
    initConditions();
  }
  if (screen === "candidates") {
    initCandidates();
  }
  if (screen === "detail") {
    initDetail();
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") {
    return;
  }
  navigator.serviceWorker.register("sw.js").catch(() => {
    // The app works without offline cache; registration failure should not block the UI.
  });
}

function normalizeLang(value) {
  return String(value || "").toLowerCase().startsWith("ja") ? "ja" : "en";
}

function t(key, replacements = {}) {
  const template = messages[currentLang][key] || messages.ja[key] || key;
  return Object.entries(replacements).reduce((text, [name, value]) => text.replace(`{${name}}`, value), template);
}

function applyLanguage() {
  document.documentElement.lang = currentLang;
  document.body.classList.toggle("lang-en", currentLang === "en");
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-lang-option]").forEach((button) => {
    button.classList.toggle("active", button.dataset.langOption === currentLang);
  });
}

function bindLanguageSwitch() {
  document.querySelectorAll("[data-lang-option]").forEach((button) => {
    button.addEventListener("click", () => {
      currentLang = button.dataset.langOption;
      safeStorageSet("smf-lang", currentLang);
      params.set("lang", currentLang);
      window.location.search = params.toString();
    });
  });
}

function safeStorageGet(key) {
  try {
    return window.localStorage?.getItem(key) || "";
  } catch {
    return "";
  }
}

function safeStorageSet(key, value) {
  try {
    window.localStorage?.setItem(key, value);
  } catch {
    // file:// previews may block localStorage. URL lang param still carries the state.
  }
}

function initConditions() {
  const stationSelect = document.querySelector("#station-select");
  const timeInput = document.querySelector("#time-input");
  const dateInput = document.querySelector("#date-input");
  const numberInput = document.querySelector("#number-input");
  let selectedDirection = params.get("direction") || "west";

  setDirectionButtons(selectedDirection, (direction) => {
    selectedDirection = direction;
    renderStations(stationSelect, selectedDirection);
  });
  renderStations(stationSelect, selectedDirection);
  timeInput.value = params.get("time") || defaultDepartureTime();
  dateInput.value = params.get("date") || defaultTravelDate();
  if (params.get("station")) {
    stationSelect.value = params.get("station");
  }
  numberInput.value = params.get("number") || "";

  document.querySelector("#search-time").addEventListener("click", () => {
    goToCandidates({ direction: selectedDirection, station: stationSelect.value, time: timeInput.value, date: dateInput.value, mode: "time" });
  });
  document.querySelector("#search-number").addEventListener("click", () => {
    const number = numberInput.value.trim().replace(/[^\d]/g, "");
    if (!number) {
      showToast("列車番号を入力してください。");
      return;
    }
    goToCandidates({ direction: selectedDirection, station: stationSelect.value, time: timeInput.value, date: dateInput.value, number, mode: "number" });
  });
}

function initCandidates() {
  const direction = params.get("direction") || "west";
  const station = params.get("station") || (direction === "west" ? "Shin-Yokohama" : "Nagoya");
  const time = params.get("time") || defaultDepartureTime();
  const date = params.get("date") || defaultTravelDate();
  const number = params.get("number") || "";
  const mode = params.get("mode") || (number ? "number" : "time");
  const candidates = getCandidates({ direction, station, time, number, mode });

  document.querySelector("#candidate-condition").textContent = createConditionLabel({ direction, station, time, date, number, mode });
  document.querySelector("#candidate-window-label").textContent = currentLang === "ja" ? `${stationLabel(station)} ${time} 前後` : `${stationLabel(station)} ${t("around")} ${time}`;
  const conditionHref = `index.html?${createQuery({ direction, station, time, date, number })}`;
  document.querySelector("#step-to-conditions").href = conditionHref;

  const goPrevious = () => {
    goToCandidates({ direction, station, time: addMinutes(time, -20), date, number, mode: "time" });
  };
  const goNext = () => {
    goToCandidates({ direction, station, time: addMinutes(time, 20), date, number, mode: "time" });
  };
  document.querySelector("#prev-window").addEventListener("click", goPrevious);
  document.querySelector("#next-window").addEventListener("click", goNext);
  document.querySelector("#prev-window-bottom").addEventListener("click", goPrevious);
  document.querySelector("#next-window-bottom").addEventListener("click", goNext);
  renderCandidates(candidates, { direction, station, time, date, number, mode });
}

function initDetail() {
  const direction = params.get("direction") || "west";
  const station = params.get("station") || (direction === "west" ? "Shin-Yokohama" : "Nagoya");
  const time = params.get("time") || defaultDepartureTime();
  const date = params.get("date") || defaultTravelDate();
  const number = params.get("number") || "";
  const mode = params.get("mode") || (number ? "number" : "time");
  const train = findTrain(params.get("train"));
  if (!train) {
    window.location.href = `candidates.html?${createQuery({ direction, station, time, date })}`;
    return;
  }

  const conditionHref = `index.html?${createQuery({ direction, station, time, date, number })}`;
  const candidateHref = `candidates.html?${createQuery({ direction, station, time, date, number, mode })}`;
  document.querySelector("#step-to-conditions").href = conditionHref;
  document.querySelector("#step-to-candidates").href = candidateHref;
  document.querySelector("#detail-back-bottom").href = candidateHref;
  document.querySelector("#detail-edit-condition").href = conditionHref;
  renderDetail(train, station, date);
}

function setDirectionButtons(selectedDirection, onChange) {
  document.querySelectorAll("[data-direction]").forEach((button) => {
    button.classList.toggle("active", button.dataset.direction === selectedDirection);
    button.setAttribute("aria-pressed", String(button.dataset.direction === selectedDirection));
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-direction]").forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });
      onChange(button.dataset.direction);
    });
  });
}

function renderStations(stationSelect, direction) {
  const available = new Set(
    getDirectionTrains(direction)
      .flatMap((train) => Object.keys(train.times))
      .filter((station) => data.fujiOffsetsMinutes[direction]?.[station] !== undefined),
  );
  const current = stationSelect.value;
  const ordered = primaryStations.filter((station) => available.has(station));
  stationSelect.innerHTML = ordered.map((station) => `<option value="${station}">${stationLabel(station)}</option>`).join("");
  if (ordered.includes(current)) {
    stationSelect.value = current;
  } else {
    stationSelect.value = direction === "west" ? "Shin-Yokohama" : "Nagoya";
  }
}

function getCandidates({ direction, station, time, number, mode }) {
  if (mode === "number" && number) {
    return uniqueCandidates(
      getDirectionTrains(direction)
        .filter((train) => String(train.number) === number)
        .map((train) => ({ train, station, departure: train.times[station] || null, diff: 0 })),
    );
  }

  const target = timeToMinutes(time);
  const windowMinutes = 20;
  return uniqueCandidates(
    getDirectionTrains(direction)
      .filter((train) => train.times[station])
      .map((train) => ({
        train,
        station,
        departure: train.times[station],
        diff: Math.abs(timeToMinutes(train.times[station]) - target),
      }))
      .filter((item) => item.diff <= windowMinutes)
      .sort((a, b) => timeToMinutes(a.departure) - timeToMinutes(b.departure)),
  ).slice(0, 12);
}

function renderCandidates(candidates, context) {
  const candidateList = document.querySelector("#candidate-list");
  if (!candidates.length) {
    candidateList.innerHTML = `<div class="empty-state">候補が見つかりませんでした。前後の時間帯へ移動するか、条件を戻って変更してください。</div>`;
    return;
  }
  candidateList.innerHTML = candidates
    .map((item) => {
      const train = item.train;
      const departureText = item.departure ? `${stationLabel(item.station)} ${item.departure}${t("depart")}` : `${stationLabel(item.station)} ${t("notStop")}`;
      const arrivalStation = stationLabel(train.destination);
      const arrivalTime = train.times[train.destination] || "";
      const fujiTime = getFujiCenterTime(train);
      const lowLightBadge = isDarkViewTime(fujiTime, context.date) ? `<span class="candidate-badge low-light" aria-label="${t("candidateDark")}">☾ ${t("candidateDark")}</span>` : "";
      const href = `detail.html?${createQuery({ ...context, train: trainKey(train) })}`;
      return `
        <a class="candidate ${lowLightBadge ? "low-light" : ""}" href="${href}">
          <div class="candidate-main">
            <strong>${formatTrainName(train)}</strong>
            <span>選択</span>
          </div>
          <div class="candidate-meta">
            <span>${departureText}</span>
            <span>${arrivalStation} ${arrivalTime}${t("arrive")}</span>
            ${lowLightBadge}
          </div>
        </a>
      `;
    })
    .join("");
}

function renderDetail(train, station, date) {
  const viewTime = getFujiCenterTime(train);
  document.querySelector("#train-name").textContent = `${formatTrainName(train)} / ${stationLabel(train.originStation)} → ${stationLabel(train.destination)}`;
  document.querySelector("#fuji-window").textContent = createViewWindow(viewTime);
  document.querySelector("#countdown").textContent = createCountdownLabel(viewTime);
  document.querySelector(".hero-result").classList.toggle("low-light", isDarkViewTime(viewTime, date));
  const fujiLightBadge = document.querySelector("#fuji-light-badge");
  const fujiIsDark = isDarkViewTime(viewTime, date);
  fujiLightBadge.hidden = !fujiIsDark;
  fujiLightBadge.textContent = fujiIsDark ? `☾ ${t("darkBadge")}` : "";
  document.querySelector("#hero-train-type").textContent = formatTrainName(train);
  document.querySelector("#seat-side").textContent = getSeatSide(train.direction);
  document.querySelector("#boarding-info").textContent = train.times[station] ? `${stationLabel(station)} ${train.times[station]}${t("depart")}` : `${stationLabel(station)} ${t("notStop")}`;
  document.querySelector("#route-plan").innerHTML = createRoutePlan(train, station, null, date);
  document.querySelector("#weather-comment").textContent = t("weatherLoading");
  updateWeatherComment(viewTime, date);
  document.querySelector("#visibility-note").textContent = t("visibilityNote");
  document.querySelector("#route-plan").addEventListener("click", (event) => {
    const spotButton = event.target.closest("[data-spot-id]");
    if (spotButton) {
      toggleSpot(spotButton.dataset.spotId, train);
    }
  });
}

function createRoutePlan(train, boardingStation, selectedSpotId, date) {
  const orderedStations = train.direction === "west" ? primaryStations : [...primaryStations].reverse();
  const stopStations = orderedStations.filter((station) => train.times[station]);
  const rows = stopStations
    .flatMap((station, index) => {
      const nextStation = stopStations[index + 1] || null;
      const suffix = station === boardingStation ? t("boarding") : station === "Shin-Fuji" || station === "Mishima" ? t("fujiGuide") : t("mainStation");
      const stationRow = `
        <div class="route-row ${station === boardingStation ? "boarding" : ""}">
          <div class="route-time">${train.times[station]}</div>
          <div class="station-line">
            <strong>${stationLabel(station)}</strong>
            <span>${suffix}</span>
          </div>
        </div>
      `;
      return [stationRow, ...createScenicRowsBetween(train, station, nextStation, selectedSpotId, date)];
    });
  return rows.join("");
}

function createScenicRowsBetween(train, station, nextStation, selectedSpotId, date) {
  if (!nextStation) {
    return [];
  }
  const orderedStations = train.direction === "west" ? primaryStations : [...primaryStations].reverse();
  const startIndex = orderedStations.indexOf(station);
  const endIndex = orderedStations.indexOf(nextStation);
  if (startIndex === -1 || endIndex === -1) {
    return [];
  }
  return scenicSpots
    .filter((spot) => isSpotBetween(spot, startIndex, endIndex, orderedStations, train.direction))
    .sort((a, b) => {
      const timeA = getScenicCenterTime(train, a);
      const timeB = getScenicCenterTime(train, b);
      if (!timeA && !timeB) {
        return 0;
      }
      if (!timeA) {
        return 1;
      }
      if (!timeB) {
        return -1;
      }
      return timeToMinutes(timeA) - timeToMinutes(timeB);
    })
    .map((spot) => {
      const time = getScenicTime(train, spot);
      const center = getScenicCenterTime(train, spot);
      const isDark = isDarkViewTime(center, date);
      return `
        <button class="route-row scenic ${spot.id === selectedSpotId ? "active" : ""} ${spot.id === "fuji" ? "fuji" : ""} ${isDark ? "low-light" : ""}" type="button" data-spot-id="${spot.id}">
          <div class="route-time">${time}</div>
          <div class="spot-line">
            <strong>${spotLabel(spot, "name")}</strong>
            <span>${getSpotSeatSide(spot)}</span>
            ${isDark ? `<span class="light-badge">☾ ${t("darkBadge")}</span>` : ""}
            <small>${spotLabel(spot, "area")}</small>
          </div>
          <span class="spot-toggle">${t("details")}</span>
          <div class="spot-detail-inline" id="spot-detail-${spot.id}" hidden>
            <img src="${spot.image}" alt="${currentLang === "ja" ? `${spotLabel(spot, "name")}のサンプル写真` : `Sample photo: ${spotLabel(spot, "name")}`}" onerror="this.hidden=true; this.nextElementSibling.hidden=false;">
            <div class="photo-placeholder" hidden>${currentLang === "ja" ? "写真準備中" : "Photo coming soon"}</div>
            <p>${spotLabel(spot, "detail")}</p>
            ${createPhotoCredit(spot)}
          </div>
        </button>
      `;
    });
}

function isSpotBetween(spot, startIndex, endIndex, orderedStations, direction) {
  const anchor = direction === "west" ? spot.westAfter || spot.after : spot.eastAfter || spot.after;
  const anchorIndex = orderedStations.indexOf(anchor);
  if (anchorIndex === -1) {
    return false;
  }
  const low = Math.min(startIndex, endIndex);
  const high = Math.max(startIndex, endIndex);
  return anchorIndex >= low && anchorIndex < high;
}

function toggleSpot(spotId) {
  const button = document.querySelector(`[data-spot-id="${spotId}"]`);
  if (!button) {
    return;
  }
  const detail = button.querySelector(".spot-detail-inline");
  const wasOpen = !detail.hidden;
  document.querySelectorAll("[data-spot-id]").forEach((spotButton) => {
    spotButton.classList.remove("active");
    const inline = spotButton.querySelector(".spot-detail-inline");
    const toggle = spotButton.querySelector(".spot-toggle");
    if (inline) {
      inline.hidden = true;
    }
    if (toggle) {
      toggle.textContent = t("details");
    }
  });
  detail.hidden = wasOpen;
  button.classList.toggle("active", !wasOpen);
  const toggle = button.querySelector(".spot-toggle");
  if (toggle) {
    toggle.textContent = wasOpen ? t("details") : t("closeDetails");
  }
}

function goToCandidates(query) {
  window.location.href = `candidates.html?${createQuery(query)}`;
}

function createQuery(values) {
  const query = new URLSearchParams();
  query.set("lang", currentLang);
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  return query.toString();
}

function createConditionLabel({ direction, station, time, number, mode }) {
  const dir = direction === "west" ? t("west") : t("east");
  if (mode === "number" && number) {
    return currentLang === "ja" ? `${dir} / ${stationLabel(station)} / ${number}号` : `${dir} / ${stationLabel(station)} / No. ${number}`;
  }
  return currentLang === "ja" ? `${dir} / ${stationLabel(station)} / ${time}${t("around")}` : `${dir} / ${stationLabel(station)} / ${t("around")} ${time}`;
}

function getDirectionTrains(direction) {
  return data.trains.filter((train) => train.direction === direction);
}

function stationLabel(id) {
  const station = stationNames.get(id);
  if (!station) {
    return id;
  }
  return currentLang === "ja" ? station.ja || station.en || id : station.en || station.ja || id;
}

function spotLabel(spot, key) {
  if (currentLang === "en") {
    return spot[`${key}En`] || spot[key];
  }
  return spot[key];
}

function createPhotoCredit(spot) {
  if (spot.ownedPhoto || !spot.source || !spot.credit) {
    return "";
  }
  return `<a href="${spot.source}" target="_blank" rel="noreferrer">${t("photoCredit")}: ${spot.credit}</a>`;
}

function findTrain(key) {
  return data.trains.find((train) => trainKey(train) === key);
}

function trainKey(train) {
  return `${train.direction}-${train.type}-${train.number}-${train.originStation}`;
}

function uniqueCandidates(items) {
  const seen = new Set();
  return items.filter((item) => {
    const train = item.train;
    const key = `${train.direction}-${train.type}-${train.number}-${train.originStation}-${train.destination}-${item.departure || "pass"}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function formatTrainName(train) {
  const type = messages[currentLang].trainTypes[train.type] || train.type;
  return currentLang === "ja" ? `${type} ${train.number}号` : `${type} ${train.number}`;
}

function defaultDepartureTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:00`;
}

function defaultTravelDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getSeatSide(direction) {
  return direction === "west" ? t("seatWest") : t("seatEast");
}

function getSpotSeatSide(spot) {
  if (spot.side === "sea") {
    return currentLang === "ja" ? "A席側" : "Seat A";
  }
  if (spot.side === "both") {
    return currentLang === "ja" ? "両側目安" : "Either side";
  }
  return currentLang === "ja" ? "E席側" : "Seat E";
}

function getScenicTime(train, spot) {
  const center = getScenicCenterTime(train, spot);
  if (!center) {
    return t("estimate");
  }
  const timing = spot.timing || {};
  const before = timing.before ?? 2;
  const after = timing.after ?? 2;
  return createTimeWindow(center, before, after);
}

function getScenicCenterTime(train, spot) {
  const timing = spot.timing || {};
  if (timing.type === "fuji") {
    return getFujiCenterTime(train);
  }
  if (timing.type === "station") {
    return estimateStationTime(train, timing.station);
  }
  if (timing.type === "between") {
    return midpointTime(estimateStationTime(train, timing.start), estimateStationTime(train, timing.end));
  }
  if (timing.type === "stationDirectional") {
    const base = estimateStationTime(train, timing.station);
    if (!base) {
      return null;
    }
    const offset = train.direction === "west" ? timing.west : timing.east;
    return addMinutes(base, offset || 0);
  }
  return null;
}

function estimateStationTime(train, station) {
  if (train.times[station]) {
    return train.times[station];
  }
  const offsets = data.fujiOffsetsMinutes[train.direction] || {};
  const stationOffset = offsets[station];
  if (stationOffset === undefined) {
    return null;
  }
  const knownStation = Object.keys(train.times).find((id) => offsets[id] !== undefined);
  if (!knownStation) {
    return null;
  }
  const fujiCenter = addMinutes(train.times[knownStation], offsets[knownStation]);
  return addMinutes(fujiCenter, -stationOffset);
}

function getFujiCenterTime(train) {
  const offsets = data.fujiOffsetsMinutes[train.direction];
  const preferred = ["Shin-Fuji", "Mishima", "Shizuoka", "Shin-Yokohama", "Nagoya", "Kyoto", "Shin-Osaka", "Tokyo"];
  const station = preferred.find((id) => train.times[id] && offsets[id] !== undefined);
  if (!station) {
    return null;
  }
  return addMinutes(train.times[station], offsets[station]);
}

function createViewWindow(viewTime) {
  if (!viewTime) {
    return t("unknownTime");
  }
  return createTimeWindow(viewTime, 3, 4);
}

function createTimeWindow(centerTime, before, after) {
  const suffix = currentLang === "ja" ? "ごろ" : "";
  return `${addMinutes(centerTime, -before)}〜${addMinutes(centerTime, after)}${suffix}`;
}

function createCountdownLabel(viewTime) {
  if (!viewTime) {
    return t("countdownUnknown");
  }
  const now = new Date();
  const target = new Date(now);
  const [hours, minutes] = viewTime.split(":").map(Number);
  target.setHours(hours, minutes, 0, 0);
  const diff = Math.round((target.getTime() - now.getTime()) / 60000);
  if (diff > 0) {
    return t("countdownIn", { minutes: diff });
  }
  return t("countdownPast");
}

async function updateWeatherComment(viewTime, date) {
  const weatherNode = document.querySelector("#weather-comment");
  if (!weatherNode) {
    return;
  }
  try {
    const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=35.151&longitude=138.676&current=cloud_cover,precipitation,is_day&timezone=Asia%2FTokyo");
    if (!response.ok) {
      throw new Error("weather unavailable");
    }
    const weather = await response.json();
    weatherNode.textContent = createWeatherCommentFromData(weather.current, viewTime, date);
  } catch {
    weatherNode.textContent = t("weatherUnavailable");
  }
}

function createWeatherCommentFromData(current, viewTime, date) {
  const isNight = isDarkViewTime(viewTime, date);
  if (isNight) {
    return t("weatherNight");
  }
  const precipitation = Number(current?.precipitation || 0);
  if (precipitation > 0) {
    return t("weatherRain");
  }
  const cloudCover = Number(current?.cloud_cover ?? 100);
  return cloudCover >= 65 ? t("weatherCloudy") : t("weatherClear");
}

function isDarkViewTime(viewTime, dateValue = defaultTravelDate()) {
  if (!viewTime) {
    return false;
  }
  const minutes = timeToMinutes(viewTime);
  const { sunrise, sunset } = estimateSunriseSunsetMinutes(createLocalDate(dateValue), 35.151, 138.676);
  return minutes < sunrise + 15 || minutes > sunset - 15;
}

function createLocalDate(value) {
  const [year, month, day] = String(value || defaultTravelDate()).split("-").map(Number);
  if (!year || !month || !day) {
    return new Date();
  }
  return new Date(year, month - 1, day);
}

function estimateSunriseSunsetMinutes(date, latitude, longitude) {
  const day = dayOfYear(date);
  const declination = 23.44 * Math.sin(toRadians((360 / 365) * (day - 81)));
  const latRad = toRadians(latitude);
  const declRad = toRadians(declination);
  const zenith = toRadians(90.833);
  const cosHourAngle = (Math.cos(zenith) - Math.sin(latRad) * Math.sin(declRad)) / (Math.cos(latRad) * Math.cos(declRad));
  const hourAngle = toDegrees(Math.acos(Math.max(-1, Math.min(1, cosHourAngle))));
  const daylightHours = (2 * hourAngle) / 15;
  const solarNoon = 12 * 60 + (135 - longitude) * 4;
  return {
    sunrise: Math.round(solarNoon - (daylightHours * 60) / 2),
    sunset: Math.round(solarNoon + (daylightHours * 60) / 2),
  };
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

function addMinutes(time, minutes) {
  const total = timeToMinutes(time) + minutes;
  const normalized = ((total % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function midpointTime(start, end) {
  if (!start || !end) {
    return null;
  }
  return addMinutes(start, Math.round((timeToMinutes(end) - timeToMinutes(start)) / 2));
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 3600);
}

init();
