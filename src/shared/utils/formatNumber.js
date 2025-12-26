export const formatNumber = (value) => {
  if (value === null || value === undefined) return 'N/A';
  const absValue = Math.abs(value);
  if (absValue >= 1e9) return `${(absValue / 1e9).toFixed(2)}B`;
  if (absValue >= 1e6) return `${(absValue / 1e6).toFixed(2)}M`;
  if (absValue >= 1e3) return `${(absValue / 1e3).toFixed(2)}K`;
  return absValue.toFixed(2);
};