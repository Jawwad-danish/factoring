import { mockMikroORMProvider } from '@core/test';
import { ValidationError } from '@core/validation';
import { Test } from '@nestjs/testing';
import { buildStubCreateBrokerPaymentRequest } from '../../../../../test';
import { LastBrokerPaymentValidator } from './last-broker-payment.validator';
import { EntityStubs } from '@module-persistence/test';

describe('Check last broker payment when deleting', () => {
  let validator: LastBrokerPaymentValidator;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [mockMikroORMProvider, LastBrokerPaymentValidator],
    }).compile();
    validator = module.get(LastBrokerPaymentValidator);
  });

  it('When broker payment is last, validation passes', async () => {
    const invoice = EntityStubs.buildStubInvoice();
    const firstBrokerPayment = EntityStubs.buildStubBrokerPayment({
      createdAt: new Date('01-01-2000'),
    });
    const secondBrokerPayment = EntityStubs.buildStubBrokerPayment({
      createdAt: new Date('01-01-2001'),
    });
    invoice.brokerPayments.add([firstBrokerPayment, secondBrokerPayment]);
    expect(
      validator.validate({
        brokerPayment: secondBrokerPayment,
        invoice: invoice,
        request: buildStubCreateBrokerPaymentRequest(),
      }),
    ).resolves.not.toThrow();
  });

  it('When broker payment is not last, validation throws error', async () => {
    const invoice = EntityStubs.buildStubInvoice();
    const firstBrokerPayment = EntityStubs.buildStubBrokerPayment({
      createdAt: new Date('01-01-2000'),
    });
    const secondBrokerPayment = EntityStubs.buildStubBrokerPayment({
      createdAt: new Date('01-01-2001'),
    });
    invoice.brokerPayments.add([firstBrokerPayment, secondBrokerPayment]);
    expect(
      validator.validate({
        brokerPayment: firstBrokerPayment,
        invoice: invoice,
        request: buildStubCreateBrokerPaymentRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });
});
