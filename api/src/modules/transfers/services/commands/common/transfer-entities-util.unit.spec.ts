import { mockMikroORMProvider } from '@core/test';
import { EntityStubs } from '@module-persistence/test';
import {
  ClientBatchPaymentEntity,
  ClientBatchPaymentStatus,
  ClientPaymentEntity,
  ClientPaymentOperationType,
  PaymentType,
  ReserveReason,
} from '@module-persistence/entities';
import { Test } from '@nestjs/testing';
import Big from 'big.js';
import { TransferEntitiesUtil } from './transfer-entities-util';

describe('TransferEntitiesUtil', () => {
  beforeEach(async () => {
    await Test.createTestingModule({
      providers: [mockMikroORMProvider],
    }).compile();
  });

  it('Regular batch payment is created when payment type is ACH', async () => {
    const batchPayment = TransferEntitiesUtil.createBatchPayment(
      PaymentType.ACH,
    );

    expect(batchPayment.status).toBe(ClientBatchPaymentStatus.Pending);
    expect(batchPayment.type).toBe(PaymentType.ACH);
    expect(batchPayment.name).toContain('regular');
  });

  it('Expedite batch payment is created when payment type is WIRE', async () => {
    const batchPayment = TransferEntitiesUtil.createBatchPayment(
      PaymentType.WIRE,
    );

    expect(batchPayment.status).toBe(ClientBatchPaymentStatus.Pending);
    expect(batchPayment.type).toBe(PaymentType.WIRE);
    expect(batchPayment.name).toContain('expedite');
  });

  it('Regular client payment is created with expected defaults', async () => {
    const batchPayment = new ClientBatchPaymentEntity();
    const clientPayment = TransferEntitiesUtil.createRegularClientPayment(
      new Big(10),
      'id',
      batchPayment,
    );

    expect(clientPayment.amount.toNumber()).toBe(10);
    expect(clientPayment.operationType).toBe(ClientPaymentOperationType.Credit);
    expect(clientPayment.clientId).toBe('id');
    expect(clientPayment.clientBankAccountId).toBeUndefined();
    expect(clientPayment.transferType).toBe(PaymentType.ACH);
    expect(batchPayment.clientPayments.length).toBe(1);
  });

  it('Expedite client payment is created with expected defaults', async () => {
    const batchPayment = new ClientBatchPaymentEntity();
    const clientPayment = TransferEntitiesUtil.createExpediteClientPayment(
      new Big(10),
      new Big(18),
      { id: 'id', bankAccountId: 'bankAccountId', lastFourDigits: '0000' },
      batchPayment,
    );

    expect(clientPayment.amount.toNumber()).toBe(10);
    expect(clientPayment.operationType).toBe(ClientPaymentOperationType.Credit);
    expect(clientPayment.clientId).toBe('id');
    expect(clientPayment.clientBankAccountId).toBe('bankAccountId');
    expect(clientPayment.transferType).toBe(PaymentType.WIRE);
    expect(batchPayment.clientPayments.length).toBe(1);
  });

  it('Invoice client payment is created with expected defaults', async () => {
    const clientPayments = new ClientPaymentEntity();
    const invoiceClientPayment =
      TransferEntitiesUtil.createInvoiceClientPayment(
        EntityStubs.buildStubInvoice({
          accountsReceivableValue: new Big(100),
          reserveFee: new Big(10),
          approvedFactorFee: new Big(10),
          deduction: new Big(10),
        }),
        clientPayments,
      );

    expect(invoiceClientPayment.amount.toNumber()).toBe(70);
    expect(clientPayments.invoicePayments?.length).toBe(1);
  });

  it('Reserve client payment is created with expected defaults', async () => {
    const clientPayments = new ClientPaymentEntity();
    const reserveClientPayment =
      TransferEntitiesUtil.createReserveClientPayment(
        EntityStubs.buildStubReserve({
          reason: ReserveReason.ReleaseOfFunds,
          amount: new Big(-10),
        }),
        clientPayments,
      );

    expect(reserveClientPayment.amount.toNumber()).toBe(10);
    expect(clientPayments.reservePayments?.length).toBe(1);
  });
});
