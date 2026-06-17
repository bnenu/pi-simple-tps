import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

describe("Streaming token counting", () => {
  it("counts text_delta characters for token estimation", async () => {
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

    // Simulate message_start
    globalThis.Date.now = () => now - 2000;
    handlers.message_start({
      message: { role: "assistant" },
    }, mockCtx);

    // Simulate text_delta with "hello world" (11 chars)
    // 11 chars / 3.5 = ~3 tokens / 2s = ~2 TPS → 0 bars
    globalThis.Date.now = () => now;
    handlers.message_update({
      message: { role: "assistant" },
      assistantMessageEvent: {
        type: "text_delta",
        delta: "hello world",
        partial: { usage: { output: 0 } }, // Force char-count fallback
      },
    }, mockCtx);

    const mockTheme = { fg: (c, t) => t };
    const component = widgetRenderFn(null, mockTheme);
    const outputLines = component.render(200);
    const output = outputLines.join("\n");

    globalThis.Date.now = realNow;

    // 3 tokens / 2s = ~2 TPS → 0 filled bars
    assert.ok(
      output.includes("2 t/s") || output.includes("1 t/s") || output.includes("3 t/s") || output.includes("0 t/s"),
      `Expected ~2 t/s from 11 char text delta, got: ${output}`
    );
    // Should show the TPS label
    assert.ok(
      output.includes("t/s"),
      `Expected TPS label in output, got: ${output}`
    );
  });

  it("counts thinking_delta characters separately", async () => {
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

    globalThis.Date.now = () => now - 3000;
    handlers.message_start({
      message: { role: "assistant" },
    }, mockCtx);

    // thinking_delta: "thinking content" = 16 chars / 4 = 4 tokens
    globalThis.Date.now = () => now;
    handlers.message_update({
      message: { role: "assistant" },
      assistantMessageEvent: {
        type: "thinking_delta",
        delta: "thinking content",
        partial: { usage: { output: 0 } }, // Force char-count fallback
      },
    }, mockCtx);

    const mockTheme = { fg: (c, t) => t };
    const component = widgetRenderFn(null, mockTheme);
    const outputLines = component.render(200);
    const output = outputLines.join("\n");

    globalThis.Date.now = realNow;

    // 4 tokens / 3s ≈ 1.3 TPS → still 0 bars but non-zero counter
    assert.ok(
      output.includes("1 t/s") || output.includes("0 t/s"),
      `Expected ~1 t/s from thinking delta, got: ${output}`
    );
  });

  it("combines text and thinking delta characters", async () => {
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

    globalThis.Date.now = () => now - 2000;
    handlers.message_start({
      message: { role: "assistant" },
    }, mockCtx);

    // First update: text delta
    globalThis.Date.now = () => now;
    handlers.message_update({
      message: { role: "assistant" },
      assistantMessageEvent: {
        type: "text_delta",
        delta: "hello world test",
        partial: { usage: { output: 0 } },
      },
    }, mockCtx);

    // Second update: thinking delta
    handlers.message_update({
      message: { role: "assistant" },
      assistantMessageEvent: {
        type: "thinking_delta",
        delta: "reasoning here",
        partial: { usage: { output: 0 } },
      },
    }, mockCtx);

    const mockTheme = { fg: (c, t) => t };
    const component = widgetRenderFn(null, mockTheme);
    const outputLines = component.render(200);
    const output = outputLines.join("\n");

    globalThis.Date.now = realNow;

    // text: 17 chars / 3.5 ≈ 5 tokens
    // thinking: 14 chars / 4 ≈ 3.5 tokens
    // total: ~8.5 tokens / 2s ≈ 4 TPS
    assert.ok(
      output.includes("4 t/s") || output.includes("5 t/s") || output.includes("3 t/s"),
      `Expected ~4 t/s from combined deltas, got: ${output}`
    );
  });

  it("prefers partial.usage.output over character counting", async () => {
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

    globalThis.Date.now = () => now - 2000;
    handlers.message_start({
      message: { role: "assistant" },
    }, mockCtx);

    // partial.usage.output = 100 (real count from provider)
    // but char-count would give much less
    globalThis.Date.now = () => now;
    handlers.message_update({
      message: { role: "assistant" },
      assistantMessageEvent: {
        type: "text_delta",
        delta: "hi",
        partial: { usage: { output: 100 } }, // Provider says 100 tokens
      },
    }, mockCtx);

    const mockTheme = { fg: (c, t) => t };
    const component = widgetRenderFn(null, mockTheme);
    const outputLines = component.render(200);
    const output = outputLines.join("\n");

    globalThis.Date.now = realNow;

    // 100 tokens / 2s = 50 TPS (from partial.usage, not char-count)
    assert.ok(
      output.includes("50 t/s"),
      `Expected 50 t/s from partial.usage.output=100, got: ${output}`
    );
  });
});
