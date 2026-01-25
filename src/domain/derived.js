import { parseNumber } from '../lib/math.js';
import { RATIO_WARNING_THRESHOLD } from './constants.js';

/**
 * Compute area deltas between before/after.
 * @param {Object} parsed
 * @param {number} parsed.usable0
 * @param {number} parsed.usable1
 * @param {number} parsed.virtual0
 * @param {number} parsed.virtual1
 * @param {number} parsed.total0
 * @param {number} parsed.total1
 * @returns {{ usable: number, virtual: number, total: number }}
 */
export function computeDiff(parsed) {
  return {
    usable: parsed.usable1 - parsed.usable0,
    virtual: parsed.virtual1 - parsed.virtual0,
    total: parsed.total1 - parsed.total0,
  };
}

/**
 * Check if current k or kMax is near the warning threshold.
 * @param {number} kCurrent
 * @param {number} kMax
 * @returns {boolean}
 */
export function computeKNearLimit(kCurrent, kMax) {
  return (
    parseNumber(kCurrent, 0) >= RATIO_WARNING_THRESHOLD ||
    parseNumber(kMax, 0) >= RATIO_WARNING_THRESHOLD
  );
}

/**
 * Check if either ratio is near the warning threshold.
 * @param {Object} parsed
 * @param {number} parsed.ratio0
 * @param {number} parsed.ratio1
 * @returns {boolean}
 */
export function computeRatioWarning(parsed) {
  return (
    parsed.ratio0 >= RATIO_WARNING_THRESHOLD ||
    parsed.ratio1 >= RATIO_WARNING_THRESHOLD
  );
}
