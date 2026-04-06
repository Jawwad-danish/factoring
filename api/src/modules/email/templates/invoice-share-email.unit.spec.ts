import { mockMikroORMProvider, mockToken } from '@core/test';
import { ValidationError } from '@core/validation';
import { buildStubClient } from '@module-clients/test';
import { FeatureFlagResolver } from '@module-common';
import {
  InvoiceDocumentType,
  InvoiceStatus,
} from '@module-persistence/entities';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../services';
import { InvoiceShareEmail } from './invoice-share-email';

describe('InvoiceShareEmail', () => {
  let invoiceShareEmail: InvoiceShareEmail;
  let emailService: EmailService;
  let featureFlagResolver: FeatureFlagResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, InvoiceShareEmail],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();
    emailService = module.get(EmailService);
    featureFlagResolver = module.get(FeatureFlagResolver);
    invoiceShareEmail = module.get(InvoiceShareEmail);
  }, 60000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(invoiceShareEmail).toBeDefined();
  });

  it('should not send email if feature flag is disabled', async () => {
    jest.spyOn(featureFlagResolver, 'isDisabled').mockReturnValue(true);
    const client = buildStubClient();
    const invoice = EntityStubs.buildStubInvoice();
    const sendSpy = jest.spyOn(emailService, 'sendTemplate');
    await invoiceShareEmail.send({ emails: '', client, invoice });
    expect(sendSpy).toHaveBeenCalledTimes(0);
  });

  it(`should throw error if invoice status is not ${InvoiceStatus.Purchased}`, async () => {
    jest.spyOn(featureFlagResolver, 'isDisabled').mockReturnValue(false);
    const client = buildStubClient();
    const invoice = EntityStubs.buildStubInvoice({
      status: InvoiceStatus.UnderReview,
    });
    await expect(
      invoiceShareEmail.send({ emails: '', client, invoice }),
    ).rejects.toThrow(ValidationError);
  });

  it(`should throw error if invoice does not have documents`, async () => {
    jest.spyOn(featureFlagResolver, 'isDisabled').mockReturnValue(false);
    const client = buildStubClient();
    const invoice = EntityStubs.buildStubInvoice({
      status: InvoiceStatus.Purchased,
      documents: [],
    });
    await expect(
      invoiceShareEmail.send({ emails: '', client, invoice }),
    ).rejects.toThrow(ValidationError);
  });

  it('should send email when all conditions are met', async () => {
    jest.spyOn(featureFlagResolver, 'isDisabled').mockReturnValue(false);
    const client = buildStubClient();
    const invoice = EntityStubs.buildStubInvoice({
      status: InvoiceStatus.Purchased,
      documents: [
        EntityStubs.buildStubInvoiceDocument({
          type: InvoiceDocumentType.Generated,
        }),
      ],
    });
    await invoiceShareEmail.send({ emails: '', client, invoice });
    expect(emailService.urlAsAttachment).toHaveBeenCalledTimes(1);
  });
});
