import { mockToken } from '@core/test';
import { ValidationError } from '@core/validation';
import { AuthorityState, InsuranceStatus } from '@module-clients';
import { buildStubClient } from '@module-clients/test';
import { FeatureFlagResolver } from '@module-common';
import { PurchaseInvoiceRequest } from '@module-invoices/data';
import {
  EntityStubs,
  PartialClientFactoringConfigsEntity,
} from '@module-persistence/test';
import { ClientFactoringStatus } from '@module-persistence/entities';
import { ClientFactoringConfigsRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { CheckClientStatus } from './check-client-status.validator';

describe('Client approve invoice validator', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let validator: CheckClientStatus;
  let clientConfigRepository: ClientFactoringConfigsRepository;

  const mockClientFactoringConfig = (
    data?: PartialClientFactoringConfigsEntity,
  ) => {
    jest
      .spyOn(clientConfigRepository, 'getOneByClientId')
      .mockResolvedValue(EntityStubs.buildClientFactoringConfig(data));
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CheckClientStatus],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    validator = module.get(CheckClientStatus);
    clientConfigRepository = module.get(ClientFactoringConfigsRepository);
  });

  it('Cannot approve invoices inactive clients', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(true);
    mockClientFactoringConfig();
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: buildStubClient({
          commonAuthorityStatus: AuthorityState.Inactive,
          insuranceStatus: InsuranceStatus.Inactive,
        }),
        broker: null,
        payload: new PurchaseInvoiceRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Cannot approve invoices onboarding clients', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(true);
    mockClientFactoringConfig({
      status: ClientFactoringStatus.Onboarding,
    });
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: buildStubClient(),
        broker: null,
        payload: new PurchaseInvoiceRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Cannot approve invoices clients on hold', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(true);
    mockClientFactoringConfig({
      status: ClientFactoringStatus.Hold,
    });
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: buildStubClient(),
        broker: null,
        payload: new PurchaseInvoiceRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Active clients can approve an invoice', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(true);
    mockClientFactoringConfig({
      status: ClientFactoringStatus.Active,
    });
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: buildStubClient(),
        broker: null,
        payload: new PurchaseInvoiceRequest(),
      }),
    ).resolves.not.toThrow();
  });

  it('Does not throw error if feature flag is disabled', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(false);
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: buildStubClient(),
        broker: null,
        payload: new PurchaseInvoiceRequest(),
      }),
    ).resolves.not.toThrow();
  });
});
