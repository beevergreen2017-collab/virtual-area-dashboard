export const formatNumber = (value, digits = 2) =>
  Number(value).toLocaleString('zh-Hant', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
