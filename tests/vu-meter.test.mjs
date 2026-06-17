import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { renderVUMeter } from "../src/vu-meter.js";

describe("renderVUMeter", () => {
  it("is exported from the module", () => {
    assert.strictEqual(typeof renderVUMeter, "function");
  });

  it("renders 10 filled and 10 empty bars at 50 TPS", () => {
    const output = renderVUMeter(50);
    const filled = (output.match(/▮/g) || []).length;
    const empty = (output.match(/▯/g) || []).length;
    assert.strictEqual(filled, 10, "should have 10 filled bars at 50 TPS");
    assert.strictEqual(empty, 10, "should have 10 empty bars at 50 TPS");
  });

  it("renders all 20 empty bars at 0 TPS", () => {
    const output = renderVUMeter(0);
    const filled = (output.match(/▮/g) || []).length;
    const empty = (output.match(/▯/g) || []).length;
    assert.strictEqual(filled, 0, "should have 0 filled bars at 0 TPS");
    assert.strictEqual(empty, 20, "should have 20 empty bars at 0 TPS");
  });

  it("renders all 20 filled bars at 100 TPS", () => {
    const output = renderVUMeter(100);
    const filled = (output.match(/▮/g) || []).length;
    const empty = (output.match(/▯/g) || []).length;
    assert.strictEqual(filled, 20, "should have 20 filled bars at 100 TPS");
    assert.strictEqual(empty, 0, "should have 0 empty bars at 100 TPS");
  });

  it("contains TPS label with t/s suffix", () => {
    const output = renderVUMeter(50);
    assert.ok(output.includes("50 t/s"), "output should contain '50 t/s'");
  });

  it("caps display at 100 TPS for values above 100", () => {
    const output = renderVUMeter(150);
    const filled = (output.match(/▮/g) || []).length;
    assert.strictEqual(filled, 20, "should cap at 20 filled bars for TPS > 100");
  });
});
