import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { computeTps } from "../src/tps-calc.js";

describe("computeTps", () => {
  it("computes TPS correctly for normal values", () => {
    assert.strictEqual(computeTps(150, 1.5), 100);
  });

  it("returns 0 when no tokens consumed", () => {
    assert.strictEqual(computeTps(0, 5), 0);
  });

  it("is exported from the module", () => {
    assert.strictEqual(typeof computeTps, "function");
  });

  it("handles very small elapsed times without returning Infinity", () => {
    const result = computeTps(10, 0.001);
    assert.ok(isFinite(result), "result should be finite");
    assert.ok(result > 0, "result should be positive");
  });

  it("returns a non-negative number", () => {
    assert.ok(computeTps(100, 2) >= 0);
  });
});
