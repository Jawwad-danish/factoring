import { mockMikroORMProvider, mockToken } from '@core/test';
import { RecordStatus } from '@module-persistence/entities';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { buildStubDeleteBrokerPaymentRequest } from '../../../../../test';
import { DeleteBrokerPaymentUpdateInvoiceRule } from './delete-broker-payment-update-invoice-rule';
import { startOfDay } from '@core/date-time';

describe('DeleteBrokerPaymentUpdateInvoiceRule', () => {
  let rule: DeleteBrokerPaymentUpdateInvoiceRule;

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, DeleteBrokerPaymentUpdateInvoiceRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(DeleteBrokerPaymentUpdateInvoiceRule);
  });

  it('should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('should set payment date to null if other payments do not exist', async () => {
    const brokerPayment = EntityStubs.buildStubBrokerPayment({
      recordStatus: RecordStatus.Inactive,
    });
    const invoice = EntityStubs.buildStubInvoice({
      brokerPayments: [brokerPayment],
      paymentDate: new Date(),
    });
    await rule.run({
      brokerPayment,
      invoice,
      request: buildStubDeleteBrokerPaymentRequest(),
    });

    expect(invoice.paymentDate).toBeNull();
  });

  it('should set payment date to the date of the last posting date', async () => {
    const activeBrokerPayment = EntityStubs.buildStubBrokerPayment({
      batchDate: startOfDay().toDate(),
      recordStatus: RecordStatus.Active,
    });
    const deletedBrokerPayment = EntityStubs.buildStubBrokerPayment({
      recordStatus: RecordStatus.Inactive,
    });
    const invoice = EntityStubs.buildStubInvoice({
      brokerPayments: [activeBrokerPayment, deletedBrokerPayment],
      paymentDate: null,
    });
    await rule.run({
      brokerPayment: deletedBrokerPayment,
      invoice,
      request: buildStubDeleteBrokerPaymentRequest(),
    });

    expect(invoice.paymentDate).toEqual(activeBrokerPayment.createdAt);
  });
});
