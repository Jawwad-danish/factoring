import { formatToDollars } from '@core/formatting';
import { payableAmount, penniesToDollars } from '@core/formulas';
import { ValidationError } from '@core/validation';
import {
  CommandInvoiceContext,
  PurchaseInvoiceRequest,
} from '@module-invoices/data';
import { ReserveRepository } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import Big from 'big.js';
import { PurchaseInvoiceValidator } from './purchase-invoice-validator';

@Injectable()
export class ChargebackValidator implements PurchaseInvoiceValidator {
  private logger: Logger = new Logger(ChargebackValidator.name);

  constructor(private readonly reservesRepository: ReserveRepository) {}

  async validate(
    context: CommandInvoiceContext<PurchaseInvoiceRequest>,
  ): Promise<void> {
    const { entity, client, payload } = context;

    if (!payload.deduction || payload.deduction.eq(0)) {
      return;
    }

    const threshold = payableAmount({
      accountsReceivableValue: entity.accountsReceivableValue,
      reserveFee: entity.reserveFee,
      approvedFactorFee: entity.approvedFactorFee,
      deduction: new Big(0),
    });

    const total = await this.reservesRepository.getTotalByClient(client.id);
    if (total >= 0) {
      this.logger.error(
        `Cannot add a chargeback for an invoice of a client with a positive reserve ledger`,
        {
          invoiceId: entity.id,
          client: {
            id: client.id,
            deduction: formatToDollars(penniesToDollars(payload.deduction)),
            totalReserves: formatToDollars(penniesToDollars(total)),
          },
        },
      );
      throw new ValidationError(
        'chargeback-check',
        'Cannot add a chargeback for an invoice of a client with a non negative reserve ledger',
      );
    }

    if (total < 0 && payload.deduction.gt(Math.abs(total))) {
      this.logger.error(
        `Cannot add chargeback to invoice because deduction exceeds available negative reserve balance`,
        {
          invoiceId: entity.id,
          client: {
            id: client.id,
            deduction: formatToDollars(penniesToDollars(payload.deduction)),
            availableBalance: formatToDollars(
              penniesToDollars(Math.abs(total)),
            ),
          },
        },
      );
      throw new ValidationError(
        'chargeback-check',
        `Cannot deduct more than the available negative balance of ${formatToDollars(
          penniesToDollars(Math.abs(total)),
        )}`,
      );
    }

    if (payload.deduction.gt(threshold)) {
      this.logger.error(
        `Cannot add chargeback to invoice due to A/R ammount (plus fees) being less than the chargeback`,
        {
          invoiceId: entity.id,
          client: {
            id: client.id,
            accountsReceivable: entity.value.toNumber(),
            deduction: payload.deduction.toNumber(),
          },
        },
      );
      throw new ValidationError(
        'chargeback-check',
        'Cannot add chargeback to invoice due to A/R ammount (plus fees) being less than the chargeback',
      );
    }
  }
}
