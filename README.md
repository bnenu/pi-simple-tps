# TPS Meter

A pi TUI extension that displays a real-time **tokens per second (TPS)** meter as a visual VU bar chart. Watch your model's generation speed at a glance while the agent streams a response.

```
⚡ 85 t/s ████████████████████
```

## Features

- **Real-time TPS display** — Shows tokens per second as a 20-bar VU meter
- **Gradient fill** — `░` (empty), `▓` (tip), `█` (filled) for clear visual distinction
- **Color-coded zones** — Red (0–14 t/s), Yellow (15–40 t/s), Green (41+ t/s)
- **Idle decay** — Peak TPS holds for 10 seconds, then smoothly decays to zero
- **Theme-aware** — Uses your theme's red/yellow/green colors
- **Default placement** — Renders above the editor for maximum horizontal space

## Installation

```bash
pi install npm:pi-simple-tps
```

## Usage

The TPS meter appears automatically when the agent starts streaming a response. No configuration required.

### Color zones

| TPS range | Color |
|-----------|-------|
| Below 15 t/s  | 🔴 Red |
| 15–40 t/s | 🟡 Yellow |
| Above 40 t/s | 🟢 Green |

### Behavior

- The meter appears when an assistant message begins streaming
- TPS is computed from cumulative output tokens divided by elapsed time
- After streaming ends, the meter holds the peak value for ~10 seconds
- The meter decays to zero over ~2 seconds after the hold period
- The meter persists at zero when the agent session ends

## License

MIT

---

Made with reespec and ❤️ in EU
