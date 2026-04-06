import { mockMikroORMProvider, mockToken } from '@core/test';
import {
  buildStubClientBatchPaymentEntity,
  buildStubClientBatchPaymentRequest,
  stubClientBatchPaymentDataObject,
} from '@module-client-payments/test';
import { buildStubInvoiceEntity } from '@module-invoices/test';
import { ClientPaymentEntity, PaymentType } from '@module-persistence/entities';
import {
  ClientBatchPaymentRepository,
  InvoiceClientPaymentRepository,
  ReserveRepository,
} from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateClientBatchPaymentRule } from './create-client-batch-payment-rule';

describe('Create CreateClientBatchPaymentOperation Rule', () => {
  let rule: CreateClientBatchPaymentRule;
  let clientBatchPaymentRepository: ClientBatchPaymentRepository;
  let invoiceClientPaymentRepository: InvoiceClientPaymentRepository;
  let reserveRepository: ReserveRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateClientBatchPaymentRule, mockMikroORMProvider],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();
    rule = module.get(CreateClientBatchPaymentRule);
    clientBatchPaymentRepository = module.get<ClientBatchPaymentRepository>(
      ClientBatchPaymentRepository,
    );
    invoiceClientPaymentRepository = module.get<InvoiceClientPaymentRepository>(
      InvoiceClientPaymentRepository,
    );
    reserveRepository = module.get<ReserveRepository>(ReserveRepository);
  });

  it('Should be defined', async () => {
    expect(rule).toBeDefined();
  });
  it('Rule creates batch payment entity for ACH if payment new', async () => {
    const batchPaymentSpy = jest.spyOn(clientBatchPaymentRepository, 'persist');
    const invoicePaymentSpy = jest.spyOn(
      invoiceClientPaymentRepository,
      'persist',
    );
    const data = stubClientBatchPaymentDataObject();
    const invoiceList = [
      buildStubInvoiceEntity({
        id: data.client_payments[0].client_account_payment_attributions[0]
          .invoice_id,
      }),
      buildStubInvoiceEntity({
        id: data.client_payments[0].client_account_payment_attributions[1]
          .invoice_id,
      }),
    ];
    const payload = buildStubClientBatchPaymentRequest();
    const entity = buildStubClientBatchPaymentEntity();

    await rule.run({
      payload: payload,
      entity: entity,
      data: data,
      invoiceList: invoiceList,
      paymentExists: false,
    });
    expect(batchPaymentSpy).toHaveBeenCalledTimes(2);
    expect(invoicePaymentSpy).toHaveBeenCalledTimes(2);
    expect(entity.clientPayments.length).toBe(1);
    expect(entity.clientPayments[0]).toBeInstanceOf(ClientPaymentEntity);
    expect(entity.clientPayments[0].id).toBe(data.client_payments[0].id);
    expect(entity.clientPayments[0].clientId).toBe(
      data.client_payments[0].client_id,
    );
    expect(entity.clientPayments[0].transferType).toBe(PaymentType.ACH);
    expect(entity.clientPayments[0].transferFee.toNumber()).toBe(
      data.client_payments[0].fee,
    );
    expect(entity.clientPayments[0].amount.toNumber()).toBe(
      data.client_payments[0].amount,
    );
  });

  it('Rule creates batch payment entity for Wire', async () => {
    const batchPaymentSpy = jest.spyOn(clientBatchPaymentRepository, 'persist');
    const invoicePaymentSpy = jest.spyOn(
      invoiceClientPaymentRepository,
      'persist',
    );
    const data = stubClientBatchPaymentDataObject(PaymentType.WIRE);
    const invoiceList = [
      buildStubInvoiceEntity({
        id: data.client_payments[0].client_account_payment_attributions[0]
          .invoice_id,
      }),
      buildStubInvoiceEntity({
        id: data.client_payments[0].client_account_payment_attributions[1]
          .invoice_id,
      }),
    ];
    const payload = buildStubClientBatchPaymentRequest();
    const entity = buildStubClientBatchPaymentEntity();
    await rule.run({
      payload: payload,
      entity: entity,
      data: data,
      invoiceList: invoiceList,
      paymentExists: false,
    });
    expect(batchPaymentSpy).toHaveBeenCalledTimes(2);
    expect(invoicePaymentSpy).toHaveBeenCalledTimes(2);
    expect(entity.clientPayments.length).toBe(1);
    expect(entity.clientPayments[0]).toBeInstanceOf(ClientPaymentEntity);
    expect(entity.clientPayments[0].id).toBe(data.client_payments[0].id);
    expect(entity.clientPayments[0].clientId).toBe(
      data.client_payments[0].client_id,
    );
    expect(entity.clientPayments[0].transferType).toBe(PaymentType.WIRE);
    expect(entity.clientPayments[0].transferFee.toNumber()).toBe(
      data.client_payments[0].fee,
    );
    expect(entity.clientPayments[0].amount.toNumber()).toBe(
      data.client_payments[0].amount,
    );
  });

  it('Rule creates reserve entity for ACH-DEBIT operation if payment new', async () => {
    const batchPaymentSpy = jest.spyOn(clientBatchPaymentRepository, 'persist');
    const reserveSpy = jest.spyOn(reserveRepository, 'persist');
    const data = stubClientBatchPaymentDataObject(PaymentType.DEBIT);
    const invoiceList = [
      buildStubInvoiceEntity({
        id: data.client_payments[0].client_account_payment_attributions[0]
          .invoice_id,
      }),
      buildStubInvoiceEntity({
        id: data.client_payments[0].client_account_payment_attributions[1]
          .invoice_id,
      }),
    ];
    const payload = buildStubClientBatchPaymentRequest();
    const entity = buildStubClientBatchPaymentEntity();
    await rule.run({
      payload: payload,
      entity: entity,
      data: data,
      invoiceList: invoiceList,
      paymentExists: false,
    });

    expect(reserveSpy).toBeCalledTimes(1);

    expect(batchPaymentSpy).toHaveBeenCalledTimes(2);
    expect(entity.clientPayments.length).toBe(1);
    expect(entity.clientPayments[0]).toBeInstanceOf(ClientPaymentEntity);
    expect(entity.clientPayments[0].id).toBe(data.client_payments[0].id);
    expect(entity.clientPayments[0].clientId).toBe(
      data.client_payments[0].client_id,
    );
    expect(entity.clientPayments[0].transferType).toBe(PaymentType.DEBIT);
    expect(entity.clientPayments[0].transferFee.toNumber()).toBe(
      data.client_payments[0].fee,
    );
    expect(entity.clientPayments[0].amount.toNumber()).toBe(
      data.client_payments[0].amount,
    );
  });

  it('Rule does not create reserve entity for ACH operation if payment exists', async () => {
    const reserveSpy = jest.spyOn(reserveRepository, 'persist');
    const data = stubClientBatchPaymentDataObject(PaymentType.ACH);
    const payload = buildStubClientBatchPaymentRequest();
    const entity = buildStubClientBatchPaymentEntity();
    await rule.run({
      payload: payload,
      entity: entity,
      data: data,
      invoiceList: [],
      paymentExists: true,
    });
    expect(reserveSpy).toBeCalledTimes(0);
  });

  it('Rule does not create reserve entity for WIRE operation if payment exists', async () => {
    const reserveSpy = jest.spyOn(reserveRepository, 'persist');
    const data = stubClientBatchPaymentDataObject(PaymentType.WIRE);
    const payload = buildStubClientBatchPaymentRequest();
    const entity = buildStubClientBatchPaymentEntity();
    await rule.run({
      payload: payload,
      entity: entity,
      data: data,
      invoiceList: [],
      paymentExists: true,
    });
    expect(reserveSpy).toBeCalledTimes(0);
  });
});
