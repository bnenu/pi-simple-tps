# TPS Meter UI Refresh — design

## Approach

The color logic lives in `src/render.js` in the `barColor(barIndex)` function. We invert the thresholds and the color mapping:

### Current (old)
```
bar 0-10 (1-50 t/s)  → "success" (green)
bar 11-16 (51-80 t/s) → "warning" (yellow)
bar 17-19 (81-100 t/s) → "error" (red)
```

### New
```
bar 0-2  (1-15 t/s)  → "error" (red)
bar 3-8  (16-40 t/s) → "warning" (yellow)
bar 9-19 (41-100 t/s) → "success" (green)
```

### Implementation

Change the constants in `src/render.js`:
```javascript
const RED_MAX    = 15;
const YELLOW_MAX = 40;
```

Change `barColor` to return in the new order:
```javascript
function barColor(barIndex) {
  const tpsForBar = (barIndex + 1) * TPS_PER_BAR;
  if (tpsForBar <= RED_MAX) {
    return "error";      // red — low TPS = alert
  } else if (tpsForBar <= YELLOW_MAX) {
    return "warning";    // yellow — mid TPS
  }
  return "success";      // green — high TPS
}
```

### README changes

1. **Example line**: Replace `⚡ 85 t/s ▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮` with `⚡ 85 t/s ████████████████████` (grayscale, no color codes)
2. **Color zones table**: Update thresholds to 0-14 red, 15-40 yellow, 41+ green. Use emoji color indicators. Remove "success/warning/error" terminology.
3. **Features bullet**: Update "Color-coded zones" line to new thresholds.
4. **Remove**: Entire "Architecture" section (event listener details are irrelevant to end users).

## Tradeoffs

| Option | Pros | Cons |
|--------|------|------|
| Invert thresholds in barColor | Minimal change, surgical | None significant |
| Add config for thresholds | Flexible | Over-engineering for a simple toggle |
| Redesign the whole color scheme | Fresh look | Unnecessary scope creep |

Chosen: Invert thresholds in `barColor`. It's a 4-line change that achieves the goal.

## Risks

| Risk | Mitigation |
|------|------------|
| Existing users are used to the old colors | New users expect low=red, high=green anyway; existing users will notice on next install |
| Tests assert old thresholds | Tests updated in same PR |
| README example still looks wrong | Use grayscale blocks that match the actual rendering characters |
