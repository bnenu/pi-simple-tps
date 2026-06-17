# TPS Meter — design

## The Bug

pi fires `message_update` events during streaming with this structure:

```typescript
MessageUpdateEvent {
  message: AgentMessage,                    // AgentMessage = Message | CustomMessages[...]
  assistantMessageEvent: {
    type: "text_delta" | "thinking_delta" | ...,
    delta: string,                          // only on *_delta events
    partial: AssistantMessage {
      usage: { input, output, cacheRead, ... },
      content: [...],
      ...
    }
  }
}
```

The original code accessed `event.message.usage.output` — but `AgentMessage` is a union type that doesn't have `usage` at the top level. The correct path is `event.assistantMessageEvent.partial.usage.output`.

## Token Data Source

Three-tier strategy, tried in order:

1. **`event.assistantMessageEvent.partial?.usage?.output`** — populated by some providers during streaming
2. **Character-count estimation** — `streamedTextLen / 3.5 + streamedThinkLen / 4` — always available

The char-count fallback accumulates characters from `text_delta` and `thinking_delta` events. Empirical ratios:
- Text: ~3.5 characters per token
- Thinking: ~4 characters per token

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│  Extension (tps-meter.js)                                       │
│                                                                │
│  session_start  ──▶ setWidget("tps-meter", renderFn)          │
│                                                                │
│  Events ──▶ State ──▶ Widget render ──▶ TUI                    │
│                                                                │
│  agent_start      → reset all state (keep widget visible)      │
│  message_start    → record startTime, reset counters           │
│  message_update   → count chars from deltas                    │
│                     compute output tokens                      │
│                     compute TPS, update peak                   │
│                     requestRender()                            │
│  message_end      → isStreaming = false, requestRender()      │
│  agent_end        → reset state only (keep widget at 0)       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Event paths

| Event | Role check | Action |
|-------|------------|--------|
| `session_start` | — | Register widget via `ctx.ui.setWidget` |
| `agent_start` | — | Reset all state (but keep widget) |
| `message_start` | `assistant` | Record `messageStartTime`, reset counters, set `isStreaming = true` |
| `message_update` | `assistant` | Accumulate chars, compute TPS, update peak, `requestRender()` |
| `message_end` | `assistant` | Set `isStreaming = false`, `requestRender()` |
| `agent_end` | — | Reset state only (don't clear widget) |

## TPS Calculation

```
elapsedSeconds = (Date.now() - messageStartTime) / 1000
tps = outputTokens / max(elapsedSeconds, 0.05)
peakTps = max(previous peakTps, tps)
```

## Rendering

The widget is registered once on `session_start`. The render function is called on every TUI repaint and calls `requestRender()` when state changes.

```javascript
ctx.ui.setWidget("tps-meter", (tui, theme) => {
  return {
    render(width) {
      let tps = isStreaming ? peakTps : computeDecayedTps(peakTps, lastUpdateMs, Date.now());
      // build VU meter string, return [line]
    }
  };
}, { placement: "belowEditor" });
```

**Never** `setWidget(widget, undefined)` — the widget persists at zero between sessions.

## Idle Decay

Applied in the render function (not a timer):

```
decayedTps = computeDecayedTps(peakTps, lastUpdateMs, Date.now())
```

- Within 10s of last update: returns `peakTps`
- 10s–12s: linearly decays to 0
- After 12s: returns 0

## State Variables

| Variable | Purpose |
|----------|---------|
| `messageStartTime` | Timestamp when current message started |
| `streamedTextLen` | Cumulative characters from `text_delta` |
| `streamedThinkLen` | Cumulative characters from `thinking_delta` |
| `peakTps` | Highest TPS reached |
| `lastUpdateMs` | Timestamp of last `message_update` |
| `isStreaming` | Whether currently streaming |

## Widget Visibility Rules

1. Widget is set once on `session_start` and **never cleared**
2. `agent_start` resets state but widget remains visible at 0
3. `agent_end` resets state but widget remains at 0
4. During streaming: shows peak TPS (live updating)
5. After streaming: holds peak for 10s, then decays to 0

## What Was Changed From Original Design

| Original | Fixed |
|----------|-------|
| `event.message.usage.output` | `event.assistantMessageEvent.partial?.usage?.output` |
| `event.message.partial?.usage?.output` | (removed — wrong path) |
| `if (outputTokens === 0) return;` | Removed — state updates without early return |
| `ctx.ui.requestRender()` | Removed — API doesn't expose it; widget relies on TUI's own render cycle |
| Throttled `requestRender` at 80ms | Removed — no throttle needed |
| `agent_end` calls `setWidget(widget, undefined)` | Removed — widget persists |
| `agent_start` calls `scheduleRender()` | Removed — widget shows 0 naturally |

## Risks

| Risk | Mitigation |
|------|-----------|
| Provider doesn't stream `partial.usage.output` | Char-count fallback always works |
| TPS spikes on first token | `max(elapsedSeconds, 0.05)` clamps extreme values |
| Widget flicker from rapid updates | TUI's render scheduling handles this; no throttle needed |
