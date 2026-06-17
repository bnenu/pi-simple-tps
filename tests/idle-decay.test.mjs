import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { computeDecayedTps } from "../src/idle-decay.js";

describe("computeDecayedTps", () => {
  it("is exported from the module", () => {
    assert.strictEqual(typeof computeDecayedTps, "function");
  });

  it("returns peak TPS when within 10 seconds of last update", () => {
    const now = Date.now();
    const lastUpdate = now - 5000; // 5 seconds ago
    const result = computeDecayedTps(80, lastUpdate, now);
    assert.strictEqual(result, 80, "should still show peak TPS within 10s hold");
  });

  it("returns near-zero TPS when 15 seconds have passed", () => {
    const now = Date.now();
    const lastUpdate = now - 15000; // 15 seconds ago
    const result = computeDecayedTps(80, lastUpdate, now);
    assert.ok(result < 5, `should be near zero after 15s, got ${result}`);
  });

  it("returns 0 when more than 12 seconds have passed", () => {
    const now = Date.now();
    const lastUpdate = now - 12000; // exactly 12 seconds ago
    const result = computeDecayedTps(80, lastUpdate, now);
    assert.strictEqual(result, 0, "should be 0 after 12s");
  });

  it("decays linearly between 10s and 12s", () => {
    const now = Date.now();
    const lastUpdate = now - 11000; // 11 seconds ago (midpoint of decay)
    const result = computeDecayedTps(80, lastUpdate, now);
    // At 11s (midpoint of 10-12s decay), should be ~50% of peak
    assert.ok(result > 30 && result < 55, `midpoint decay should be ~40, got ${result}`);
  });

  it("returns 0 when peak TPS is 0", () => {
    const now = Date.now();
    const result = computeDecayedTps(0, now - 5000, now);
    assert.strictEqual(result, 0);
  });

  it("returns peak TPS when last update is just now", () => {
    const now = Date.now();
    const result = computeDecayedTps(60, now, now);
    assert.strictEqual(result, 60);
  });
});
