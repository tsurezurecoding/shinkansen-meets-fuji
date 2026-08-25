import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const worker = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");

test("the current application does not register a service worker", () => {
  assert.doesNotMatch(app, /navigator\.serviceWorker\.register/);
  assert.doesNotMatch(app, /registerServiceWorker/);
});

test("the retirement worker never intercepts requests or stores responses", () => {
  assert.doesNotMatch(worker, /addEventListener\(["']fetch["']/);
  assert.doesNotMatch(worker, /caches\.(?:open|match)/);
  assert.doesNotMatch(worker, /cache\.put/);
  assert.match(worker, /registration\.unregister/);
});
