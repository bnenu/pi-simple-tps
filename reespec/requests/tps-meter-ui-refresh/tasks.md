# TPS Meter UI Refresh — Tasks

### 1. Update barColor thresholds in src/render.js

- [ ] **RED** — Write `tests/color-thresholds.test.mjs`: assert that `renderMeterWithTheme(10, ...)` contains `[error]`, `renderMeterWithTheme(25, ...)` contains `[warning]`, and `renderMeterWithTheme(50, ...)` contains `[success]`. Run `node --test tests/color-thresholds.test.mjs` → test fails (old code returns success/warning/error at wrong TPS ranges).
- [ ] **ACTION** — Update `src/render.js`: change `GREEN_MAX` to `RED_MAX = 15`, `YELLOW_MAX` to `YELLOW_MAX = 40`, and reorder `barColor` to return "error" for low, "warning" for mid, "success" for high.
- [ ] **GREEN** — Run `node --test tests/color-thresholds.test.mjs` → test passes.

### 2. Update integration tests for new color thresholds

- [ ] **RED** — Update `tests/integration.test.mjs`: change assertions so TPS 50 expects `[error]`, TPS 40 expects `[warning]`, TPS 90 expects `[success]`. Run `node --test tests/integration.test.mjs` → tests fail (old assertions don't match new thresholds).
- [ ] **ACTION** — No code change needed — the tests from task 1 already validate the new thresholds. Update the integration test file to use the same threshold assertions as task 1's test.
- [ ] **GREEN** — Run `node --test tests/integration.test.mjs` → all tests pass.

### 3. Update README.md

- [ ] **RED** — Check: `README.md` does NOT contain `████████████████████`, does NOT have color zones with 0–15/15–40/40+ ranges, and contains an "Architecture" section. Assertion fails — README still has old content.
- [ ] **ACTION** — Update README: replace bar example with grayscale `████████████████████`, rewrite Color zones table (red/yellow/green with new ranges, no success/warning/error words), update Features bullet, remove Architecture section.
- [ ] **GREEN** — Verify: `README.md` contains `████████████████████`, has correct color zones (red 0–14, yellow 15–40, green 41+), no success/warning/error terminology, no Architecture section.
