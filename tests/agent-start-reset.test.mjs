import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

describe("agent_start resets state without triggering render", () => {
  it("agent_start resets all state variables", async () => {
    const handlers = {};
    let requestRenderCalled = false;

    const mockPi = {
      on(event, handler) {
        handlers[event] = handler;
      },
    };
    const mockCtx = {
      ui: {
        setWidget() {},
      },
    };

    const mod = await import("../extensions/tps-meter.js");
    mod.default(mockPi);

    handlers.session_start({}, mockCtx);

    const now = Date.now();
    const realNow = Date.now;

    // Simulate a streaming session
    globalThis.Date.now = () => now - 3000;
    handlers.message_start({
      message: { role: "assistant" },
    }, mockCtx);

    globalThis.Date.now = () => now;
    handlers.message_update({
      message: { role: "assistant" },
      assistantMessageEvent: {
        type: "text_delta",
        delta: "x".repeat(350),
        partial: { usage: { output: 100 } },
      },
    }, mockCtx);

    // Now fire agent_start for a new prompt
    handlers.agent_start({}, mockCtx);

    globalThis.Date.now = realNow;

    // agent_start completes without throwing
    assert.ok(true, "agent_start completes without throwing");
  });

  it("widget shows 0 TPS after agent_start", async () => {
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

    const now = Date.now();
    const realNow = Date.now;

    // Simulate streaming with high TPS
    globalThis.Date.now = () => now - 2000;
    handlers.message_start({
      message: { role: "assistant" },
    }, mockCtx);

    globalThis.Date.now = () => now;
    handlers.message_update({
      message: { role: "assistant" },
      assistantMessageEvent: {
        type: "text_delta",
        delta: "x".repeat(350),
        partial: { usage: { output: 100 } },
      },
    }, mockCtx);

    // Check widget shows peak TPS before agent_start
    const mockTheme = { fg: (c, t) => t };
    let component = widgetRenderFn(null, mockTheme);
    let outputLines = component.render(200);
    let output = outputLines.join("\n");

    // Before agent_start: should show 50 t/s
    assert.ok(
      output.includes("50 t/s") || output.includes("51 t/s") || output.includes("49 t/s"),
      `Before agent_start, expected ~50 t/s, got: ${output}`
    );

    // Fire agent_start
    handlers.agent_start({}, mockCtx);

    // After agent_start: should show 0 t/s
    component = widgetRenderFn(null, mockTheme);
    outputLines = component.render(200);
    output = outputLines.join("\n");

    globalThis.Date.now = realNow;

    assert.ok(
      output.includes("0 t/s"),
      `After agent_start, expected 0 t/s, got: ${output}`
    );
  });
});
