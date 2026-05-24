const data = window.SHINKANSEN_TIMETABLE;
const screen = document.body.dataset.screen;
const params = new URLSearchParams(window.location.search);
const toast = document.querySelector("#toast");

const stationNames = new Map(data.stations.map((station) => [station.id, station.ja || station.en || station.id]));

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
  "Kyoto",
  "Shin-Osaka",
];

const scenicSpots = [
  {
    id: "fuji",
    name: "富士山",
    area: "三島〜新富士",
    after: "Mishima",
    before: "Shin-Fuji",
    westAfter: "Mishima",
    eastAfter: "Shin-Fuji",
    note: "最優先の見どころ。通知対象にする。",
    detail: "車窓から見える時間は短い。新富士前後では、窓の外を見る準備をしておく価値がある。",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Shinkansen_N700_with_Mount_Fuji.jpg?width=900",
    credit: "Wikimedia Commons / Shinkansen N700 with Mount Fuji",
    source: "https://commons.wikimedia.org/wiki/File:Shinkansen_N700_with_Mount_Fuji.jpg",
  },
  {
    id: "odawara",
    name: "小田原城と相模湾",
    area: "新横浜〜熱海",
    after: "Odawara",
    before: "Atami",
    westAfter: "Odawara",
    eastAfter: "Atami",
    note: "東京側から旅情へ切り替わる区間。",
    detail: "市街地から海側へ景色が開き始める。城そのものは一瞬なので、駅前後の目安として扱う。",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Odawara_Castle_01.jpg?width=900",
    credit: "Wikimedia Commons / Odawara Castle 01",
    source: "https://commons.wikimedia.org/wiki/File:Odawara_Castle_01.jpg",
  },
  {
    id: "tea",
    name: "静岡の茶畑",
    area: "新富士〜静岡",
    after: "Shin-Fuji",
    before: "Shizuoka",
    westAfter: "Shin-Fuji",
    eastAfter: "Shizuoka",
    note: "富士山の前後で拾える道草候補。",
    detail: "季節や天候で印象が変わる。富士山が見えにくい日でも、静岡らしい車窓として案内できる。",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Tea_plantation_in_Shizuoka.jpg?width=900",
    credit: "Wikimedia Commons / Tea plantation in Shizuoka",
    source: "https://commons.wikimedia.org/wiki/File:Tea_plantation_in_Shizuoka.jpg",
  },
  {
    id: "hamanako",
    name: "浜名湖",
    area: "浜松〜豊橋",
    after: "Hamamatsu",
    before: "Toyohashi",
    westAfter: "Hamamatsu",
    eastAfter: "Toyohashi",
    note: "西へ進む旅のもう一つの窓景色。",
    detail: "水面が広く、天候が良い日は移動中の気分転換になる。富士山以外の通知候補として育てる。",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Lake_Hamana.JPG?width=900",
    credit: "Wikimedia Commons / Lake Hamana",
    source: "https://commons.wikimedia.org/wiki/File:Lake_Hamana.JPG",
  },
];

function init() {
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

function initConditions() {
  const stationSelect = document.querySelector("#station-select");
  const timeInput = document.querySelector("#time-input");
  const numberInput = document.querySelector("#number-input");
  let selectedDirection = params.get("direction") || "west";

  setDirectionButtons(selectedDirection, (direction) => {
    selectedDirection = direction;
    renderStations(stationSelect, selectedDirection);
  });
  renderStations(stationSelect, selectedDirection);
  timeInput.value = params.get("time") || defaultDepartureTime();
  if (params.get("station")) {
    stationSelect.value = params.get("station");
  }
  numberInput.value = params.get("number") || "";

  document.querySelector("#search-time").addEventListener("click", () => {
    goToCandidates({ direction: selectedDirection, station: stationSelect.value, time: timeInput.value, mode: "time" });
  });
  document.querySelector("#search-number").addEventListener("click", () => {
    const number = numberInput.value.trim().replace(/[^\d]/g, "");
    if (!number) {
      showToast("列車番号を入力してください。");
      return;
    }
    goToCandidates({ direction: selectedDirection, station: stationSelect.value, time: timeInput.value, number, mode: "number" });
  });
}

function initCandidates() {
  const direction = params.get("direction") || "west";
  const station = params.get("station") || (direction === "west" ? "Shin-Yokohama" : "Nagoya");
  const time = params.get("time") || defaultDepartureTime();
  const number = params.get("number") || "";
  const mode = params.get("mode") || (number ? "number" : "time");
  const candidates = getCandidates({ direction, station, time, number, mode });

  document.querySelector("#candidate-condition").textContent = createConditionLabel({ direction, station, time, number, mode });
  document.querySelector("#candidate-window-label").textContent = `${stationNames.get(station)} ${time} 前後`;
  const conditionHref = `index.html?${createQuery({ direction, station, time, number })}`;
  document.querySelector("#back-to-conditions").href = conditionHref;
  document.querySelector("#step-to-conditions").href = conditionHref;

  const goPrevious = () => {
    goToCandidates({ direction, station, time: addMinutes(time, -20), number, mode: "time" });
  };
  const goNext = () => {
    goToCandidates({ direction, station, time: addMinutes(time, 20), number, mode: "time" });
  };
  document.querySelector("#prev-window").addEventListener("click", goPrevious);
  document.querySelector("#next-window").addEventListener("click", goNext);
  document.querySelector("#prev-window-bottom").addEventListener("click", goPrevious);
  document.querySelector("#next-window-bottom").addEventListener("click", goNext);
  renderCandidates(candidates, { direction, station, time, number, mode });
}

function initDetail() {
  const direction = params.get("direction") || "west";
  const station = params.get("station") || (direction === "west" ? "Shin-Yokohama" : "Nagoya");
  const time = params.get("time") || defaultDepartureTime();
  const number = params.get("number") || "";
  const mode = params.get("mode") || (number ? "number" : "time");
  const train = findTrain(params.get("train"));
  if (!train) {
    window.location.href = `candidates.html?${createQuery({ direction, station, time })}`;
    return;
  }

  const conditionHref = `index.html?${createQuery({ direction, station, time, number })}`;
  const candidateHref = `candidates.html?${createQuery({ direction, station, time, number, mode })}`;
  document.querySelector("#back-to-candidates").href = candidateHref;
  document.querySelector("#step-to-conditions").href = conditionHref;
  document.querySelector("#step-to-candidates").href = candidateHref;
  document.querySelector("#detail-back-bottom").href = candidateHref;
  document.querySelector("#detail-edit-condition").href = conditionHref;
  renderDetail(train, station);
}

function setDirectionButtons(selectedDirection, onChange) {
  document.querySelectorAll("[data-direction]").forEach((button) => {
    button.classList.toggle("active", button.dataset.direction === selectedDirection);
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-direction]").forEach((item) => item.classList.toggle("active", item === button));
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
  stationSelect.innerHTML = ordered.map((station) => `<option value="${station}">${stationNames.get(station)}</option>`).join("");
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
      const departureText = item.departure ? `${stationNames.get(item.station)} ${item.departure}発` : `${stationNames.get(item.station)}は停車しません`;
      const arrivalStation = stationNames.get(train.destination);
      const arrivalTime = train.times[train.destination] || "";
      const href = `detail.html?${createQuery({ ...context, train: trainKey(train) })}`;
      return `
        <a class="candidate" href="${href}">
          <div class="candidate-main">
            <strong>${formatTrainName(train)}</strong>
            <span>選択</span>
          </div>
          <div class="candidate-meta">
            <span>${departureText}</span>
            <span>${arrivalStation} ${arrivalTime}着</span>
          </div>
        </a>
      `;
    })
    .join("");
}

function renderDetail(train, station) {
  const viewTime = getFujiCenterTime(train);
  document.querySelector("#train-name").textContent = `${formatTrainName(train)} / ${stationNames.get(train.originStation)} → ${stationNames.get(train.destination)}`;
  document.querySelector("#fuji-window").textContent = createViewWindow(viewTime);
  document.querySelector("#countdown").textContent = createCountdownLabel(viewTime);
  document.querySelector("#seat-side").textContent = getSeatSide(train.direction);
  document.querySelector("#boarding-info").textContent = train.times[station] ? `${stationNames.get(station)} ${train.times[station]}発` : `${stationNames.get(station)}は停車しません`;
  document.querySelector("#route-plan").innerHTML = createRoutePlan(train, station, "fuji");
  document.querySelector("#weather-comment").textContent = createWeatherComment();
  document.querySelector("#visibility-note").textContent = "天候、遅延、日の入り後、窓枠や防音壁により見え方は変わります。本番では天候・日の入りも考慮します。";
  document.querySelector("#demo-notify").addEventListener("click", () => showToast("本番ではWeb Pushでスマホへ通知します。まずは5分前通知を想定します。"));
  document.querySelector("#route-plan").addEventListener("click", (event) => {
    const spotButton = event.target.closest("[data-spot-id]");
    if (spotButton) {
      selectSpot(spotButton.dataset.spotId, train);
    }
  });
}

function createRoutePlan(train, boardingStation, selectedSpotId) {
  const orderedStations = train.direction === "west" ? primaryStations : [...primaryStations].reverse();
  const stopStations = orderedStations.filter((station) => train.times[station]);
  const rows = stopStations
    .flatMap((station, index) => {
      const nextStation = stopStations[index + 1] || null;
      const suffix = station === boardingStation ? "乗車" : station === "Shin-Fuji" || station === "Mishima" ? "富士山目安" : "主要駅";
      const stationRow = `
        <div class="route-row ${station === boardingStation ? "boarding" : ""}">
          <div class="route-time">${train.times[station]}</div>
          <div>
            <strong>${stationNames.get(station)}</strong>
            <span>${suffix}</span>
          </div>
        </div>
      `;
      return [stationRow, ...createScenicRowsBetween(train, station, nextStation, selectedSpotId)];
    });
  return rows.join("");
}

function createScenicRowsBetween(train, station, nextStation, selectedSpotId) {
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
    .filter((spot) => isSpotBetween(spot, startIndex, endIndex, orderedStations))
    .map((spot) => {
      const time = getScenicTime(train, spot);
      return `
        <button class="route-row scenic ${spot.id === selectedSpotId ? "active" : ""} ${spot.id === "fuji" ? "fuji" : ""}" type="button" data-spot-id="${spot.id}">
          <div class="route-time">${time}</div>
          <div>
            <strong>${spot.name}</strong>
            <span>${spot.area}</span>
            <p>${spot.note}</p>
          </div>
        </button>
      `;
    });
}

function isSpotBetween(spot, startIndex, endIndex, orderedStations) {
  const spotStart = orderedStations.indexOf(spot.after);
  const spotEnd = orderedStations.indexOf(spot.before);
  if (spotStart === -1 && spotEnd === -1) {
    return false;
  }
  const low = Math.min(startIndex, endIndex);
  const high = Math.max(startIndex, endIndex);
  return (spotStart > low && spotStart <= high) || (spotEnd > low && spotEnd <= high);
}

function selectSpot(spotId, train) {
  const spot = scenicSpots.find((item) => item.id === spotId) || scenicSpots[0];
  document.querySelectorAll("[data-spot-id]").forEach((button) => {
    button.classList.toggle("active", button.dataset.spotId === spot.id);
  });
  const spotDetail = document.querySelector("#spot-detail");
  spotDetail.hidden = false;
  document.querySelector("#spot-image").src = spot.image;
  document.querySelector("#spot-image").alt = `${spot.name}のサンプル写真`;
  document.querySelector("#spot-title").textContent = `${spot.name} / ${getScenicTime(train, spot)}`;
  document.querySelector("#spot-description").textContent = spot.detail;
  document.querySelector("#spot-credit").href = spot.source;
  document.querySelector("#spot-credit").textContent = spot.credit;
}

function goToCandidates(query) {
  window.location.href = `candidates.html?${createQuery(query)}`;
}

function createQuery(values) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  return query.toString();
}

function createConditionLabel({ direction, station, time, number, mode }) {
  const dir = direction === "west" ? "下り" : "上り";
  if (mode === "number" && number) {
    return `${dir} / ${stationNames.get(station)} / ${number}号`;
  }
  return `${dir} / ${stationNames.get(station)} / ${time}発付近`;
}

function getDirectionTrains(direction) {
  return data.trains.filter((train) => train.direction === direction);
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
  return `${train.type} ${train.number}号`;
}

function defaultDepartureTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:00`;
}

function getSeatSide(direction) {
  return direction === "west" ? "E席側 / 進行方向右側" : "E席側 / 進行方向左側";
}

function getScenicTime(train, spot) {
  if (spot.id === "fuji") {
    return getFujiCenterTime(train) || "目安";
  }
  if (spot.id === "hamanako") {
    return midpointTime(train.times.Hamamatsu, train.times.Toyohashi) || "目安";
  }
  if (spot.id === "odawara") {
    return train.times.Odawara || midpointTime(train.times["Shin-Yokohama"], train.times.Atami) || "目安";
  }
  if (spot.id === "tea") {
    return midpointTime(train.times["Shin-Fuji"], train.times.Shizuoka) || train.times.Shizuoka || "目安";
  }
  return "目安";
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
    return "時刻未定";
  }
  return `${addMinutes(viewTime, -3)}〜${addMinutes(viewTime, 4)}ごろ`;
}

function createCountdownLabel(viewTime) {
  if (!viewTime) {
    return "通知時刻は未定です";
  }
  const now = new Date();
  const target = new Date(now);
  const [hours, minutes] = viewTime.split(":").map(Number);
  target.setHours(hours, minutes, 0, 0);
  const diff = Math.round((target.getTime() - now.getTime()) / 60000);
  if (diff > 0) {
    return `あと約${diff}分`;
  }
  return "今日の見どころ時刻は過ぎています";
}

function createWeatherComment() {
  return "天気連携は未接続です。正式版では新富士付近の雲量・降水・日の入りを見て、見えそうかを一言で出します。";
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
