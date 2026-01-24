export const EPSILON = 0.001;

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
export const toPing = (value) => value / 3.305785;
export const fromPing = (value) => value * 3.305785;
export const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
