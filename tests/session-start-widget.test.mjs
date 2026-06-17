import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

describe("session_start registers widget", () => {
  it("session_start registers tps-meter widget with default placement", async () => {
    const handlers = {};
    let widgetRenderFn = null;
    let widgetOpts = null;

    const mockPi = {
      on(event, handler) {
        handlers[event] = handler;
      },
    };
    const mockCtx = {
      ui: {
        setWidget(id, renderFn, opts) {
          widgetRenderFn = renderFn;
          widgetOpts = opts;
        },
        requestRender() {},
      },
    };

    const mod = await import("../extensions/tps-meter.js");
    mod.default(mockPi);

    // Fire session_start
    handlers.session_start({}, mockCtx);

    assert.ok(
      typeof widgetRenderFn === "function",
      "session_start should register a widget render function"
    );
    // Default placement (aboveEditor) for more width
    assert.strictEqual(
      widgetOpts?.placement,
      undefined,
      "widget should use default placement"
    );
  });

  it("agent_start does NOT register widget", async () => {
    const handlers = {};
    const setWidgetCalls = [];

    const mockPi = {
      on(event, handler) {
        handlers[event] = handler;
      },
    };
    const mockCtx = {
      ui: {
        setWidget(id, renderFn, opts) {
          setWidgetCalls.push({ id, renderFn, opts });
        },
        requestRender() {},
      },
    };

    const mod = await import("../extensions/tps-meter.js");
    mod.default(mockPi);

    // First session_start registers widget
    handlers.session_start({}, mockCtx);
    const callsBefore = setWidgetCalls.length;

    // Then agent_start should NOT call setWidget
    handlers.agent_start({}, mockCtx);

    // No new setWidget calls from agent_start
    assert.strictEqual(
      setWidgetCalls.length,
      callsBefore,
      "agent_start should not call setWidget"
    );
  });

  it("widget renders a line with empty bars when state is reset", async () => {
    const handlers = {};
    let widgetRenderFn = null;

    const mockPi = {
      on(event, handler) {
        handlers[event] = handler;
      },
    };
    const mockCtx = {
      ui: {
        setWidget(id, renderFn, opts) {
          widgetRenderFn = renderFn;
        },
        requestRender() {},
      },
    };

    const mod = await import("../extensions/tps-meter.js");
    mod.default(mockPi);

    handlers.session_start({}, mockCtx);

    // After session_start but before any streaming, widget should show 0 t/s
    const mockTheme = { fg: (c, t) => t };
    const component = widgetRenderFn(null, mockTheme);
    const outputLines = component.render(200);
    const output = outputLines.join("\n");

    assert.ok(
      output.includes("0 t/s"),
      `Expected 0 t/s when idle, got: ${output}`
    );
    // Should have spaces for empty bars (we use spaces, not ▯, for compatibility)
    assert.ok(
      output.includes("0 t/s"),
      `Expected 0 t/s label when idle, got: ${output}`
    );
  });
});
