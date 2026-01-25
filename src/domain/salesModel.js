import { EPSILON, clamp, parseNumber } from '../lib/math.js';

/**
 * 計算 k 與價格相關指標
 * @param {Object} input
 * @param {'A'|'T'} input.basis
 * @param {Object} input.parsed
 * @param {number} input.parsed.total0
 * @param {number} input.parsed.total1
 * @param {number} input.parsed.usable0
 * @param {number} input.parsed.usable1
 * @param {number} input.P0
 * @returns {{
 *  S0:number, S1:number,
 *  rawK:number, kCurrent:number,
 *  P1:number, delta:number
 * }}
 */
export function computeSales({ basis, parsed, P0 }) {
  const S0 = basis === 'T' ? parsed.total0 : parsed.usable0;
  const S1 = basis === 'T' ? parsed.total1 : parsed.usable1;
  const rawK = S0 > 0 ? 1 - S1 / S0 : 0;
  const kCurrent = clamp(rawK, 0, 1 - EPSILON);
  const P1 = parseNumber(P0, 0) / (1 - kCurrent);
  const delta = 1 / (1 - kCurrent) - 1;
  return {
    S0,
    S1,
    rawK,
    kCurrent,
    P1,
    delta,
  };
}
