import Big, { BigSource } from 'big.js';

export const percentageOfNumber = (
  thisNumber: BigSource,
  isWhatPercentageOfThisNumber: BigSource,
): Big => {
  return new Big(thisNumber)
    .div(new Big(isWhatPercentageOfThisNumber))
    .times(100);
};

export const percentOf = (
  percentage: BigSource,
  ofThisNumber: BigSource,
): Big => {
  return new Big(percentage).div(100).times(ofThisNumber).round(0, 1);
};
