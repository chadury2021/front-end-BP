import React, { useMemo } from 'react';
import NumberFlow from '@number-flow/react';

const DEFAULT_PLACEHOLDER = '-';

// Formatter that mimics msAndKs while keeping NumberFlow animation
export const formatMsAndKsValue = (rawValue = 0) => {
  const value = Number(rawValue) || 0;
  const absValue = Math.abs(value);

  if (absValue >= 1e15) {
    return { numericValue: value / 1e15, suffix: 'Q' };
  }

  if (absValue >= 1e12) {
    return { numericValue: value / 1e12, suffix: 'T' };
  }

  if (absValue >= 1e9) {
    return { numericValue: value / 1e9, suffix: 'B' };
  }

  if (absValue >= 1e6) {
    return { numericValue: value / 1e6, suffix: 'M' };
  }

  if (absValue >= 1e3) {
    return { numericValue: value / 1e3, suffix: 'K' };
  }

  return { numericValue: value, suffix: '' };
};

export default function AnimatedNumber({
  value,
  decimals = 2,
  formatter,
  prefix = '',
  suffix = '',
  placeholder = DEFAULT_PLACEHOLDER,
  formatOptions,
}) {
  const isInvalidValue = value === null || value === undefined || Number.isNaN(Number(value));
  const parsedValue = Number(isInvalidValue ? 0 : value);

  const {
    numericValue,
    prefix: formatterPrefix = '',
    suffix: formatterSuffix = '',
  } = useMemo(() => {
    if (typeof formatter === 'function') {
      return formatter(parsedValue, decimals) ?? { numericValue: parsedValue };
    }
    return { numericValue: parsedValue };
  }, [formatter, parsedValue, decimals]);

  const options = useMemo(
    () => ({
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: false,
      ...formatOptions,
    }),
    [decimals, formatOptions]
  );

  if (isInvalidValue) {
    return <span>{placeholder}</span>;
  }

  return (
    <span>
      {prefix || formatterPrefix}
      <NumberFlow locales='en-US' options={options} value={numericValue} />
      {suffix || formatterSuffix}
    </span>
  );
}
