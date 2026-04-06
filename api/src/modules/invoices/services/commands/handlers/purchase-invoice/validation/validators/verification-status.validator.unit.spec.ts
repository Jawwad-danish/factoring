import { buildStubBroker } from '@module-brokers/test';
import { mockToken } from '@core/test';
import { ValidationError } from '@core/validation';
import { PurchaseInvoiceRequest } from '@module-invoices/data';
import { EntityStubs } from '@module-persistence/test';
import { buildStubClient } from '@module-clients/test';
import { VerificationStatus } from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import { VerificationStatusValidator } from './verification-status.validator';
import { FeatureFlagResolver } from '@module-common';

describe('Invoice verification status validator', () => {
  let validator: VerificationStatusValidator;
  let featureFlagResolver: FeatureFlagResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VerificationStatusValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validator = module.get(VerificationStatusValidator);
    featureFlagResolver = module.get(FeatureFlagResolver);
  });

  it('Throws error if verification required', async () => {
    const invoice = EntityStubs.buildStubInvoice();
    invoice.verificationStatus = VerificationStatus.Required;
    expect(
      validator.validate({
        entity: invoice,
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new PurchaseInvoiceRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Does not throw error if verification not required', async () => {
    const invoice = EntityStubs.buildStubInvoice();
    invoice.verificationStatus = VerificationStatus.Bypassed;
    expect(
      validator.validate({
        entity: invoice,
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new PurchaseInvoiceRequest(),
      }),
    ).resolves.not.toThrow(ValidationError);
  });

  it('Does not throw error if verification in progress and feature flag', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(false);
    const invoice = EntityStubs.buildStubInvoice();
    invoice.verificationStatus = VerificationStatus.InProgress;
    expect(
      validator.validate({
        entity: invoice,
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new PurchaseInvoiceRequest(),
      }),
    ).resolves.not.toThrow(ValidationError);
  });

  it('Throws error if verification in progress and feature flag is enabled', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const invoice = EntityStubs.buildStubInvoice();
    invoice.verificationStatus = VerificationStatus.InProgress;
    expect(
      validator.validate({
        entity: invoice,
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new PurchaseInvoiceRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });
});
