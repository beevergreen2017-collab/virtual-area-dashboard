import { computeArea } from './areaModel.js';
import { computeSales } from './salesModel.js';
import { buildBarData, buildDonutData, buildSensitivityData } from './chartData.js';
import { computeDiff, computeKNearLimit, computeRatioWarning } from './derived.js';

/**
 * Build all derived dashboard data from raw inputs.
 * @param {Object} input
 * @param {number} input.r0
 * @param {number} input.r1
 * @param {number} input.t0
 * @param {'A'|'T'} input.mode
 * @param {'m2'|'ping'} input.unit
 * @param {'A'|'T'} input.basis
 * @param {number} input.P0
 * @param {number} input.kMax
 * @param {number} input.kStep
 * @returns {{
 *  parsed: Object,
 *  sales: Object,
 *  donutData: Array,
 *  barData: Array,
 *  sensitivityData: Array,
 *  diff: Object,
 *  kNearLimit: boolean,
 *  ratioWarning: boolean
 * }}
 */
export function buildDashboardState({
  r0,
  r1,
  t0,
  mode,
  unit,
  basis,
  P0,
  kMax,
  kStep,
}) {
  const parsed = computeArea({ r0, r1, t0, mode });
  const sales = computeSales({ basis, parsed, P0 });
  const donutData = buildDonutData(parsed, unit);
  const barData = buildBarData(parsed, unit);
  const sensitivityData = buildSensitivityData({ kMax, kStep, P0 });
  const diff = computeDiff(parsed);
  const kNearLimit = computeKNearLimit(sales.kCurrent, kMax);
  const ratioWarning = computeRatioWarning(parsed);

  return {
    parsed,
    sales,
    donutData,
    barData,
    sensitivityData,
    diff,
    kNearLimit,
    ratioWarning,
  };
}
