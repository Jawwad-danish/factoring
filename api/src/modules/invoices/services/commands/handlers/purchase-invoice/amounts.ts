import { percentOf } from '@core/formulas';
import { InvoiceEntity } from '@module-persistence/entities';

export function calculateFees(
  invoice: InvoiceEntity,
  clientFactoringConfig: {
    reserveRatePercentage: Big;
    factoringRatePercentage: Big;
  },
) {
  let reserveRatePercentage = invoice.reserveRatePercentage;
  let reserveFee = invoice.reserveFee;
  if (clientFactoringConfig.reserveRatePercentage.gt(0)) {
    reserveRatePercentage = clientFactoringConfig.reserveRatePercentage;
    reserveFee = percentOf(reserveRatePercentage, invoice.value);
  }

  const approvedFactorFeePercentage =
    clientFactoringConfig.factoringRatePercentage;
  const approvedFactorFee = percentOf(
    approvedFactorFeePercentage,
    invoice.value,
  );

  return {
    approvedFactorFee,
    approvedFactorFeePercentage,
    reserveFee,
    reserveRatePercentage,
  };
}
