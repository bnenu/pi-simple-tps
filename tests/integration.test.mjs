import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { renderMeterWithTheme } from "../src/render.js";

// Mock theme that wraps text with color markers for testing
function makeMockTheme() {
  return {
    fg(color, text) {
      return `[${color}]${text}[/${color}]`;
    },
  };
}

describe("renderMeterWithTheme", () => {
  it("is exported from the module", () => {
    assert.strictEqual(typeof renderMeterWithTheme, "function");
  });

  it("applies red (error) color for low TPS below 15", () => {
    const output = renderMeterWithTheme(10, makeMockTheme());
    assert.ok(
      output.includes("[error]"),
      "should contain error (red) color markers for 10 TPS"
    );
  });

  it("applies yellow (warning) color for mid TPS between 15 and 40", () => {
    const output = renderMeterWithTheme(25, makeMockTheme());
    assert.ok(
      output.includes("[warning]"),
      "should contain warning (yellow) color markers for 25 TPS"
    );
  });

  it("applies green (success) color for high TPS above 40", () => {
    const output = renderMeterWithTheme(50, makeMockTheme());
    assert.ok(
      output.includes("[success]"),
      "should contain success (green) color markers for 50 TPS"
    );
  });

  it("shows empty bars with no color at 0 TPS", () => {
    const output = renderMeterWithTheme(0, makeMockTheme());
    // At 0 TPS, no bars are filled, so no color markers should appear for bars
    const filledBars = (output.match(/▮/g) || []).length;
    assert.strictEqual(filledBars, 0, "should have no filled bars at 0 TPS");
  });

  it("contains the TPS label", () => {
    const output = renderMeterWithTheme(75, makeMockTheme());
    assert.ok(output.includes("75 t/s"), "should contain TPS label");
  });

  it("contains the lightning bolt prefix", () => {
    const output = renderMeterWithTheme(50, makeMockTheme());
    assert.ok(output.includes("⚡"), "should contain lightning bolt");
  });
});
