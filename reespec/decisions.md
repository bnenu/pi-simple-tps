# Decisions

Architectural and strategic decisions across all requests.
One decision per entry. One paragraph. Reference the request for details.

## Entry format

### <Decision title> — YYYY-MM-DD (Request: <request-name>)

What was decided and why. What was considered and rejected.
See request artifacts for full context.

---

## What belongs here
- Library or technology choices with rationale
- Architectural patterns adopted
- Approaches explicitly rejected and why
- Deviations from the original plan with explanation
- Decisions that constrain future work

## What does NOT belong here
- Activity entries ("added X", "removed Y", "refactored Z")
- Implementation details available in request artifacts
- Decisions too small to affect future planning

---

<!-- decisions below this line -->

### Widget relies on TUI render cycle, not manual requestRender — 2026-06-17 (Request: tps-meter)

The `ctx.ui.requestRender()` method is not exposed on the `ExtensionContext` API. Rather than attempting to trigger renders manually, the widget is registered once on `session_start` and relies on the TUI's own render cycle. The widget's `render(width)` function reads from closure variables (peakTps, isStreaming, etc.) that are updated by event handlers. The TUI calls `render(width)` periodically, so state changes appear on the next paint cycle. The original plan included `requestRender()` as a trigger — this was wrong. No throttle is needed either, since the TUI controls render pacing.

### TPS meter uses setWidget(belowEditor), not setFooter — 2026-06-17 (Request: tps-meter)

The TPS meter extension uses `ctx.ui.setWidget("tps-meter", ..., { placement: "belowEditor" })` rather than `ctx.ui.setFooter()`. The footer is a singleton — only one extension can own it at a time, and `setFooter()` replaces all other footers. Using `setWidget` places the meter below the input editor, above the footer, where it coexists peacefully with other extensions' widgets and footers. This was chosen over `setStatus()` because a VU meter needs per-character ANSI coloring and more horizontal space than a single footer line can comfortably provide.

---

### TPS uses instantaneous, not smoothed, calculation — 2026-06-17 (Request: tps-meter)

TPS is computed as `outputTokens / elapsedSeconds` from the cumulative `partial.usage.output` counter. This gives an instantaneous reading that reflects the overall average from message start. We deliberately avoid exponential smoothing (e.g., `0.15 * raw + 0.85 * smoothed`) because the cumulative nature of the counter already provides natural smoothing, and the user wants to see the actual current rate, not a lagged average.

---

### Idle decay: peak hold for 10s, then linear decay to zero — 2026-06-17 (Request: tps-meter)

When streaming ends, the meter holds the peak TPS value for up to 10 seconds. After 10 seconds of inactivity, TPS linearly decays to zero over ~2 seconds. This mimics a VU meter's needle falling back to rest, giving the user a visual signal that the agent has stopped generating.

---
