# TPS Meter — brief

## Problem

The TPS meter widget exists but doesn't work: it flickers in and out and eventually disappears. The counter never shows a value because the token data paths are wrong. The widget also disappears between prompts instead of staying visible at zero.

## Root cause

The extension accesses `event.message.usage.output` and `event.message.partial.usage.output`, but in pi's `MessageUpdateEvent`, the `AssistantMessage` with `usage` lives at `event.assistantMessageEvent.partial.usage.output`. The widget always shows 0 and eventually disappears.

## Goal

Fix the TPS meter so it:
- Always stays visible, showing 0 when idle
- Shows the counter and fills bars as soon as tokens stream
- Never disappears during a session
- Accurately reflects token generation speed

## Non-goals

- Adding new visualization features (e.g., multi-band EQ, sparklines)
- Historical TPS logging
- Configurable bar counts or thresholds
- Per-provider or per-model TPS benchmarks

## Impact

- Changes only to `extensions/tps-meter.js` and its test files
- No new dependencies
- Uses existing `setWidget("belowEditor")` API
- Coexists with other extensions' widgets and footers

## User story

As a user watching the agent stream a response, I want to see a real-time TPS meter that fills its bars and shows a live counter, so I can gauge model performance at a glance. When the agent finishes, the meter holds at zero and stays visible.

## Key decisions from discovery

| Decision | Rationale |
|----------|-----------|
| Widget always visible, not hidden/shown | User wants to always see the meter below the editor |
| Peak TPS + decay behavior | Meter holds peak for 10s, decays to 0 over 2s after idle |
| Three-tier token source: `partial.usage` → char-count fallback | Usage API may be deferred; char counting is always available |
| No render throttling | Throttle caused lag; TUI handles render scheduling |
| `agent_end` resets state only, doesn't clear widget | Widget persists at zero between sessions |
