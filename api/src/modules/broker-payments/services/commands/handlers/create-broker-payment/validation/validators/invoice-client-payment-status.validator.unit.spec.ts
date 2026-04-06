import { mockToken } from '@core/test';
import { Test, TestingModule } from '@nestjs/testing';

import { ValidationError } from '@core/validation';
import { ClientPaymentStatus } from '@module-persistence/entities';
import { buildStubCreateBrokerPaymentRequest } from '../../../../../../test';
import { InvoiceClientPaymentStatusValidator } from './invoice-client-payment-status.validator';
import { FeatureFlagResolver } from '@module-common';
import { EntityStubs } from '@module-persistence/test';

describe('Check client payment status validator', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let validator: InvoiceClientPaymentStatusValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoiceClientPaymentStatusValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    validator = module.get(InvoiceClientPaymentStatusValidator);
  });

  it('Does not throw error when client payment status is sent', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(true);
    const payload = buildStubCreateBrokerPaymentRequest();

    expect(
      validator.validate({
        brokerPayment: EntityStubs.buildStubBrokerPayment(),
        invoice: EntityStubs.buildStubInvoice({
          clientPaymentStatus: ClientPaymentStatus.Sent,
        }),
        request: payload,
      }),
    ).resolves.not.toThrow();
  });

  it('Does not throw error when client payment status is completed', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(true);

    expect(
      validator.validate({
        brokerPayment: EntityStubs.buildStubBrokerPayment(),
        invoice: EntityStubs.buildStubInvoice({
          clientPaymentStatus: ClientPaymentStatus.Completed,
        }),
        request: buildStubCreateBrokerPaymentRequest(),
      }),
    ).resolves.not.toThrow();
  });

  it('Throws error when client payment status is not sent/completed', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(true);

    expect(
      validator.validate({
        brokerPayment: EntityStubs.buildStubBrokerPayment(),
        invoice: EntityStubs.buildStubInvoice(),
        request: buildStubCreateBrokerPaymentRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Does not throw error if feature flag is disabled', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(false);
    expect(
      validator.validate({
        brokerPayment: EntityStubs.buildStubBrokerPayment(),
        invoice: EntityStubs.buildStubInvoice({
          clientPaymentStatus: ClientPaymentStatus.NotApplicable,
        }),
        request: buildStubCreateBrokerPaymentRequest(),
      }),
    ).resolves.not.toThrow();
  });
});
