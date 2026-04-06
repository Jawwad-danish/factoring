import {
  CommandInvoiceContext,
  PurchaseInvoiceRequest,
} from '@module-invoices/data';

import { ChangeActions } from '@common';
import { formatToDollars } from '@core/formatting';
import { penniesToDollars } from '@core/formulas';
import {
  InvoiceEntity,
  ReserveEntity,
  ReserveInvoiceEntity,
  ReserveReason,
} from '@module-persistence/entities';
import {
  ReserveInvoiceRepository,
  ReserveRepository,
} from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import Big from 'big.js';
import { PurchaseInvoiceRule } from './purchase-invoice-rule';

@Injectable()
export class PurchaseDeductionRule implements PurchaseInvoiceRule {
  private logger = new Logger(PurchaseDeductionRule.name);
  constructor(
    private readonly reserveRepository: ReserveRepository,
    private readonly reserveInvoiceRepository: ReserveInvoiceRepository,
  ) {}

  async run(
    context: CommandInvoiceContext<PurchaseInvoiceRequest>,
  ): Promise<ChangeActions> {
    const { entity, payload } = context;
    if (payload.deduction?.gt(0)) {
      const reserveEntity = new ReserveEntity();
      reserveEntity.clientId = entity.clientId;
      reserveEntity.amount = Big(payload.deduction);
      reserveEntity.payload = payload;
      reserveEntity.reason = ReserveReason.Chargeback;
      reserveEntity.createdBy = entity.updatedBy;
      reserveEntity.note = `Applied deduction of ${formatToDollars(
        penniesToDollars(payload.deduction),
      )} at invoice purchase.`;
      this.logger.log(
        `Applied deduction of ${payload.deduction} at invoice ${entity.id} purchase.`,
      );
      this.reserveRepository.persist(reserveEntity);
      this.createInvoiceReserveEntity(entity, reserveEntity);
    }
    return ChangeActions.empty();
  }

  private createInvoiceReserveEntity(
    invoice: InvoiceEntity,
    reserve: ReserveEntity,
  ) {
    const invoiceReserve = new ReserveInvoiceEntity();
    invoiceReserve.invoice = invoice;
    invoiceReserve.reserve = reserve;
    this.reserveInvoiceRepository.persist(invoiceReserve);
  }
}
