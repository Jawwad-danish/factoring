import { Maps } from '@core/util';
import { ClientBankAccount } from '@fs-bobtail/factoring/data';
import { Client, ClientContactType } from '@module-clients';
import {
  ClientBatchPaymentEntity,
  ClientPaymentEntity,
} from '@module-persistence/entities';
import { Logger } from '@nestjs/common';
import {
  ACHBatchTransferDto,
  ACHBatchTransferDtoTransaction,
  BofaTransferRequest,
  BofaWireTransferRequest,
  BatchTransferResponseV2,
  ExpediteTransferDto,
  TransferType,
} from '../../../api';
import { PaymentOrder } from '@fs-bobtail/factoring/data';

export interface TransferDestination {
  account: string;
  routingNumber: string;
  wireRoutingNumber?: string;
  clientExternalAccountId: string;
  clientExternalAccountName: string;
  bankAccountOwnerName: string;
  companyName: string;
  internalBankAccountId: string;
  bankName?: string;
}

export interface PaymentContext {
  clientPayment: ClientPaymentEntity;
  transferDestination: TransferDestination;
}

export class TransferDataMapper {
  private static logger = new Logger(TransferDataMapper.name);

  static batchPaymentToDebitACH(
    batchPayment: ClientBatchPaymentEntity,
    originatingAccountId: string,
    validBankAccount: TransferDestination,
    webhookClientURL: string,
  ): ACHBatchTransferDto {
    return {
      batchPaymentId: batchPayment.id,
      transaction: ACHBatchTransferDtoTransaction.Debit,
      webhookClientURL,
      transferType: 'ach',
      payments: batchPayment.clientPayments.map((payment) => {
        return {
          amount: payment.amount.toNumber(),
          originatingAccountId,
          receivingAccountId: validBankAccount.clientExternalAccountId,
          routing: validBankAccount.routingNumber,
          account: validBankAccount.account,
          name: validBankAccount.bankAccountOwnerName,
          companyName: validBankAccount.companyName,
        };
      }),
    };
  }

  static batchPaymentToACH(
    batchPaymentId: string,
    originatingAccountId: string,
    payments: Map<string, PaymentContext>,
    webhookClientURL: string,
  ): ACHBatchTransferDto {
    this.logger.debug('Preparing payload for regular transfer for clients', {
      clients: Maps.transform(payments, (clientId, paymentContext) => {
        return {
          client: clientId,
          bankAccount: paymentContext.transferDestination.account,
          amount: paymentContext.clientPayment.amount,
        };
      }),
    });

    return {
      batchPaymentId,
      transaction: ACHBatchTransferDtoTransaction.Credit,
      webhookClientURL,
      transferType: 'ach',
      payments: Maps.transform(payments, (_, paymentContext) => {
        return {
          amount: paymentContext.clientPayment.amount.toNumber(),
          originatingAccountId,
          receivingAccountId:
            paymentContext.transferDestination.clientExternalAccountId,
          routing: paymentContext.transferDestination.routingNumber,
          account: paymentContext.transferDestination.account,
          name: paymentContext.transferDestination.bankAccountOwnerName,
          companyName: paymentContext.transferDestination.companyName,
        };
      }),
    };
  }

  static batchPaymentToModernTreasuryExpedite(
    batchPayment: ClientBatchPaymentEntity,
    originatingAccountId: string,
    validBankAccount: TransferDestination,
    webhookClientURL: string,
  ): ExpediteTransferDto {
    return {
      batchPaymentId: batchPayment.id,
      transferType: TransferType.Expedite,
      webhookClientURL,
      payments: batchPayment.clientPayments.map((payment) => {
        return {
          amount: payment.amount.toNumber(),
          originatingAccountId,
          receivingAccountId: validBankAccount.clientExternalAccountId,
        };
      }),
    };
  }

  static batchPaymentToBankOfAmericaExpedite(
    batchPayment: ClientBatchPaymentEntity,
    validBankAccount: TransferDestination,
    webhookClientURL: string,
    client: Client,
  ): BofaTransferRequest {
    return {
      batchPaymentId: batchPayment.id,
      transferType: TransferType.Expedite,
      webhookClientURL,
      payments: batchPayment.clientPayments.map((payment) => {
        return this.toBofaPaymentRequest(
          validBankAccount,
          client,
          payment.amount.toNumber(),
        );
      }),
    };
  }

  static paymentOrderToBankOfAmericaTransfer(
    paymentId: string,
    validBankAccount: TransferDestination,
    client: Client,
    amount: number,
    transferType: TransferType,
  ): BofaWireTransferRequest {
    return {
      batchPaymentId: paymentId,
      transferType: transferType,
      payments: [this.toBofaPaymentRequest(validBankAccount, client, amount)],
    };
  }

  static toBofaPaymentRequest(
    validBankAccount: TransferDestination,
    client: Client,
    amount: number,
  ) {
    const clientAddress = client.clientContacts?.find(
      (contact) => contact.type === ClientContactType.BUSINESS,
    )?.address;

    if (!clientAddress) {
      throw new Error(
        'Client Address details (address, city) are missing to create Bank of America transfer',
      );
    }

    return {
      amount: amount,
      creditorName: validBankAccount.bankAccountOwnerName,
      creditorPostalAddress: {
        addressLine: [clientAddress.address],
        city: clientAddress.city,
        state: clientAddress.state,
        postalCode: clientAddress.zip,
      },
      creditorAccountNumber: validBankAccount.account,
      creditorRoutingNumber: validBankAccount.routingNumber,
      creditorWireRoutingNumber: validBankAccount.wireRoutingNumber,
      creditorBankName: validBankAccount.bankName,
    };
  }

  static asTransferDestination(
    client: Client,
    bankAccount: ClientBankAccount,
  ): null | TransferDestination {
    const routingNumber = bankAccount.getRoutingNumber();
    const wireRoutingNumber = bankAccount.getWireRoutingNumber();
    const accountNumber = bankAccount.getAccountNumber();
    if (!routingNumber || !accountNumber) {
      return null;
    }
    return {
      internalBankAccountId: bankAccount.id,
      account: accountNumber,
      routingNumber,
      wireRoutingNumber,
      clientExternalAccountId:
        bankAccount.modernTreasuryAccount.externalAccountId,
      clientExternalAccountName:
        bankAccount.plaidAccount.bankAccountOfficialName,
      companyName: client.name,
      bankAccountOwnerName: bankAccount.plaidAccount.bankAccountOwnerName,
      bankName: bankAccount.plaidAccount.bankName,
    };
  }

  static bofaExpediteTransferToPaymentOrder(
    transfer: BatchTransferResponseV2,
  ): PaymentOrder {
    const paymentOrder = new PaymentOrder();
    paymentOrder.amount = transfer.totalAmount;
    paymentOrder.batchTransferId = transfer.batchTransferId;
    paymentOrder.id = transfer.id;
    return paymentOrder;
  }
}
