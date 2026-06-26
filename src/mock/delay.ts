/**
 * Simulates realistic API network latency in the mock service layer.
 *
 * Using artificial delays ensures that:
 *  1. Loading states in the UI are tested properly during development.
 *  2. The transition to a real network API causes no surprises.
 *
 * BACKEND INTEGRATION NOTE: Remove all simulateDelay() calls when switching
 * to the real API — the actual network will provide natural latency.
 */

/** Default delay range in milliseconds. */
const MIN_MS = 120;
const MAX_MS = 350;

/**
 * Returns a promise that resolves after a randomised delay, mimicking a
 * real network round-trip.
 *
 * @param minMs - Minimum delay (defaults to 120 ms)
 * @param maxMs - Maximum delay (defaults to 350 ms)
 */
export function simulateDelay(minMs = MIN_MS, maxMs = MAX_MS): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, ms));
}
