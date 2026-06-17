# Tasks

## Summary of bugs to fix

1. Token path: `event.message.usage.output` → `event.assistantMessageEvent.partial?.usage?.output`
2. Remove early return on `outputTokens === 0`
3. Remove render throttling
4. `agent_end` must not clear widget
5. `agent_start` must not call `scheduleRender`
6. `session_start` must register widget (not `agent_start`)

---

### 1. Fix token data paths in message_update handler

- [ ] **RED** — Write `tests/token-path.test.mjs`: mock `pi.on` handlers; simulate a `message_update` event with `event.assistantMessageEvent.partial.usage.output = 150`; call the handler; assert that `peakTps` is a positive value (not 0). Current code returns 0 because it reads wrong paths.
- [ ] **ACTION** — In `extensions/tps-meter.js`:
  - Change `event.message.usage?.output` → `event.assistantMessageEvent.partial?.usage?.output`
  - Remove the `event.message.partial?.usage?.output` branch (wrong path)
  - Remove `if (outputTokens === 0) return;` — always render
- [ ] **GREEN** — Run `node --test tests/token-path.test.mjs` → test passes.

### 2. Fix message_update to render on every event (no throttle)

- [ ] **RED** — Write `tests/no-throttle.test.mjs`: mock `ctx` with `requestRender` call counter; fire 5 `message_update` events in a loop without waiting; assert `ctx.ui.requestRender.callCount >= 4`. Current code throttles and skips renders.
- [ ] **ACTION** — Remove the `RENDER_THROTTLE_MS` constant and the throttle check in `scheduleRender`. Replace `scheduleRender(ctx)` with direct `ctx.ui.requestRender()` calls.
- [ ] **GREEN** — Run `node --test tests/no-throttle.test.mjs` → test passes.

### 3. Fix agent_end — do not clear widget

- [ ] **RED** — Write `tests/widget-persists.test.mjs`: call the extension with a mock `pi` and `ctx`; fire `agent_end`; assert `ctx.ui.setWidget` was **not** called with `undefined`. Current code calls `setWidget("tps-meter", undefined)`.
- [ ] **ACTION** — In the `agent_end` handler, remove the `ctx.ui.setWidget("tps-meter", undefined)` line. Keep the state reset.
- [ ] **GREEN** — Run `node --test tests/widget-persists.test.mjs` → test passes.

### 4. Fix session_start — widget registration moved from agent_start

- [ ] **RED** — Write `tests/session-start-widget.test.mjs`: fire `session_start`; assert `ctx.ui.setWidget` was called with a render function and `placement: "belowEditor"`. Current code registers widget on `session_start` but the test checks `agent_start`.
- [ ] **ACTION** — Verify `session_start` handler registers the widget. The `agent_start` handler should only reset state. Confirm current code is correct here.
- [ ] **GREEN** — Run `node --test tests/session-start-widget.test.mjs` → test passes.

### 5. Fix agent_start — reset state but don't trigger render

- [ ] **RED** — Write `tests/agent-start-reset.test.mjs`: fire `agent_start`; assert `messageStartTime` is null and `peakTps` is 0 and `isStreaming` is false. Do NOT assert `requestRender` was called.
- [ ] **ACTION** — Remove `scheduleRender(ctx)` call from `agent_start` handler. State reset is correct.
- [ ] **GREEN** — Run `node --test tests/agent-start-reset.test.mjs` → test passes.

### 6. Fix idle-decay-runtime tests (widget returns array, not string)

- [ ] **RED** — Write `tests/idle-decay-runtime.test.mjs` (rewrite): import extension; fire `message_start`, then `message_update` with tokens=80; advance time via Date mock; fire `message_end`; call the widget render function; assert the rendered line contains "0 t/s" (decayed). Current test calls `output.includes()` on what might be an array.
- [ ] **ACTION** — Fix the widget component so `render(width)` returns `[line]` (array). Fix tests to call `render(width)[0]` to get the string. Wire `getCurrentTps()` to call `computeDecayedTps(peakTps, lastUpdateMs, Date.now())` in the render closure.
- [ ] **GREEN** — Run `node --test tests/idle-decay-runtime.test.mjs` → test passes.

### 7. Fix streaming-tokens test (syntax error)

- [ ] **RED** — Write `tests/streaming-tokens.test.mjs` (rewrite): import extension; fire `message_update` with `event.assistantMessageEvent.type = "text_delta"` and `delta = "hello world"` (11 chars); fire another with `thinking_delta` and `delta = "thinking"` (8 chars); assert `streamedTextLen >= 11` and `streamedThinkLen >= 8`. File was truncated/incomplete.
- [ ] **ACTION** — Implement character accumulation in `message_update`: when `assistantMessageEvent.type === "text_delta"`, add `delta.length` to `streamedTextLen`; when `"thinking_delta"`, add to `streamedThinkLen`.
- [ ] **GREEN** — Run `node --test tests/streaming-tokens.test.mjs` → test passes.

### 8. Run full test suite — all tests pass

- [ ] **RED** — Run `node --test tests/*.test.mjs` and count failures. Current state: 6 failures (1 syntax error + 5 idle-decay-runtime).
- [ ] **ACTION** — Fix any remaining test failures until all tests pass.
- [ ] **GREEN** — `node --test tests/*.test.mjs` shows 0 failures.

### 9. Verify extension loads in pi (manual smoke test)

- [ ] **RED** — Check: `extensions/tps-meter.js` exists and `package.json` has correct `"pi": { "extension": "..." }` field. The extension must be loadable by pi.
- [ ] **ACTION** — No changes needed if files exist. If missing, ensure `package.json` has the pi extension metadata and the main file exists.
- [ ] **GREEN** — Files exist and have correct structure.
