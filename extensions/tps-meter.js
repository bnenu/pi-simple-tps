import { computeTps } from "../src/tps-calc.js";
import { computeDecayedTps } from "../src/idle-decay.js";

// Strip ANSI escape sequences to get visible character width
function visibleWidth(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, "").length;
}

// Truncate string to visible width, accounting for ANSI color codes
function truncateToWidth(str, maxWidth, ellipsis = "…") {
  const plain = str.replace(/\x1b\[[0-9;]*m/g, "");
  if (plain.length <= maxWidth) return str;
  // Count visible chars we can fit
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

const FILLED_BAR  = "█"; // U+2588 full block
const GRADIENT_TIP = "▓";  // U+2593 dark shade (gradient tip)
const EMPTY_BAR   = "░";  // U+2591 light shade
const TOTAL_BARS = 20;
const TPS_PER_BAR = 5;
const GREEN_MAX = 50;
const YELLOW_MAX = 80;

function barColor(barIndex) {
  const tpsForBar = (barIndex + 1) * TPS_PER_BAR;
  if (tpsForBar <= GREEN_MAX) return "success";
  if (tpsForBar <= YELLOW_MAX) return "warning";
  return "error";
}

// Apply color with ANSI fallback if theme doesn't have the color
function coloredBar(theme, colorKey, char) {
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
 * Build a widget component that renders a TPS VU meter.
 * Returns a fresh component each time so there are no stale closure issues.
 */
function createMeterComponent(getTpsFn, theme) {
  return {
    render(width) {
      const tps = Math.min(Math.max(getTpsFn(), 0), 100);
      const filledBars = Math.min(Math.floor(tps / TPS_PER_BAR), TOTAL_BARS);
      const emptyBars = TOTAL_BARS - filledBars;

      let bars = "";
      for (let i = 0; i < filledBars; i++) {
        // Use gradient tip (▓) for the last filled bar, full block (█) for others
        const char = (i === filledBars - 1 && filledBars > 0) ? GRADIENT_TIP : FILLED_BAR;
        bars += coloredBar(theme, barColor(i), char);
      }
      bars += EMPTY_BAR.repeat(emptyBars);

      // ⚡ first, then label, then bars — use visibleWidth + truncateToWidth for ANSI safety
      const label = `${Math.round(tps)} t/s`;
      const line = `⚡ ${label} ${bars}`;

      // Truncate to visible width so ANSI color codes don't cause overflow
      return [truncateToWidth(line, width)];
    },

    invalidate() {
      // No-op: component rebuilds themed content on every render
    },
  };
}

export default function tpsMeterExtension(pi) {
  // State
  let messageStartTime = null;
  let lastOutputTokens = 0;
  let lastUpdateMs = 0;
  let peakTps = 0;
  let isStreaming = false;
  // Character counters for token estimation during streaming
  let streamedTextLen = 0;
  let streamedThinkLen = 0;
  // Token estimation ratios (chars per token, empirical)
  const TEXT_CHARS_PER_TOKEN = 3.5;
  const THINK_CHARS_PER_TOKEN = 4;

  /**
   * Get output token count.
   *
   * Primary: event.assistantMessageEvent.partial?.usage?.output — the real token
   * count from the provider. This already includes text + thinking + toolcall
   * tokens. Do NOT add char-count estimation on top of this.
   *
   * Fallback (only when partial.usage.output is 0): use character-count
   * estimation from streamed deltas. ~3.5 chars/token for text, ~4 for thinking.
   */
  function getOutputTokens(event) {
    const partialOutput = event.assistantMessageEvent?.partial?.usage?.output;

    if (partialOutput > 0) {
      // Real token count from provider — use this directly.
      // Do NOT add char-count estimation on top; partial.usage.output
      // already includes all output tokens.
      return partialOutput;
    }

    // Fallback: estimate from streamed delta characters.
    // Only used when the provider doesn't stream usage data.
    const textTokens = Math.floor(streamedTextLen / TEXT_CHARS_PER_TOKEN);
    const thinkTokens = Math.floor(streamedThinkLen / THINK_CHARS_PER_TOKEN);
    return textTokens + thinkTokens;
  }

  // Register the widget when a session starts (ctx is available in handlers)
  pi.on("session_start", (_event, ctx) => {
    function getCurrentTps() {
      if (isStreaming) {
        // Show current TPS (not peak) — peaks early when elapsed time is small.
        const elapsed = (Date.now() - messageStartTime) / 1000;
        const tps = computeTps(lastOutputTokens, elapsed);
        return tps;
      } else if (peakTps > 0) {
        return computeDecayedTps(peakTps, lastUpdateMs, Date.now());
      } else {
        return 0;
      }
    }

    ctx.ui.setWidget("tps-meter", (_tui, theme) => {
      return createMeterComponent(getCurrentTps, theme);
    });  // default placement (aboveEditor) — more width available
  });

  // Widget reads closure variables and re-renders on TUI's own render cycle.
  // No manual render trigger needed — state changes appear on next paint.
  function scheduleRender(_ctx) {}

  // agent_start: reset all state
  pi.on("agent_start", (_event, ctx) => {
    messageStartTime = null;
    lastOutputTokens = 0;
    lastUpdateMs = 0;
    peakTps = 0;
    isStreaming = false;
    streamedTextLen = 0;
    streamedThinkLen = 0;
  });

  // message_start: record start time for assistant messages
  pi.on("message_start", (event, ctx) => {
    if (event.message.role === "assistant") {
      messageStartTime = Date.now();
      lastOutputTokens = 0;
      lastUpdateMs = Date.now();
      peakTps = 0;
      isStreaming = true;
      streamedTextLen = 0;
      streamedThinkLen = 0;
    }
  });

  // message_update: compute TPS from cumulative output tokens
  pi.on("message_update", (event, ctx) => {
    if (event.message.role !== "assistant" || !messageStartTime) {
      return;
    }

    // Count characters from streaming deltas for token estimation
    const deltaEvent = event.assistantMessageEvent;
    if (deltaEvent?.type === "text_delta" && deltaEvent.delta) {
      streamedTextLen += deltaEvent.delta.length;
    } else if (deltaEvent?.type === "thinking_delta" && deltaEvent.delta) {
      streamedThinkLen += deltaEvent.delta.length;
    }

    // Get output tokens: try partial.usage first, then fall back to
    // character-count estimation
    const outputTokens = getOutputTokens(event);
    // Always render — even 0 TPS is a valid state to display

    lastOutputTokens = outputTokens;
    lastUpdateMs = Date.now();

    const elapsedSeconds = (Date.now() - messageStartTime) / 1000;
    const tps = computeTps(outputTokens, elapsedSeconds);
    peakTps = Math.max(peakTps, tps);
  });

  // message_end: finalize TPS and start decay
  pi.on("message_end", (event, ctx) => {
    if (event.message.role === "assistant") {
      isStreaming = false;
      lastUpdateMs = Date.now();
    }
  });

  // agent_end: reset state only — widget persists at 0 TPS
  pi.on("agent_end", (_event, ctx) => {
    messageStartTime = null;
    lastOutputTokens = 0;
    lastUpdateMs = 0;
    peakTps = 0;
    isStreaming = false;
    // Widget stays registered — it will show 0 TPS via decay logic
  });
}
