/**
 * Compute the decayed TPS value for idle display.
 *
 * - Holds peak TPS for up to 10 seconds after last update.
 * - Linearly decays to 0 over 2 seconds (10s–12s window).
 * - Returns 0 after 12 seconds of inactivity.
 *
 * @param {number} peakTps - The peak TPS value to decay from
 * @param {number} lastUpdateMs - Timestamp of the last message update
 * @param {number} nowMs - Current timestamp
 * @returns {number} Decayed TPS value
 */
export function computeDecayedTps(peakTps, lastUpdateMs, nowMs) {
  const elapsedMs = nowMs - lastUpdateMs;
  const HOLD_MS = 10_000;  // 10 seconds
  const DECAY_MS = 2_000;  // 2 seconds decay window

  if (elapsedMs <= HOLD_MS) {
    return peakTps;
  } else if (elapsedMs >= HOLD_MS + DECAY_MS) {
    return 0;
  } else {
    // Linear decay from peak to 0 over the decay window
    const decayProgress = (elapsedMs - HOLD_MS) / DECAY_MS;
    return Math.max(peakTps * (1 - decayProgress), 0);
  }
}
