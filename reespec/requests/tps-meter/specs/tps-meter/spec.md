# Spec: TPS Meter Capability

## Capability: Real-time TPS display as VU meter widget

### Scenario 1: Widget is always visible below editor

**GIVEN** the extension is loaded in a TUI session
**WHEN** `session_start` fires
**THEN** a widget named "tps-meter" is registered with `ctx.ui.setWidget` at `placement: "belowEditor"`
**AND** the widget renders a single line showing empty bars and "0 t/s"
**AND** the widget is **never cleared** during the session

### Scenario 2: Widget resets to zero on new prompt

**GIVEN** a previous streaming session completed and the widget shows some TPS value
**WHEN** `agent_start` fires for a new prompt
**THEN** all TPS state is cleared (startTime, token counts, peakTps)
**AND** the widget re-renders showing "0 t/s" and all empty bars

### Scenario 3: TPS is calculated from partial.usage.output

**GIVEN** streaming is in progress with `event.assistantMessageEvent.partial.usage.output` increasing
**WHEN** a `message_update` event fires
**THEN** TPS is computed as `outputTokens / elapsedSeconds` where elapsed is since `message_start`
**AND** `peakTps` is updated to the maximum of current and previous peak
**AND** the widget re-renders with the updated TPS value

### Scenario 4: Char-count fallback when partial.usage is zero

**GIVEN** streaming is in progress and `event.assistantMessageEvent.partial.usage.output` is 0 or undefined
**WHEN** a `text_delta` event fires with a delta of N characters
**THEN** `streamedTextLen` is incremented by N
**AND** TPS is computed as `(streamedTextLen / 3.5 + streamedThinkLen / 4) / elapsedSeconds`

### Scenario 5: VU meter fills bars as TPS increases

**GIVEN** the TPS value is between 0 and 100
**WHEN** the meter renders
**THEN** exactly 20 bar positions are shown
**AND** the number of filled bars equals `Math.min(Math.floor(tps / 5), 20)`
**AND** remaining positions show as empty bars

### Scenario 6: Color zones — green 0–50 TPS

**GIVEN** the TPS value is between 0 and 50 inclusive
**WHEN** the meter renders filled bars in this range
**THEN** those bars are colored green (via `theme.fg("success", ...)`)

### Scenario 7: Color zones — yellow 51–80 TPS

**GIVEN** the TPS value is between 51 and 80 inclusive
**WHEN** the meter renders filled bars in this range
**THEN** those bars are colored yellow (via `theme.fg("warning", ...)`)

### Scenario 8: Color zones — red 81–100 TPS

**GIVEN** the TPS value is between 81 and 100 inclusive
**WHEN** the meter renders filled bars in this range
**THEN** those bars are colored red (via `theme.fg("error", ...)`)

### Scenario 9: TPS capped at 100

**GIVEN** the computed TPS exceeds 100
**WHEN** the meter renders
**THEN** all 20 bars are filled (displayed as 100 TPS)
**AND** the TPS label shows "100 t/s"

### Scenario 10: Widget persists at zero after streaming ends

**GIVEN** streaming has ended and a TPS value was recorded
**WHEN** `message_end` fires
**THEN** `isStreaming` is set to false
**AND** the widget shows the peak TPS value
**AND** the widget **is not cleared**

### Scenario 11: Peak hold then decay after idle

**GIVEN** streaming has ended and peakTps was recorded
**WHEN** 10 seconds pass without any `message_update` events
**THEN** the displayed TPS begins linearly decaying toward 0
**AND** at 12 seconds the displayed TPS is 0

### Scenario 12: State reset on agent_start keeps widget visible

**GIVEN** a previous streaming session completed
**WHEN** `agent_start` fires for a new prompt
**THEN** all TPS state is cleared (messageStartTime, streamedTextLen, streamedThinkLen, peakTps)
**AND** `isStreaming` is set to false
**AND** the widget **remains registered** and shows "0 t/s"
**AND** `ctx.ui.setWidget("tps-meter", undefined)` is **not called**

### Scenario 13: No throttling — render on every update

**GIVEN** multiple `message_update` events fire in rapid succession (e.g., every 20ms)
**WHEN** each event is processed
**THEN** `ctx.ui.requestRender()` is called for each event
**AND** the widget updates at the TUI's render rate

### Scenario 14: Theme-aware coloring

**GIVEN** the user has a custom theme loaded
**WHEN** the meter renders with bars in the green zone
**THEN** the bar color uses the theme's "success" foreground color
**WHEN** the theme changes
**THEN** the meter re-renders with updated theme colors

### Scenario 15: Counter and bars appear immediately on first token

**GIVEN** a message starts streaming
**WHEN** the first `text_delta` event fires
**THEN** `streamedTextLen` is incremented
**AND** TPS is computed and the widget re-renders immediately
**AND** the counter and bars reflect the current speed
