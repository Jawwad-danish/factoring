import Big, { BigSource } from 'big.js';

export const dollarsToPennies = (input: BigSource): Big => {
  return new Big(input).times(100);
};

export const penniesToDollars = (input: BigSource): Big => {
  return new Big(input).div(100);
};
