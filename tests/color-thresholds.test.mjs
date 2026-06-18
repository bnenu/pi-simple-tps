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

describe("color-thresholds", () => {
  it("uses red (error) for low TPS below 15", () => {
    const output = renderMeterWithTheme(10, makeMockTheme());
    assert.ok(
      output.includes("[error]"),
      "should contain [error] (red) color markers for 10 TPS"
    );
    assert.ok(
      !output.includes("[success]"),
      "should NOT contain [success] for 10 TPS"
    );
  });

  it("uses yellow (warning) for mid TPS between 15 and 40", () => {
    const output = renderMeterWithTheme(25, makeMockTheme());
    assert.ok(
      output.includes("[warning]"),
      "should contain [warning] (yellow) color markers for 25 TPS"
    );
    assert.ok(
      !output.includes("[success]"),
      "should NOT contain [success] for 25 TPS (not in green zone)"
    );
  });

  it("uses green (success) for high TPS above 40", () => {
    const output = renderMeterWithTheme(50, makeMockTheme());
    assert.ok(
      output.includes("[success]"),
      "should contain [success] (green) color markers for 50 TPS"
    );
  });
});
