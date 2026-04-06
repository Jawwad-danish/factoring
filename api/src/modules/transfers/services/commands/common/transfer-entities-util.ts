import { getDateInBusinessTimezone } from '@core/date-time';
import { payableAmount } from '@core/formulas';
import { UUID } from '@core/uuid';
import {
  ClientBatchPaymentEntity,
  ClientBatchPaymentStatus,
  ClientPaymentEntity,
  ClientPaymentOperationType,
  ClientPaymentType,
  InvoiceClientPaymentEntity,
  InvoiceEntity,
  PaymentOrderEntity,
  PaymentStatus,
  PaymentType,
  ReserveClientPaymentEntity,
  ReserveEntity,
} from '@module-persistence/entities';
import { TransferType } from '../../../api';

export class TransferEntitiesUtil {
  static createBatchPayment(
    paymentType: PaymentType,
    id?: string,
  ): ClientBatchPaymentEntity {
    const name = this.determineName(paymentType);
    const batchPayment = new ClientBatchPaymentEntity();
    batchPayment.id = id ?? UUID.get();
    batchPayment.type = paymentType;
    batchPayment.status = ClientBatchPaymentStatus.Pending;
    batchPayment.name = `${name}-${getDateInBusinessTimezone().toISOString()}-${
      batchPayment.id
    }`;
    return batchPayment;
  }

  static createRegularClientPayment(
    amount: Big,
    clientId: string,
    batchClientPayment: ClientBatchPaymentEntity,
  ): ClientPaymentEntity {
    const clientPayment = new ClientPaymentEntity();
    clientPayment.type = ClientPaymentType.Invoice;
    clientPayment.operationType = ClientPaymentOperationType.Credit;
    clientPayment.clientId = clientId;
    clientPayment.transferType = PaymentType.ACH;
    clientPayment.amount = amount;
    clientPayment.status = PaymentStatus.PENDING;
    batchClientPayment.clientPayments.add(clientPayment);
    return clientPayment;
  }

  static createExpediteClientPayment(
    amount: Big,
    transferFee: Big,
    client: {
      id: string;
      bankAccountId: string;
      lastFourDigits: string;
    },
    batchClientPayment: ClientBatchPaymentEntity,
  ): ClientPaymentEntity {
    const clientPayment = new ClientPaymentEntity();
    clientPayment.type = ClientPaymentType.Invoice;
    clientPayment.operationType = ClientPaymentOperationType.Credit;
    clientPayment.clientId = client.id;
    clientPayment.clientBankAccountId = client.bankAccountId;
    clientPayment.transferFee = transferFee;
    clientPayment.transferType = PaymentType.WIRE;
    clientPayment.amount = amount;
    clientPayment.status = PaymentStatus.PENDING;
    clientPayment.bankAccountLastDigits = client.lastFourDigits;
    batchClientPayment.clientPayments.add(clientPayment);
    return clientPayment;
  }

  static createClientPaymentOrder(
    amount: Big,
    client: {
      id: string;
      bankAccountId: string;
      lastFourDigits: string;
    },
    transferType: TransferType,
  ): PaymentOrderEntity {
    const paymentOrder = new PaymentOrderEntity();
    paymentOrder.id = UUID.get();
    paymentOrder.amount = amount;
    paymentOrder.transferType = transferType;
    paymentOrder.clientId = client.id;
    paymentOrder.clientBankAccountId = client.bankAccountId;
    paymentOrder.bankAccountLastDigits = client.lastFourDigits;
    return paymentOrder;
  }

  static createDebitClientPayment(
    amount: Big,
    client: {
      id: string;
      bankAccountId: string;
      lastFourDigits: string;
    },
    batchClientPayment: ClientBatchPaymentEntity,
  ): ClientPaymentEntity {
    const clientPayment = new ClientPaymentEntity();
    clientPayment.type = ClientPaymentType.Other;
    clientPayment.operationType = ClientPaymentOperationType.Debit;
    clientPayment.clientId = client.id;
    clientPayment.clientBankAccountId = client.bankAccountId;
    clientPayment.transferType = PaymentType.DEBIT;
    clientPayment.amount = amount;
    clientPayment.status = PaymentStatus.PENDING;
    clientPayment.bankAccountLastDigits = client.lastFourDigits;
    batchClientPayment.clientPayments.add(clientPayment);
    return clientPayment;
  }

  static createInvoiceClientPayment(
    invoice: InvoiceEntity,
    clientPayment: ClientPaymentEntity,
  ): InvoiceClientPaymentEntity {
    const invoiceClientPayment = new InvoiceClientPaymentEntity();
    invoiceClientPayment.invoice = invoice;
    invoiceClientPayment.amount = payableAmount(invoice);
    if (clientPayment.invoicePayments?.isInitialized()) {
      clientPayment.invoicePayments.add(invoiceClientPayment);
    }
    return invoiceClientPayment;
  }

  static createReserveClientPayment(
    reserve: ReserveEntity,
    clientPayment: ClientPaymentEntity,
  ): ReserveClientPaymentEntity {
    const reserveClientPayment = new ReserveClientPaymentEntity();
    reserveClientPayment.reserve = reserve;
    reserveClientPayment.amount = reserve.amount;
    reserveClientPayment.amount = reserveClientPayment.amount.times(-1);
    if (clientPayment.reservePayments?.isInitialized()) {
      clientPayment.reservePayments.add(reserveClientPayment);
    }
    return reserveClientPayment;
  }

  private static determineName(paymentType: PaymentType): string {
    switch (paymentType) {
      case PaymentType.ACH:
        return 'regular';
      case PaymentType.WIRE:
      case PaymentType.RTP:
        return 'expedited';
      case PaymentType.DEBIT:
        return 'debit-regular';
    }
  }
}
