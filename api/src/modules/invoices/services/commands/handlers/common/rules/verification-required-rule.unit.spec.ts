import { mockMikroORMProvider, mockToken } from '@core/test';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import { FeatureFlagResolver } from '@module-common';
import { UpdateInvoiceRequest } from '@module-invoices/data';
import {
  buildStubCreateInvoiceRequest,
  buildStubUpdateInvoiceRequest,
} from '@module-invoices/test';
import {
  ClientPaymentStatus,
  InvoiceStatus,
  TagDefinitionKey,
  VerificationStatus,
} from '@module-persistence/entities';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { VerificationEngine } from '../../../../engines';
import { VerificationRequiredRule } from './verification-required-rule';

describe('VerificationRequiredRule', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let verificationEngine: VerificationEngine;
  let verificationRequiredRule: VerificationRequiredRule<
    CreateInvoiceRequest | UpdateInvoiceRequest
  >;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, VerificationRequiredRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    verificationEngine = module.get(VerificationEngine);
    verificationRequiredRule = module.get(VerificationRequiredRule);
  }, 60000);

  it('should be defined', () => {
    expect(verificationRequiredRule).toBeDefined();
  });

  it('should run mandatory checks when feature flag is disabled', async () => {
    jest.spyOn(featureFlagResolver, 'isDisabled').mockReturnValueOnce(true);
    jest
      .spyOn(verificationEngine, 'runMandatoryChecks')
      .mockResolvedValueOnce([]);
    const invoice = EntityStubs.buildStubInvoice({
      verificationStatus: VerificationStatus.NotRequired,
    });
    const result = await verificationRequiredRule.run({
      entity: invoice,
      client: buildStubClient(),
      broker: buildStubBroker(),
      payload: buildStubCreateInvoiceRequest(),
    });

    expect(verificationEngine.runMandatoryChecks).toHaveBeenCalledTimes(1);
    expect(result.actions.length).toBe(0);
    expect(invoice.verificationStatus).toBe(VerificationStatus.NotRequired);
  });

  it('should set verification status to required when mandatory checks return results', async () => {
    jest.spyOn(featureFlagResolver, 'isDisabled').mockReturnValueOnce(true);
    jest.spyOn(verificationEngine, 'runMandatoryChecks').mockResolvedValueOnce([
      {
        note: 'Mandatory check failed',
        payload: {
          cause: 'Test cause',
        },
      },
    ]);
    const invoice = EntityStubs.buildStubInvoice({
      verificationStatus: VerificationStatus.NotRequired,
    });
    const result = await verificationRequiredRule.run({
      entity: invoice,
      client: buildStubClient(),
      broker: buildStubBroker(),
      payload: buildStubCreateInvoiceRequest(),
    });

    expect(verificationEngine.runMandatoryChecks).toHaveBeenCalledTimes(1);
    expect(result.actions.length).toBe(1);
    expect(result.actions[0].key).toBe(TagDefinitionKey.VERIFICATION_ENGINE);
    expect(invoice.verificationStatus).toBe(VerificationStatus.Required);
  });

  it('should set verification status to required when verification engine returns results', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    jest.spyOn(verificationEngine, 'run').mockResolvedValueOnce([
      {
        note: '',
        payload: {
          cause: '',
        },
      },
    ]);
    const invoice = EntityStubs.buildStubInvoice({
      verificationStatus: VerificationStatus.NotRequired,
    });
    const result = await verificationRequiredRule.run({
      entity: invoice,
      client: buildStubClient(),
      broker: buildStubBroker(),
      payload: buildStubCreateInvoiceRequest(),
    });

    expect(result.actions.length).toBe(1);
    expect(result.actions[0].key).toBe(TagDefinitionKey.VERIFICATION_ENGINE);
    expect(invoice.verificationStatus).toBe(VerificationStatus.Required);
  });

  it('should set verification status to not required for create request when engine returns no results', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    jest.spyOn(verificationEngine, 'run').mockResolvedValueOnce([]);
    const invoice = EntityStubs.buildStubInvoice({
      verificationStatus: VerificationStatus.Required,
    });
    const result = await verificationRequiredRule.run({
      entity: invoice,
      client: buildStubClient(),
      broker: buildStubBroker(),
      payload: buildStubCreateInvoiceRequest(),
    });

    expect(result.actions.length).toBe(0);
    expect(invoice.verificationStatus).toBe(VerificationStatus.NotRequired);
  });

  it('should preserve existing verification status for update request when engine returns no results', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    jest.spyOn(verificationEngine, 'run').mockResolvedValueOnce([]);
    const invoice = EntityStubs.buildStubInvoice({
      verificationStatus: VerificationStatus.Required,
    });
    const result = await verificationRequiredRule.run({
      entity: invoice,
      client: buildStubClient(),
      broker: buildStubBroker(),
      payload: buildStubUpdateInvoiceRequest(),
    });

    expect(result.actions.length).toBe(0);
    expect(invoice.verificationStatus).toBe(VerificationStatus.Required);
  });

  it('should not run the engine if the invoice is purchased and paid', async () => {
    const runEngineSpy = jest.spyOn(verificationEngine, 'run');
    const invoice = EntityStubs.buildStubInvoice({
      status: InvoiceStatus.Purchased,
      clientPaymentStatus: ClientPaymentStatus.Completed,
    });
    const result = await verificationRequiredRule.run({
      entity: invoice,
      client: buildStubClient(),
      broker: buildStubBroker(),
      payload: buildStubUpdateInvoiceRequest(),
    });

    expect(result.actions.length).toBe(0);
    expect(invoice.verificationStatus).toBe(VerificationStatus.Required);
    expect(runEngineSpy).not.toHaveBeenCalled();
  });
});
