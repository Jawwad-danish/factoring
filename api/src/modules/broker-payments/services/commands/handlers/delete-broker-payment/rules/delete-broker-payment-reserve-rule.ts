import { ChangeActions } from '@common';
import { formatToDollars } from '@core/util';
import {
  BrokerPaymentEntity,
  InvoiceEntity,
  ReserveBrokerPaymentEntity,
  ReserveEntity,
  ReserveInvoiceEntity,
  ReserveReason,
} from '@module-persistence/entities';
import {
  ReserveBrokerPaymentRepository,
  ReserveInvoiceRepository,
  ReserveRepository,
} from '@module-persistence/repositories';
import { InvoiceEntityUtil } from '@module-persistence/util';
import { Injectable, Logger } from '@nestjs/common';
import {
  BrokerPaymentContext,
  CreateBrokerPaymentRequest,
  DeleteBrokerPaymentRequest,
} from '../../../../../data';
import { BrokerPaymentRule } from '../../../../common/';

@Injectable()
export class DeleteBrokerPaymentReserveRule
  implements BrokerPaymentRule<DeleteBrokerPaymentRequest>
{
  private logger = new Logger(DeleteBrokerPaymentReserveRule.name);

  constructor(
    private readonly reserveRepository: ReserveRepository,
    private readonly reserveBrokerPaymentRepository: ReserveBrokerPaymentRepository,
    private readonly reserveInvoiceRepository: ReserveInvoiceRepository,
  ) {}

  async run({
    brokerPayment,
    invoice,
  }: BrokerPaymentContext<CreateBrokerPaymentRequest>): Promise<ChangeActions> {
    const hasActiveBrokerPayments =
      await InvoiceEntityUtil.hasActiveBrokerPayments(invoice);
    if (
      !hasActiveBrokerPayments &&
      brokerPayment.amount.eq(invoice.accountsReceivableValue)
    ) {
      // The invoice was fully paid, and we don't need to correct the reserve ledger
      this.logger.debug(
        `Invoice ${invoice.id} was fully paid, no reserve correction needed`,
        {
          invoiceId: invoice.id,
          invoiceAR: invoice.accountsReceivableValue.toNumber(),
          deletedBrokerPaymentId: brokerPayment.id,
          deletedBrokerPaymentAmount: brokerPayment.amount.toNumber(),
        },
      );
      return ChangeActions.empty();
    }

    const reserve = await this.createReserveEntity(brokerPayment, invoice);
    this.createReserveBrokerPaymentEntity(brokerPayment, reserve);
    this.createReserveInvoiceEntity(invoice, reserve);
    this.logger.debug('Creating reserve for deleting broker payment', {
      invoiceId: invoice.id,
      brokerPaymentId: brokerPayment.id,
      reserveAmount: reserve.amount.toNumber(),
    });
    return ChangeActions.empty();
  }

  private async createReserveEntity(
    brokerPayment: BrokerPaymentEntity,
    invoice: InvoiceEntity,
  ): Promise<ReserveEntity> {
    let amount = brokerPayment.amount.times(-1);
    if (!brokerPayment.amount.eq(invoice.accountsReceivableValue)) {
      amount = invoice.accountsReceivableValue.minus(brokerPayment.amount);
    }
    // It means we have additional payments, and need to remove the value of it
    if (await InvoiceEntityUtil.hasActiveBrokerPayments(invoice)) {
      amount = brokerPayment.amount.times(-1);
    }
    const reserveEntity = new ReserveEntity();
    reserveEntity.clientId = invoice.clientId;
    reserveEntity.amount = amount;
    reserveEntity.reason = ReserveReason.PaymentRemoved;
    reserveEntity.note = `Reserve created for deleting a broker payment of ${formatToDollars(
      brokerPayment.amount,
    )}`;
    reserveEntity.createdBy = brokerPayment.createdBy;
    return this.reserveRepository.persist(reserveEntity);
  }

  private createReserveBrokerPaymentEntity(
    brokerPayment: BrokerPaymentEntity,
    reserve: ReserveEntity,
  ): ReserveBrokerPaymentEntity {
    const reserveBrokerPaymentEntity = new ReserveBrokerPaymentEntity();
    reserveBrokerPaymentEntity.brokerPayment = brokerPayment;
    reserveBrokerPaymentEntity.reserve = reserve;
    reserveBrokerPaymentEntity.createdBy = brokerPayment.createdBy;
    reserveBrokerPaymentEntity.updatedBy = brokerPayment.updatedBy;
    return this.reserveBrokerPaymentRepository.persist(
      reserveBrokerPaymentEntity,
    );
  }

  private createReserveInvoiceEntity(
    invoice: InvoiceEntity,
    reserve: ReserveEntity,
  ) {
    const reserveInvoiceEntity = new ReserveInvoiceEntity();
    reserveInvoiceEntity.invoice = invoice;
    reserveInvoiceEntity.reserve = reserve;
    this.reserveInvoiceRepository.persist(reserveInvoiceEntity);
  }
}
