import { ValidationError } from '@core/validation';
import { buildStubUpdateInvoiceRequest } from '@module-invoices/test';
import { buildStubClient } from '@module-clients/test';
import {
  ClientPaymentStatus,
  InvoiceStatus,
} from '@module-persistence/entities';
import { InvoiceNotLockedValidator } from './invoice-not-locked.validator';
import { FeatureFlagResolver } from '@module-common';
import { Test, TestingModule } from '@nestjs/testing';
import { mockToken } from '@core/test';
import { EntityStubs } from '@module-persistence/test';

describe('Invoice not locked validator', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let validator: InvoiceNotLockedValidator<unknown>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoiceNotLockedValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    validator = module.get(InvoiceNotLockedValidator);
  });

  it('Should not throw error if the invoice is not locked', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(true);
    await validator.validate({
      entity: EntityStubs.buildStubInvoice({
        status: InvoiceStatus.Purchased,
        clientPaymentStatus: ClientPaymentStatus.Completed,
      }),
      client: buildStubClient(),
      broker: null,
      payload: buildStubUpdateInvoiceRequest(),
    });
  });

  it('Should throw error if the invoice is locked', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(true);
    const payload = buildStubUpdateInvoiceRequest();
    const entity = EntityStubs.buildStubInvoice({
      status: InvoiceStatus.Purchased,
      clientPaymentStatus: ClientPaymentStatus.InProgress,
    });

    expect(
      validator.validate({
        entity: entity,
        client: buildStubClient(),
        broker: null,
        payload: payload,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Should not throw if feature flag is disabled', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(false);
    const payload = buildStubUpdateInvoiceRequest();
    const entity = EntityStubs.buildStubInvoice({
      status: InvoiceStatus.Purchased,
      clientPaymentStatus: ClientPaymentStatus.InProgress,
    });

    expect(
      validator.validate({
        entity: entity,
        client: buildStubClient(),
        broker: null,
        payload: payload,
      }),
    ).resolves.not.toThrow(ValidationError);
  });
});
