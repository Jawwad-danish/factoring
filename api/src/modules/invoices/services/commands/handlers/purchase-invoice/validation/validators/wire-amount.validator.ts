import { formatToDollars } from '@core/formatting';
import { payableAmount, penniesToDollars } from '@core/formulas';
import { ValidationError } from '@core/validation';
import { ExpediteConfigurer } from '@module-common';
import {
  CommandInvoiceContext,
  PurchaseInvoiceRequest,
} from '@module-invoices/data';
import { Injectable, Logger } from '@nestjs/common';
import Big from 'big.js';
import { calculateFees } from '../../amounts';
import { PurchaseInvoiceValidator } from './purchase-invoice-validator';

@Injectable()
export class WireAmountValidator implements PurchaseInvoiceValidator {
  private logger: Logger = new Logger(WireAmountValidator.name);

  constructor(private readonly expediteConfigurer: ExpediteConfigurer) {}

  async validate({
    entity,
    payload,
    client,
  }: CommandInvoiceContext<PurchaseInvoiceRequest>): Promise<void> {
    const { approvedFactorFee, reserveFee } = calculateFees(
      entity,
      client.factoringConfig,
    );

    const proposedAmountToPay = payableAmount({
      accountsReceivableValue: entity.value,
      reserveFee: reserveFee,
      approvedFactorFee: approvedFactorFee,
      deduction: new Big(payload.deduction || 0),
    });

    if (
      entity.expedited &&
      proposedAmountToPay.lt(this.expediteConfigurer.expediteFee())
    ) {
      this.logger.error(
        `Can not purchase invoice id ${
          entity.id
        } with expedited under ${formatToDollars(
          penniesToDollars(this.expediteConfigurer.expediteFee()),
        )}`,
      );
      throw new ValidationError(
        'wire-amount',
        `Can not purchase invoice with expedited under ${formatToDollars(
          penniesToDollars(this.expediteConfigurer.expediteFee()),
        )}`,
      );
    }
  }
}
