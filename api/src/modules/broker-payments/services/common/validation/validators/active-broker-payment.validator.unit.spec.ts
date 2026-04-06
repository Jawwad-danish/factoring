import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@core/validation';
import { RecordStatus } from '@module-persistence/entities';
import { buildStubCreateBrokerPaymentRequest } from '../../../../test';
import { ActiveBrokerPaymentValidator } from './active-broker-payment.validator';
import { EntityStubs } from '@module-persistence/test';

describe('Check broker payment status to be active', () => {
  let validator: ActiveBrokerPaymentValidator<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActiveBrokerPaymentValidator],
    }).compile();

    validator = module.get(ActiveBrokerPaymentValidator);
  });

  it('When broker payment record status is active, validation passes', async () => {
    expect(
      validator.validate({
        brokerPayment: EntityStubs.buildStubBrokerPayment({
          recordStatus: RecordStatus.Active,
        }),
        invoice: EntityStubs.buildStubInvoice(),
        request: buildStubCreateBrokerPaymentRequest(),
      }),
    ).resolves.not.toThrow();
  });

  it('When broker payment record status is inactive, validation throws error', async () => {
    expect(
      validator.validate({
        brokerPayment: EntityStubs.buildStubBrokerPayment({
          recordStatus: RecordStatus.Inactive,
        }),
        invoice: EntityStubs.buildStubInvoice(),
        request: buildStubCreateBrokerPaymentRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });
});
