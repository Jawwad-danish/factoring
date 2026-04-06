import { ChangeActions } from '@common';
import {
  BrokerPaymentEntity,
  BrokerPaymentStatus,
  InvoiceEntity,
  RecordStatus,
  ReserveBrokerPaymentEntity,
  ReserveEntity,
  ReserveInvoiceEntity,
  ReserveReason,
} from '@module-persistence/entities';
import { Repositories } from '@module-persistence/repositories';
import { InvoiceEntityUtil } from '@module-persistence/util';
import { Injectable, Logger } from '@nestjs/common';
import {
  BrokerPaymentContext,
  CreateBrokerPaymentRequest,
} from '../../../../../data';
import { BrokerPaymentRule } from '../../../../common';

const reserveReason: { [key: string]: ReserveReason } = {
  [BrokerPaymentStatus.ShortPaid]: ReserveReason.Shortpay,
  [BrokerPaymentStatus.Overpaid]: ReserveReason.Overpay,
  [BrokerPaymentStatus.NonPayment]: ReserveReason.NonPayment,
  [BrokerPaymentStatus.NonFactoredPayment]: ReserveReason.NonFactoredPayment,
};

@Injectable()
export class CreateBrokerPaymentReserveRule
  implements BrokerPaymentRule<CreateBrokerPaymentRequest>
{
  private logger = new Logger(CreateBrokerPaymentReserveRule.name);

  constructor(private readonly repositories: Repositories) {}

  async run({
    invoice,
    brokerPayment,
  }: BrokerPaymentContext<CreateBrokerPaymentRequest>): Promise<ChangeActions> {
    const activeBrokerPayments =
      await InvoiceEntityUtil.getActiveBrokerPayments(invoice);
    const brokerPaymentStatus =
      await InvoiceEntityUtil.calculateBrokerPaymentStatus(invoice);
    if (
      brokerPaymentStatus === BrokerPaymentStatus.InFull &&
      activeBrokerPayments.length === 1
    ) {
      this.logger.debug(
        'Reserve not created for invoice due to create broker payment',
        {
          invoiceId: invoice.id,
          brokerPaymentAmount: brokerPayment.amount.toNumber(),
          brokerPaymentStatus,
        },
      );
      return ChangeActions.empty();
    }

    const reason =
      activeBrokerPayments.length === 1
        ? reserveReason[brokerPaymentStatus]
        : ReserveReason.AdditionalPayment;
    const reserve = this.createReserveEntity(brokerPayment, invoice, reason);
    this.createReserveBrokerPaymentEntity(brokerPayment, reserve);
    this.createReserveInvoiceEntity(invoice, reserve);
    this.logger.debug(
      'Created reserve for invoice due to create broker payment',
      {
        invoiceId: invoice.id,
        brokerPaymentAmount: brokerPayment.amount.toNumber(),
        reserveAmount: reserve.amount.toNumber(),
      },
    );
    return ChangeActions.empty();
  }

  private createReserveEntity(
    brokerPayment: BrokerPaymentEntity,
    invoice: InvoiceEntity,
    reserveReason: ReserveReason,
  ): ReserveEntity {
    const reserveAmount =
      invoice.brokerPayments.filter(
        (brokerPayment) => brokerPayment.recordStatus == RecordStatus.Active,
      ).length === 1
        ? brokerPayment.amount.minus(invoice.accountsReceivableValue)
        : brokerPayment.amount;
    const reserveEntity = new ReserveEntity();
    reserveEntity.clientId = invoice.clientId;
    reserveEntity.amount = reserveAmount;
    reserveEntity.reason = reserveReason;
    reserveEntity.note = `Created a ${reserveReason} reserve`;
    this.repositories.persist(reserveEntity);
    return reserveEntity;
  }

  private createReserveBrokerPaymentEntity(
    brokerPayment: BrokerPaymentEntity,
    reserve: ReserveEntity,
  ): void {
    const reserveBrokerPaymentEntity = new ReserveBrokerPaymentEntity();
    reserveBrokerPaymentEntity.brokerPayment = brokerPayment;
    reserveBrokerPaymentEntity.reserve = reserve;
    this.repositories.persist(reserveBrokerPaymentEntity);
  }

  private createReserveInvoiceEntity(
    invoice: InvoiceEntity,
    reserve: ReserveEntity,
  ) {
    const reserveInvoiceEntity = new ReserveInvoiceEntity();
    reserveInvoiceEntity.invoice = invoice;
    reserveInvoiceEntity.reserve = reserve;
    this.repositories.persist(reserveInvoiceEntity);
  }
}
