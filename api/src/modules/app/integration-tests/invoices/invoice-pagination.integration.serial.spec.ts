import { PageCriteria } from '@core/data';
import dayjs from 'dayjs';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Invoice pagination integration tests', () => {
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

  beforeEach(async () => {
    await appManager.cleanupInvoices();
  });

  afterAll(async () => {
    if (appManager) {
      await appManager.close();
    }
  });

  it('should list invoices with pagination', async () => {
    const month = dayjs.utc().format('MMM');
    for (let i = 0; i < 50; i++) {
      await steps.invoice.create({
        clientId,
        brokerId,
        loadNumber: `inv${i}${month}`,
      });
    }
    const firstPage = await steps.invoice.getAll({
      page: new PageCriteria({ limit: 30, page: 1 }),
    });
    const secondPage = await steps.invoice.getAll({
      page: new PageCriteria({ limit: 30, page: 2 }),
    });

    expect(firstPage.length).toBe(30);
    expect(secondPage.length).toBe(20);
  }, 60000);
});
