# TPS Meter

A pi TUI extension that displays a real-time **tokens per second (TPS)** meter as a visual VU bar chart. Watch your model's generation speed at a glance while the agent streams a response.

```
⚡ 85 t/s ▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮
```

## Features

- **Real-time TPS display** — Shows tokens per second as a 20-bar VU meter
- **Gradient fill** — `░` (empty), `▓` (tip), `█` (filled) for clear visual distinction
- **Color-coded zones** — Green (0–50 t/s), Yellow (51–80 t/s), Red (81–100+ t/s)
- **Idle decay** — Peak TPS holds for 10 seconds, then smoothly decays to zero
- **Theme-aware** — Uses your theme's success/warning/error colors
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
| 0–50 t/s  | Green (success) |
| 51–80 t/s | Yellow (warning) |
| 81–100+ t/s | Red (error) |

### Behavior

- The meter appears when an assistant message begins streaming
- TPS is computed from cumulative output tokens divided by elapsed time
- After streaming ends, the meter holds the peak value for ~10 seconds
- The meter decays to zero over ~2 seconds after the hold period
- The meter persists at zero when the agent session ends

## Architecture

The extension listens for pi TUI events:

| Event | Action |
|-------|--------|
| `agent_start` | Reset all state |
| `session_start` | Register widget |
| `message_start` | Record start time |
| `message_update` | Compute TPS, update display |
| `message_end` | Stop streaming, begin decay |
| `agent_end` | Reset state, widget persists at 0 |

## License

MIT

---

Made with reespec and ❤️ in EU
