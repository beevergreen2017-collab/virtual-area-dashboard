import { EPSILON, clamp, parseNumber, toPing } from '../lib/math.js';

const displayArea = (value, unit) => (unit === 'ping' ? toPing(value) : value);

/**
 * Build donut chart data for before-state composition.
 * @param {Object} parsed
 * @param {number} parsed.virtual0
 * @param {number} parsed.usable0
 * @param {'m2'|'ping'} unit
 * @returns {{ name: string, value: number }[]}
 */
export function buildDonutData(parsed, unit) {
  return [
    { name: '改革前虛坪', value: displayArea(parsed.virtual0, unit) },
    { name: '改革前實坪', value: displayArea(parsed.usable0, unit) },
  ];
}

/**
 * Build bar chart data for before/after composition.
 * @param {Object} parsed
 * @param {number} parsed.virtual0
 * @param {number} parsed.usable0
 * @param {number} parsed.virtual1
 * @param {number} parsed.usable1
 * @param {'m2'|'ping'} unit
 * @returns {{ name: string, 虛坪: number, 實坪: number }[]}
 */
export function buildBarData(parsed, unit) {
  return [
    {
      name: '改革前',
      虛坪: displayArea(parsed.virtual0, unit),
      實坪: displayArea(parsed.usable0, unit),
    },
    {
      name: '改革後',
      虛坪: displayArea(parsed.virtual1, unit),
      實坪: displayArea(parsed.usable1, unit),
    },
  ];
}

/**
 * Build sensitivity table data for k vs P1.
 * @param {Object} input
 * @param {number} input.kMax
 * @param {number} input.kStep
 * @param {number} input.P0
 * @returns {{ k: number, P1: number }[]}
 */
export function buildSensitivityData({ kMax, kStep, P0 }) {
  const max = clamp(parseNumber(kMax, 0), 0, 1 - EPSILON);
  const step = clamp(parseNumber(kStep, 0.01), 0.01, 0.5);
  const rows = [];
  for (let k = 0; k <= max + 1e-9; k += step) {
    const factor = parseNumber(P0, 0) / (1 - k || 1);
    rows.push({
      k: Number(k.toFixed(2)),
      P1: Number(factor.toFixed(3)),
    });
  }
  return rows;
}
