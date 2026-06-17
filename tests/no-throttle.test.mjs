import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

describe("no throttle: widget updates via closure variables on TUI render cycle", () => {
  it("scheduleRender does not call requestRender (API not available)", async () => {
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
        // No requestRender - it doesn't exist on the real API
      },
    };

    const mod = await import("../extensions/tps-meter.js");
    mod.default(mockPi);

    handlers.session_start({}, mockCtx);

    const now = Date.now();
    const realNow = Date.now;

    // message_start
    globalThis.Date.now = () => now - 3000;
    handlers.message_start({
      message: { role: "assistant" },
    }, mockCtx);

    // Fire message_update events — should not crash even without requestRender
    for (let i = 0; i < 5; i++) {
      globalThis.Date.now = () => now + i * 10;
      handlers.message_update({
        message: { role: "assistant" },
        assistantMessageEvent: {
          type: "text_delta",
          delta: "hello world",
          partial: { usage: { output: (i + 1) * 10 } },
        },
      }, mockCtx);
    }

    globalThis.Date.now = realNow;

    // Should not throw - scheduleRender is a no-op
    assert.ok(true, "message_update completes without throwing");
  });

  it("widget renders correct TPS via closure variables", async () => {
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
      },
    };

    const mod = await import("../extensions/tps-meter.js");
    mod.default(mockPi);

    handlers.session_start({}, mockCtx);

    const now = Date.now();
    const realNow = Date.now;

    // Simulate streaming: 100 tokens over 2s = 50 TPS
    globalThis.Date.now = () => now - 2000;
    handlers.message_start({
      message: { role: "assistant" },
    }, mockCtx);

    globalThis.Date.now = () => now;
    handlers.message_update({
      message: { role: "assistant" },
      assistantMessageEvent: {
        type: "text_delta",
        delta: "",
        partial: { usage: { output: 100 } },
      },
    }, mockCtx);

    globalThis.Date.now = realNow;

    // Render widget - reads closure variables updated by message_update
    const mockTheme = { fg: (c, t) => t };
    const component = widgetRenderFn(null, mockTheme);
    const outputLines = component.render(200);
    const output = outputLines.join("\n");

    // 100 tokens / 2s = 50 TPS
    assert.ok(
      output.includes("50 t/s"),
      `Widget should show 50 t/s via closure variables, got: ${output}`
    );
  });

  it("no throttle constant exists in extension", async () => {
    const code = await import("fs").then(fs =>
      fs.readFileSync("./extensions/tps-meter.js", "utf8")
    );

    // The throttle constant should be removed
    assert.ok(
      !code.includes("RENDER_THROTTLE_MS"),
      "RENDER_THROTTLE_MS constant should be removed from extension"
    );
  });
});
