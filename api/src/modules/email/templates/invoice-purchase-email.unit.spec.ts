import { mockToken } from '@core/test';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import { FeatureFlagResolver } from '@module-common';
import { TagDefinitionKey } from '@module-persistence';
import { EntityStubs } from '@module-persistence/test';
import { buildStubTagDefinition } from '@module-tag-definitions/test';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../services';
import { InvoicePurchaseEmail } from './invoice-purchase-email';
import { BrokerEmail, BrokerEmailType } from '../../brokers';

describe('InvoicePurchaseEmail', () => {
  let invoicePurchaseEmail: InvoicePurchaseEmail;
  let emailService: EmailService;
  let featureFlagResolver: FeatureFlagResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoicePurchaseEmail],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();
    emailService = module.get(EmailService);
    featureFlagResolver = module.get(FeatureFlagResolver);
    invoicePurchaseEmail = module.get(InvoicePurchaseEmail);
  }, 60000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(invoicePurchaseEmail).toBeDefined();
  });

  it('should not send email if feature flag is disabled', async () => {
    jest.spyOn(featureFlagResolver, 'isDisabled').mockReturnValue(true);
    const client = buildStubClient();
    const broker = buildStubBroker({
      tags: [buildStubTagDefinition(TagDefinitionKey.BROKER_REQUIRE_EMAIL)],
    });
    const invoice = EntityStubs.buildStubInvoice();
    const sendSpy = jest.spyOn(emailService, 'sendTemplate');
    await invoicePurchaseEmail.send({ client, broker, invoice });
    expect(sendSpy).toHaveBeenCalledTimes(0);
  });

  it(`should not send email if ${TagDefinitionKey.BROKER_REQUIRE_EMAIL} tag is not present`, async () => {
    jest.spyOn(featureFlagResolver, 'isDisabled').mockReturnValue(false);
    const client = buildStubClient();
    const broker = buildStubBroker({
      tags: [],
    });
    const invoice = EntityStubs.buildStubInvoice();
    const sendSpy = jest.spyOn(emailService, 'sendTemplate');
    await invoicePurchaseEmail.send({ client, broker, invoice });
    expect(sendSpy).toHaveBeenCalledTimes(0);
  });

  it(`should not send email if no ${BrokerEmailType.InvoiceDelivery} emails are present`, async () => {
    jest.spyOn(featureFlagResolver, 'isDisabled').mockReturnValue(false);
    const client = buildStubClient();
    const broker = buildStubBroker({
      tags: [buildStubTagDefinition(TagDefinitionKey.BROKER_REQUIRE_EMAIL)],
      emails: [],
    });
    const invoice = EntityStubs.buildStubInvoice();
    const sendSpy = jest.spyOn(emailService, 'sendTemplate');
    await invoicePurchaseEmail.send({ client, broker, invoice });
    expect(sendSpy).toHaveBeenCalledTimes(0);
  });

  it('should send email when all conditions are met', async () => {
    jest.spyOn(featureFlagResolver, 'isDisabled').mockReturnValue(false);
    const client = buildStubClient();
    const broker = buildStubBroker({
      tags: [buildStubTagDefinition(TagDefinitionKey.BROKER_REQUIRE_EMAIL)],
      emails: [new BrokerEmail({ type: BrokerEmailType.InvoiceDelivery })],
    });
    const invoice = EntityStubs.buildStubInvoice();
    const sendSpy = jest.spyOn(emailService, 'sendTemplate');
    await invoicePurchaseEmail.send({ client, broker, invoice });
    expect(sendSpy).toHaveBeenCalledTimes(1);
  });
});
