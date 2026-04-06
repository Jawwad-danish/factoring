import Big from 'big.js';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Invoice creation tests', () => {
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

  it('Create Invoice', async () => {
    const loadNumber = 'jan01inv01';
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      loadNumber,
    });
    expect(createdInvoice.loadNumber).toBe(loadNumber);
  }, 60000);

  it('Create Invoice (Null Broker)', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId: null,
    });
    expect(createdInvoice.brokerId).toBe(null);
  }, 60000);

  it('Create Invoice ACH under Expedited limit $18', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      expedited: false,
      lineHaulRate: new Big(1799),
      lumper: new Big(0),
      detention: new Big(0),
      advance: new Big(0),
    });
    expect(createdInvoice).toBeDefined();
  }, 60000);

  it('Create Invoice ACH over Expedited limit $18', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      expedited: false,
      lineHaulRate: new Big(1800),
      lumper: new Big(0),
      detention: new Big(0),
      advance: new Big(0),
    });
    expect(createdInvoice).toBeDefined();
  }, 60000);

  it('Create Invoice Expedited under Expedited limit $18', async () => {
    await steps.invoice.failInvoiceCreate({
      clientId,
      brokerId,
      expedited: true,
      lineHaulRate: new Big(1799),
      lumper: new Big(0),
      detention: new Big(0),
      advance: new Big(0),
    });
  }, 60000);

  it('Create Invoice Expedited over Expedited limit $18', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      expedited: true,
      lineHaulRate: new Big(1800),
      lumper: new Big(0),
      detention: new Big(0),
      advance: new Big(0),
    });
    expect(createdInvoice).toBeDefined();
  }, 60000);
});
