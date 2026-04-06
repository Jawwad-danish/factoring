import Big, { BigSource } from 'big.js';

export const expectBigEquality = (value1: Big, value2: BigSource) => {
  expect(value1.toFixed()).toBe(new Big(value2).toFixed());
};
