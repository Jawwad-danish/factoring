import Big from 'big.js';

interface Cost {
  lumper: Big;
  detention: Big;
  lineHaulRate: Big;
  advance: Big;
}

export const totalAmount = (cost: Cost): Big => {
  return cost.lineHaulRate.plus(cost.lumper).plus(cost.detention).minus(cost.advance);
};
