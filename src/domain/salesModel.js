import { EPSILON, clamp, parseNumber } from '../lib/math.js';

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
