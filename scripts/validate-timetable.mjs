import { readFile } from "node:fs/promises";
import vm from "node:vm";

const requiredTrainFields = ["type", "number", "direction", "originStation", "destination", "times"];
const timetablePath = new URL("../data/timetable.json", import.meta.url);
const timetableScriptPath = new URL("../data/timetable.js", import.meta.url);
const timetable = JSON.parse(await readFile(timetablePath, "utf8"));
const scriptContext = { window: {} };
vm.runInNewContext(await readFile(timetableScriptPath, "utf8"), scriptContext);

if (JSON.stringify(timetable) !== JSON.stringify(scriptContext.window.SHINKANSEN_TIMETABLE)) {
  throw new Error("data/timetable.js does not match data/timetable.json");
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
}

console.log(`Validated ${timetable.trains.length} trains and ${timetable.stations.length} stations.`);
