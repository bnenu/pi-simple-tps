const FILLED_BAR  = "\u2588"; // █ full block
const GRADIENT_TIP = "\u2593"; // ▓ dark shade (gradient tip)
const EMPTY_BAR   = "\u2591"; // ░ light shade
const TOTAL_BARS = 20;
const TPS_PER_BAR = 5;

// Color zone thresholds
const RED_MAX = 15;
const YELLOW_MAX = 40;

/**
 * Strip ANSI escape sequences to get visible character width.
 */
function visibleWidth(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, "").length;
}

/**
 * Truncate string to visible width, accounting for ANSI color codes.
 */
function truncateToWidth(str, maxWidth, ellipsis = "…") {
  const plain = str.replace(/\x1b\[[0-9;]*m/g, "");
  if (plain.length <= maxWidth) return str;
  let visCount = 0;
  let inEsc = false;
  let result = "";
  for (let i = 0; i < str.length && visCount < maxWidth; i++) {
    const ch = str[i];
    if (ch === "\x1b") { inEsc = true; result += ch; continue; }
    if (inEsc) {
      result += ch;
      if (ch === "m") inEsc = false;
      continue;
    }
    result += ch;
    visCount++;
  }
  return result + (visCount >= maxWidth ? "" : ellipsis);
}

/**
 * Determine the theme color key for a given bar index (0-based).
 *
 * @param {number} barIndex - Which bar position (0–19)
 * @returns {"error"|"warning"|"success"}
 */
export function barColor(barIndex) {
  const tpsForBar = (barIndex + 1) * TPS_PER_BAR; // TPS at the top of this bar
  if (tpsForBar <= RED_MAX) {
    return "error";      // red — low TPS = alert
  } else if (tpsForBar <= YELLOW_MAX) {
    return "warning";    // yellow — mid TPS
  }
  return "success";      // green — high TPS
}

/**
 * Apply color with ANSI fallback if theme doesn't have the color.
 */
export function coloredBar(theme, colorKey, char) {
  const colored = theme.fg(colorKey, char);
  // If theme.fg returns uncolored text (fallback), use direct ANSI codes
  if (colored === char) {
    if (colorKey === "success") return "\x1b[32m" + char + "\x1b[0m";
    if (colorKey === "warning") return "\x1b[33m" + char + "\x1b[0m";
    if (colorKey === "error") return "\x1b[31m" + char + "\x1b[0m";
  }
  return colored;
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
    const char = (i === filledBars - 1 && filledBars > 0) ? GRADIENT_TIP : FILLED_BAR;
    bars += coloredBar(theme, barColor(i), char);
  }

  // Render empty bars (no color)
  bars += EMPTY_BAR.repeat(emptyBars);

  const label = `${Math.round(cappedTps)} t/s`;
  const line = `⚡ ${label} ${bars}`;

  return truncateToWidth(line, 200);
}
