import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

describe("idle decay in extension runtime", () => {
  it("widget render applies decay after message_end", async () => {
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

    handlers.session_start({}, mockCtx);

    const now = Date.now();
    const realNow = Date.now;

    // Simulate message_start
    globalThis.Date.now = () => now - 1000;
    handlers.message_start({
      message: { role: "assistant" },
    }, mockCtx);

    // Simulate message_update with ~80 tokens over 1s = 80 TPS
    globalThis.Date.now = () => now;
    handlers.message_update({
      message: { role: "assistant" },
      assistantMessageEvent: {
        type: "text_delta",
        delta: "x".repeat(280),
        partial: { usage: { output: 80 } },
      },
    }, mockCtx);

    // Simulate message_end
    handlers.message_end({
      message: { role: "assistant" },
    }, mockCtx);

    // Now simulate 15 seconds passing for decay
    const fifteenSecondsLater = now + 15000;
    globalThis.Date.now = () => fifteenSecondsLater;

    // Get the component from the widget factory, then render
    const mockTheme = { fg: (c, t) => t };
    const component = widgetRenderFn(null, mockTheme);
    const outputLines = component.render(200);
    const output = outputLines.join("\n");

    globalThis.Date.now = realNow;

    // After 15s of idle (12s decay window exceeded), TPS should be 0
    assert.ok(
      output.includes("0 t/s"),
      `widget should show 0 t/s after 15s idle, got: ${output}`
    );
  });

  it("widget render shows peak TPS during streaming", async () => {
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
    const twoSecondsAgo = now - 2000;

    const realNow = Date.now;
    globalThis.Date.now = () => twoSecondsAgo;
    handlers.message_start({
      message: { role: "assistant" },
    }, mockCtx);

    // ~100 tokens over 2s = 50 TPS
    globalThis.Date.now = () => now;
    handlers.message_update({
      message: { role: "assistant" },
      assistantMessageEvent: {
        type: "text_delta",
        delta: "y".repeat(350),
        partial: { usage: { output: 100 } },
      },
    }, mockCtx);

    const mockTheme = { fg: (c, t) => t };
    const component = widgetRenderFn(null, mockTheme);
    const outputLines = component.render(200);
    const output = outputLines.join("\n");

    globalThis.Date.now = realNow;

    // 100 tokens / 2s = 50 TPS
    assert.ok(
      output.includes("50 t/s"),
      `widget should show 50 t/s, got: ${output}`
    );
  });

  it("widget render shows decay at 11 seconds (midpoint)", async () => {
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

    const baseTime = Date.now();
    const realNow = Date.now;

    // Message starts at baseTime - 3s
    globalThis.Date.now = () => baseTime - 3000;
    handlers.message_start({
      message: { role: "assistant" },
    }, mockCtx);

    // Update at baseTime with ~150 tokens (50 TPS over 3s)
    globalThis.Date.now = () => baseTime;
    handlers.message_update({
      message: { role: "assistant" },
      assistantMessageEvent: {
        type: "text_delta",
        delta: "z".repeat(525),
        partial: { usage: { output: 150 } },
      },
    }, mockCtx);

    // Message ends at baseTime
    handlers.message_end({
      message: { role: "assistant" },
    }, mockCtx);

    // Simulate 11 seconds later (1s into 2s decay window)
    globalThis.Date.now = () => baseTime + 11000;

    const mockTheme = { fg: (c, t) => t };
    const component = widgetRenderFn(null, mockTheme);
    const outputLines = component.render(200);
    const output = outputLines.join("\n");

    globalThis.Date.now = realNow;

    // At 11s (1s into 2s decay from peak 50), TPS should be ~25
    assert.ok(
      output.includes("25 t/s") || output.includes("24 t/s") || output.includes("26 t/s"),
      `widget should show ~25 t/s at decay midpoint, got: ${output}`
    );
  });

  it("widget render shows TPS when partial.usage is available", async () => {
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
    const twoSecondsAgo = now - 2000;

    const realNow = Date.now;
    globalThis.Date.now = () => twoSecondsAgo;
    handlers.message_start({
      message: { role: "assistant" },
    }, mockCtx);

    // Simulate message_update with partial.usage
    globalThis.Date.now = () => now;
    handlers.message_update({
      message: { role: "assistant" },
      assistantMessageEvent: {
        type: "text_delta",
        delta: "",
        partial: { usage: { output: 100 } },
      },
    }, mockCtx);

    const mockTheme = { fg: (c, t) => t };
    const component = widgetRenderFn(null, mockTheme);
    const outputLines = component.render(200);
    const output = outputLines.join("\n");

    globalThis.Date.now = realNow;

    // 100 tokens / 2s = 50 TPS
    assert.ok(
      output.includes("50 t/s"),
      `widget should show 50 t/s from partial.usage, got: ${output}`
    );
  });
});
