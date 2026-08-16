import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  generateSpotPage,
  planSpotPage,
  writeChangedSpotPagePlans,
} from "./generate-spot-pages.mjs";

test("unchanged spot page plans do not invoke the writer", () => {
  const plan = planSpotPage("tokyo-tower", "ja", { requireExisting: true });
  const writes = [];

  const changed = writeChangedSpotPagePlans([plan], (writtenPlan) => writes.push(writtenPlan));

  assert.deepEqual(changed, []);
  assert.deepEqual(writes, []);
});

test("generateSpotPage leaves an unchanged output timestamp untouched", () => {
  const plan = planSpotPage("tokyo-tower", "ja", { requireExisting: true });
  const before = fs.statSync(plan.outputPath).mtimeNs;

  const outputPath = generateSpotPage("tokyo-tower", "ja", { requireExisting: true });

  assert.equal(outputPath, plan.outputPath);
  assert.equal(fs.statSync(plan.outputPath).mtimeNs, before);
});

test("changed spot page plans still invoke the writer", () => {
  const plan = planSpotPage("tokyo-tower", "ja", { requireExisting: true });
  const writes = [];
  const changedPlan = { ...plan, generatedHTML: `${plan.generatedHTML}\n` };

  const changed = writeChangedSpotPagePlans([changedPlan], (writtenPlan) => writes.push(writtenPlan));

  assert.equal(changed.length, 1);
  assert.deepEqual(writes, [changedPlan]);
});
