import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

describe("token path: message_update reads correct event paths", () => {
  it("uses event.assistantMessageEvent.partial.usage.output (tier 1)", async () => {
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

    // Simulate: partial.usage.output = 100 tokens, elapsed = 2s → 50 TPS
    globalThis.Date.now = () => now;
    handlers.message_update({
      message: { role: "assistant" },
      assistantMessageEvent: {
        type: "text_delta",
        delta: "",
        partial: {
          usage: { output: 100 },
        },
      },
    }, mockCtx);

    globalThis.Date.now = realNow;

    // Call the widget factory to get the component, then render
    const mockTheme = { fg: (c, t) => t };
    const component = widgetRenderFn(null, mockTheme);
    const outputLines = component.render(200);
    const output = outputLines.join("\n");

    // 100 tokens / 2s = 50 TPS
    assert.ok(
      output.includes("50 t/s"),
      `Expected 50 t/s from partial.usage.output, got: ${output}`
    );
  });

  it("uses event.assistantMessageEvent.partial.usage.output for thinking deltas", async () => {
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

    // Simulate: partial.usage.output = 150 tokens, elapsed = 3s → 50 TPS
    globalThis.Date.now = () => now;
    handlers.message_update({
      message: { role: "assistant" },
      assistantMessageEvent: {
        type: "thinking_delta",
        delta: "thinking content",
        partial: {
          usage: { output: 150 },
        },
      },
    }, mockCtx);

    globalThis.Date.now = realNow;

    const mockTheme = { fg: (c, t) => t };
    const component = widgetRenderFn(null, mockTheme);
    const outputLines = component.render(200);
    const output = outputLines.join("\n");

    // 150 tokens / 3s = 50 TPS
    assert.ok(
      output.includes("50 t/s"),
      `Expected 50 t/s from partial.usage on thinking_delta, got: ${output}`
    );
  });

  it("does NOT use event.message.usage.output (wrong path)", async () => {
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

    // Only message.usage.output is set, partial.usage.output is 0
    // If code reads from message.usage.output (wrong path), this would work
    // But correct path is assistantMessageEvent.partial.usage.output
    globalThis.Date.now = () => now;
    handlers.message_update({
      message: {
        role: "assistant",
        usage: { output: 100 },  // wrong path - this should NOT be used
      },
      assistantMessageEvent: {
        type: "text_delta",
        delta: "",
        partial: {
          usage: { output: 0 },  // correct path - this SHOULD be used
        },
      },
    }, mockCtx);

    globalThis.Date.now = realNow;

    const mockTheme = { fg: (c, t) => t };
    const component = widgetRenderFn(null, mockTheme);
    const outputLines = component.render(200);
    const output = outputLines.join("\n");

    // Should show 0 t/s because partial.usage.output is 0
    // If code incorrectly uses message.usage.output, it would show 50 t/s
    assert.ok(
      output.includes("0 t/s"),
      `Expected 0 t/s because partial.usage.output is 0 (correct path), not from message.usage.output=100 (wrong path). Got: ${output}`
    );
  });
});
