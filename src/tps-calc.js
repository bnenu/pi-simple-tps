/**
 * Compute tokens per second from cumulative output tokens and elapsed time.
 *
 * @param outputTokens - Total output tokens generated so far
 * @param elapsedSeconds - Time elapsed since message start in seconds
 * @returns TPS value, minimum 0, clamped to avoid Infinity
 */
export function computeTps(outputTokens, elapsedSeconds) {
  if (outputTokens <= 0 || elapsedSeconds <= 0) {
    return 0;
  }
  // Clamp elapsed to a minimum of 0.05s to avoid extreme values
  const clampedElapsed = Math.max(elapsedSeconds, 0.05);
  return Math.max(outputTokens / clampedElapsed, 0);
}
