import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

describe("widget persists: agent_end does not clear widget", () => {
  it("agent_end does not call setWidget with undefined", async () => {
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

    handlers.session_start({}, mockCtx);
    handlers.agent_start({}, mockCtx);

    // Fire agent_end
    handlers.agent_end({}, mockCtx);

    // Check that NO setWidget call was made with undefined
    const clearCall = setWidgetCalls.find(
      call => call.id === "tps-meter" && call.renderFn === undefined
    );
    assert.strictEqual(
      clearCall,
      undefined,
      `agent_end should NOT clear widget with setWidget(widget, undefined), but found: ${JSON.stringify(clearCall)}`
    );

    // Verify widget was registered on session_start
    const registerCall = setWidgetCalls.find(
      call => call.id === "tps-meter" && typeof call.renderFn === "function"
    );
    assert.ok(
      registerCall,
      "widget should be registered on session_start"
    );
    // Widget is registered with default placement (aboveEditor) for more width
    assert.ok(
      registerCall,
      "widget should be registered on session_start"
    );
  });

  it("agent_end only resets state, does not hide widget", async () => {
    const handlers = {};
    let widgetRenderFn = null;
    let widgetCleared = false;

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

    // Simulate streaming
    const now = Date.now();
    const realNow = Date.now;
    globalThis.Date.now = () => now - 2000;
    handlers.message_start({
      message: { role: "assistant" },
    }, mockCtx);

    globalThis.Date.now = () => now;
    handlers.message_update({
      message: { role: "assistant" },
      assistantMessageEvent: {
        type: "text_delta",
        delta: "hello world",
        partial: { usage: { output: 100 } },
      },
    }, mockCtx);

    // Now fire agent_end
    handlers.agent_end({}, mockCtx);

    globalThis.Date.now = realNow;

    // Widget should still be registered (renderFn still exists)
    assert.ok(
      widgetRenderFn !== null,
      "widget render function should still exist after agent_end"
    );

    // Widget should render at 0 TPS after agent_end (state was reset)
    const mockTheme = { fg: (c, t) => t };
    const component = widgetRenderFn(null, mockTheme);
    const outputLines = component.render(200);
    const output = outputLines.join("\n");

    // After agent_end, state is reset, peakTps=0, isStreaming=false
    // So widget shows 0t/s (idle state)
    assert.ok(
      output.includes("0 t/s"),
      `widget should show 0t/s after agent_end (state reset), got: ${output}`
    );
  });
});
