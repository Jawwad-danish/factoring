import { TagDefinitionKey } from '@module-persistence';
import Big from 'big.js';
import { expectTagKeyNotOnInvoice, expectTagKeyOnInvoice } from '../expects';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Invoice update tests', () => {
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

  it('Create Invoice - Update Invoice', async () => {
    const loadNumber = 'jan01inv01';
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId,
    });
    const updatedInvoice = await steps.invoice.update(createdInvoice.id, {
      loadNumber,
    });

    expect(updatedInvoice.loadNumber).toBe(loadNumber);
  }, 60000);

  it('Create Invoice (Null Broker) - Update Invoice Broker', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId: null,
    });
    const updatedInvoice = await steps.invoice.update(createdInvoice.id, {
      brokerId,
    });

    expect(createdInvoice.brokerId).toBe(null);
    expect(updatedInvoice.brokerId).toBe(brokerId);
  });

  it('Create Invoice ACH - Update Invoice Expedited over Expedited limit 18$', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId: null,
      expedited: false,
      lineHaulRate: new Big(1800),
      lumper: new Big(0),
      detention: new Big(0),
      advance: new Big(0),
    });
    const updatedInvoice = await steps.invoice.update(createdInvoice.id, {
      expedited: true,
    });

    expect(createdInvoice.expedited).toBe(false);
    expect(updatedInvoice.expedited).toBe(true);
  });

  it('Create Invoice ACH - Update Invoice Expedited under Expedited limit 18$', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId: null,
      expedited: false,
      lineHaulRate: new Big(1799),
      lumper: new Big(0),
      detention: new Big(0),
      advance: new Big(0),
    });
    await steps.invoice.failUpdate(createdInvoice.id, {
      expedited: true,
    });
  });

  it.only('Create Invoice - Assign Tag - Update Invoice - Tag should be removed', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId: null,
      expedited: false,
      lineHaulRate: new Big(1799),
      lumper: new Big(0),
      detention: new Big(0),
      advance: new Big(0),
    });

    const invoiceAfterAssignTag = await steps.invoice.assignTag(
      createdInvoice.id,
      {
        key: TagDefinitionKey.OTHER_INVOICE_ISSUE,
      },
    );

    expectTagKeyOnInvoice(
      TagDefinitionKey.OTHER_INVOICE_ISSUE,
      invoiceAfterAssignTag,
    );

    const updatedInvoice = await steps.invoice.update(createdInvoice.id, {
      loadNumber: 'test123',
    });

    expectTagKeyNotOnInvoice(
      TagDefinitionKey.OTHER_INVOICE_ISSUE,
      updatedInvoice,
    );
  });
});
