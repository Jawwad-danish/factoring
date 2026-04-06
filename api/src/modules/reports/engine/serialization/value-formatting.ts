import { penniesToDollars } from '@core/formulas';

export const formatCurrency = (
  value: any,
  currency = 'USD',
  options?: Intl.NumberFormatOptions,
): string => {
  const numericValue = Number(value);

  if (isNaN(numericValue)) {
    console.warn(`Invalid numeric value for currency formatting: ${value}`);
    return String(value);
  }

  return penniesToDollars(numericValue)
    .toNumber()
    .toLocaleString('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    });
};

export const formatNumber = (
  value: any,
  options?: Intl.NumberFormatOptions,
): string => {
  const numericValue = Number(value);

  if (isNaN(numericValue)) {
    console.warn(`Invalid numeric value for number formatting: ${value}`);
    return String(value);
  }

  return numericValue.toLocaleString('en-US', options);
};
