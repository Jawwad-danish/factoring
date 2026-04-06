import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Invoice delete tests', () => {
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

  it('Create Invoice - Delete invoice - Fetch invoice', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId,
    });
    await steps.invoice.delete(createdInvoice.id);
    await steps.invoice.getOneDeleted(createdInvoice.id);
  }, 60000);
});
