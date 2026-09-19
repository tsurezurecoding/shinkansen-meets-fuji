import { readFile } from "node:fs/promises";
import vm from "node:vm";

const requiredTrainFields = ["type", "number", "direction", "originStation", "destination", "times"];
const timetablePath = new URL("../data/timetable.json", import.meta.url);
const timetableScriptPath = new URL("../data/timetable.js", import.meta.url);
const scriptContext = { window: {} };
vm.runInNewContext(await readFile(timetableScriptPath, "utf8"), scriptContext);
const timetable = scriptContext.window.SHINKANSEN_TIMETABLE;

try {
  const jsonTimetable = JSON.parse(await readFile(timetablePath, "utf8"));
  if (JSON.stringify(jsonTimetable) !== JSON.stringify(timetable)) {
    throw new Error("data/timetable.js does not match data/timetable.json");
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

if (!Array.isArray(timetable.stations) || !timetable.stations.length) {
  throw new Error("stations must be a non-empty array");
}

if (!Array.isArray(timetable.trains) || !timetable.trains.length) {
  throw new Error("trains must be a non-empty array");
}

const stationIds = new Set(timetable.stations.map((station) => station.id));

for (const train of timetable.trains) {
  for (const field of requiredTrainFields) {
    if (train[field] === undefined) {
      throw new Error(`Train is missing ${field}: ${JSON.stringify(train)}`);
    }
  }

  if (!stationIds.has(train.originStation)) {
    throw new Error(`${train.type} ${train.number} has unknown originStation ${train.originStation}`);
  }

  if (!stationIds.has(train.destination)) {
    throw new Error(`${train.type} ${train.number} has unknown destination ${train.destination}`);
  }

  for (const station of Object.keys(train.times)) {
    if (!stationIds.has(station)) {
      throw new Error(`${train.type} ${train.number} has unknown station ${station}`);
    }
  }

  // arrivals: 途中停車駅の着時刻。発時刻（times）を持つ途中駅だけに置き、発より後にならない
  if (train.arrivals !== undefined) {
    for (const [station, arr] of Object.entries(train.arrivals)) {
      const label = `${train.type} ${train.number} arrival at ${station}`;
      if (!train.times[station]) throw new Error(`${label} has no departure in times`);
      if (station === train.originStation || station === train.destination) {
        throw new Error(`${label} must not be the origin or destination`);
      }
      if (!/^\d{2}:\d{2}$/.test(arr)) throw new Error(`${label} is not HH:MM: ${arr}`);
      const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
      const dwell = (toMin(train.times[station]) - toMin(arr) + 1440) % 1440;
      if (dwell > 30) throw new Error(`${label} (${arr}) is not shortly before its departure ${train.times[station]}`);
    }
  }
}

console.log(`Validated ${timetable.trains.length} trains and ${timetable.stations.length} stations.`);
