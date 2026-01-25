import { EPSILON, clamp, parseNumber } from '../lib/math.js';

/**
 * 計算改革前後面積組成
 * @param {Object} input
 * @param {number} input.r0 改革前虛坪率
 * @param {number} input.r1 改革後虛坪率
 * @param {number} input.t0 原始總樓地板面積
 * @param {'A'|'T'} input.mode
 * @returns {{
 *  ratio0:number, ratio1:number,
 *  total0:number, total1:number,
 *  usable0:number, usable1:number,
 *  virtual0:number, virtual1:number
 * }}
 */
export function computeArea({ r0, r1, t0, mode }) {
  const ratio0 = clamp(parseNumber(r0, 0), EPSILON, 1 - EPSILON);
  const ratio1 = clamp(parseNumber(r1, 0), EPSILON, 1 - EPSILON);
  const total0 = Math.max(parseNumber(t0, 0), 0);
  const usable0 = total0 * (1 - ratio0);
  const virtual0 = total0 * ratio0;

  let total1 = total0;
  let usable1 = usable0;

  if (mode === 'A') {
    usable1 = usable0;
    total1 = usable1 / (1 - ratio1 || 1);
  } else {
    total1 = total0;
    usable1 = total1 * (1 - ratio1);
  }

  const virtual1 = Math.max(total1 - usable1, 0);

  return {
    ratio0,
    ratio1,
    total0,
    total1,
    usable0,
    usable1,
    virtual0,
    virtual1,
  };
}
