const FILLED_BAR = "\u25AE"; // ▮
const EMPTY_BAR = "\u25AF";  // ▯
const TOTAL_BARS = 20;
const TPS_PER_BAR = 5;

/**
 * Render a VU meter string for a given TPS value.
 *
 * @param {number} tps - Tokens per second (0–100+)
 * @returns {string} Plain text VU meter with TPS label (no ANSI colors)
 */
export function renderVUMeter(tps) {
  const cappedTps = Math.min(Math.max(tps, 0), 100);
  const filledBars = Math.min(Math.floor(cappedTps / TPS_PER_BAR), TOTAL_BARS);
  const emptyBars = TOTAL_BARS - filledBars;

  const bars = FILLED_BAR.repeat(filledBars) + EMPTY_BAR.repeat(emptyBars);
  const label = `${Math.round(cappedTps)} t/s`;

  return `⚡ ${bars} ${label}`;
}
