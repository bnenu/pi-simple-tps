import { renderVUMeter } from "./vu-meter.js";

const FILLED_BAR = "\u25AE"; // ▮
const EMPTY_BAR = "\u25AF";  // ▯
const TOTAL_BARS = 20;
const TPS_PER_BAR = 5;

// Color zone thresholds
const GREEN_MAX = 50;
const YELLOW_MAX = 80;

/**
 * Determine the theme color key for a given bar index (0-based).
 *
 * @param {number} barIndex - Which bar position (0–19)
 * @returns {"success"|"warning"|"error"}
 */
function barColor(barIndex) {
  const tpsForBar = (barIndex + 1) * TPS_PER_BAR; // TPS at the top of this bar
  if (tpsForBar <= GREEN_MAX) {
    return "success";
  } else if (tpsForBar <= YELLOW_MAX) {
    return "warning";
  }
  return "error";
}

/**
 * Render the VU meter with theme colors applied per bar.
 *
 * @param {number} tps - Tokens per second (0–100+)
 * @param {object} theme - Theme object with fg(color, text) method
 * @returns {string} Colored VU meter string
 */
export function renderMeterWithTheme(tps, theme) {
  const cappedTps = Math.min(Math.max(tps, 0), 100);
  const filledBars = Math.min(Math.floor(cappedTps / TPS_PER_BAR), TOTAL_BARS);
  const emptyBars = TOTAL_BARS - filledBars;

  let bars = "";

  // Render filled bars with appropriate colors
  for (let i = 0; i < filledBars; i++) {
    bars += theme.fg(barColor(i), FILLED_BAR);
  }

  // Render empty bars (no color)
  bars += EMPTY_BAR.repeat(emptyBars);

  const label = `${Math.round(cappedTps)} t/s`;

  return `⚡ ${bars} ${label}`;
}
