# TPS Meter UI Refresh — brief

## Problem

The TPS meter uses a "more is better" color scheme: green for low TPS, yellow for mid, red for high. This is counterintuitive — slow generation feels like a problem (alert), fast generation feels good (green). The README also uses outdated terminology and an example that no longer matches the actual rendering.

## Goal

Flip the color semantics so the meter communicates intuitively:
- Low TPS (below 15 t/s) → red (alert: the model is slow)
- Mid TPS (15–40 t/s) → yellow (caution: moderate speed)
- High TPS (above 40 t/s) → green (good: fast generation)

Update the README to match the new color scheme and clean up stale content.

## Non-goals

- Changing the bar count, character set, or gradient tip
- Adding new color zones or thresholds
- Changing the TPS calculation or idle decay behavior
- Adding configuration for color zones

## Impact

- Changes to `src/render.js` (barColor thresholds and return values)
- Changes to `tests/integration.test.mjs` (color assertions)
- Changes to `README.md` (example, color zones table, features bullet, architecture section)
- No new dependencies
- No API changes

## User story

As a user watching the agent stream, I want the meter colors to intuitively signal performance — red when slow, green when fast — so I can gauge model speed at a glance without thinking about it.
