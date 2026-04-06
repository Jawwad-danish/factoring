import { TagDefinitionKey } from '@module-persistence/entities';
import Big from 'big.js';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';
import {
  expectTagActivityKeyOnInvoiceCount,
  expectTagKeyOnInvoiceCount,
} from '../expects';

describe('Invoice reject tests', () => {
  let appManager: IntegrationTestsAppManager;
  let steps: IntegrationTestsSteps;
  let brokerId: string;
  let clientId: string;

  beforeAll(async () => {
    appManager = await IntegrationTestsAppManager.init();
    steps = new IntegrationTestsSteps(appManager);
    await new IntegrationTestsDataManager(appManager).setup();
    brokerId = appManager.broker.id;
    clientId = appManager.client.id;
  });

  afterAll(async () => {
    if (appManager) {
      await appManager.close();
    }
  });

  it('Create Invoice - Reject', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
    });
    await steps.invoice.reject(createdInvoice.id);
  });

  it('Create Invoice - Tag with rejection reason - Reject', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
    });
    await steps.invoice.assignTag(createdInvoice.id, {
      key: TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
    });
    const rejectedInvoice = await steps.invoice.reject(createdInvoice.id, {
      key: TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
    });

    expectTagKeyOnInvoiceCount(
      TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
      rejectedInvoice,
      2,
    );
    expectTagActivityKeyOnInvoiceCount(
      TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
      rejectedInvoice,
      2,
    );
  }, 60000);
});
