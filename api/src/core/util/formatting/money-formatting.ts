import Big, { BigSource } from 'big.js';

export const formatToDollars = (input: BigSource): string => {
  return Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(new Big(input).toNumber());
};
