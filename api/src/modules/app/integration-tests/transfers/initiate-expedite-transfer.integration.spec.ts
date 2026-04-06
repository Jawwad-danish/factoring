import { FilterCriteria, FilterOperator } from '@core/data';
import {
  ClientPaymentStatus,
  VerificationStatus,
} from '@module-persistence/entities';
import Big from 'big.js';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Expedite transfer integration tests', () => {
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

  it('Create Invoices - Verify Invoices - Purchase invoices - Initiate expedite transfer', async () => {
    const invoice1 = await steps.invoice.create({
      clientId,
      brokerId,
      expedited: false,
    });
    await steps.invoice.verify(invoice1.id, {
      status: VerificationStatus.Verified,
    });
    await steps.invoice.purchase(invoice1.id);

    const invoice2 = await steps.invoice.create({
      clientId,
      brokerId,
      expedited: true,
      lineHaulRate: new Big(100000),
    });
    await steps.invoice.verify(invoice2.id, {
      status: VerificationStatus.Verified,
    });
    await steps.invoice.purchase(invoice2.id);

    await steps.transfers.initiateExpedite({
      clientId: clientId,
    });
    const invoices = await steps.invoice.getAll({
      filters: [
        new FilterCriteria({
          name: 'clientId',
          operator: FilterOperator.EQ,
          value: clientId,
        }),
      ],
    });

    expect(invoices.length).toBe(2);
    for (const invoice of invoices) {
      expect(invoice.expedited).toBe(true);
      expect(invoice.clientPaymentStatus).toBe(ClientPaymentStatus.Sent);
    }
  }, 60000);
});
