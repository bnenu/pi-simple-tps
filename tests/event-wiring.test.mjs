import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

// Cache the imported module to avoid re-importing
let cachedModule;
async function getExtensionModule() {
  if (!cachedModule) {
    cachedModule = await import("../extensions/tps-meter.js");
  }
  return cachedModule;
}

function makeMockPi() {
  const handlers = {};
  return {
    on(event, handler) {
      handlers[event] = handler;
    },
    _handlers: handlers,
  };
}

function makeMockCtx() {
  let widgetOpts = null;
  return {
    ui: {
      setWidget(id, renderFn, opts) {
        widgetOpts = opts;
      },
    },
    _getWidgetOpts: () => widgetOpts,
  };
}

describe("TPS Meter extension event wiring", () => {
  it("registers message_start handler", async () => {
    const mockPi = makeMockPi();
    const mockCtx = makeMockCtx();

    const mod = await getExtensionModule();
    mod.default(mockPi);

    assert.ok(mockPi._handlers.message_start, "should register message_start handler");
  });

  it("registers message_update handler", async () => {
    const mockPi = makeMockPi();
    const mockCtx = makeMockCtx();

    const mod = await getExtensionModule();
    mod.default(mockPi);

    assert.ok(mockPi._handlers.message_update, "should register message_update handler");
  });

  it("registers message_end handler", async () => {
    const mockPi = makeMockPi();
    const mockCtx = makeMockCtx();

    const mod = await getExtensionModule();
    mod.default(mockPi);

    assert.ok(mockPi._handlers.message_end, "should register message_end handler");
  });

  it("registers agent_start handler", async () => {
    const mockPi = makeMockPi();
    const mockCtx = makeMockCtx();

    const mod = await getExtensionModule();
    mod.default(mockPi);

    assert.ok(mockPi._handlers.agent_start, "should register agent_start handler");
  });

  it("registers widget with default placement", async () => {
    const mockPi = makeMockPi();
    const mockCtx = makeMockCtx();

    const mod = await getExtensionModule();
    mod.default(mockPi);

    // session_start triggers widget registration (no placement = default/aboveEditor)
    mockPi._handlers.session_start({}, mockCtx);

    assert.strictEqual(
      mockCtx._getWidgetOpts(),
      undefined,
      "widget should be registered without explicit opts (default placement)"
    );
  });
});
