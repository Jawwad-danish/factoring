import Big, { BigSource } from 'big.js';

interface Cost {
  lumper: Big;
  detention: Big;
  lineHaulRate: Big;
  advance: Big;
}

export const totalAmount = (cost: Cost): Big => {
  return cost.lineHaulRate
    .plus(cost.lumper)
    .plus(cost.detention)
    .minus(cost.advance);
};

interface Payable {
  accountsReceivableValue: Big;
  reserveFee: Big;
  approvedFactorFee: Big;
  deduction: Big;
}

export const payableAmount = (payable: Payable): Big => {
  const toSubstract = payable.reserveFee
    .plus(payable.approvedFactorFee)
    .plus(payable.deduction);
  return payable.accountsReceivableValue.minus(toSubstract);
};

export function transferableAmount(
  payables: Payable[],
  transferFee: Big = Big(0),
): Big {
  return payables
    .map(payableAmount)
    .reduce((sum, curr) => sum.plus(curr), new Big(0))
    .minus(transferFee)
    .round(0, 1);
}

/**
 * @param leftToPayAmount - The amount left to pay to Bobtail by brokers
 * @param totalAccountReceivableAmount - The sum of all accounts receivable for all invoices that have a broker payment
 * @returns What's left to pay to Bobtail / Total AR
 */
export function dilutionRatePercentage(
  leftToPayAmount: BigSource,
  totalAccountReceivableAmount: BigSource,
): Big {
  return new Big(leftToPayAmount).div(totalAccountReceivableAmount).times(100);
}
