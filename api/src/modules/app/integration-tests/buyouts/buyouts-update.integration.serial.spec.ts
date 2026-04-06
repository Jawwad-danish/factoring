import { CreateBuyoutsRequest } from '@fs-bobtail/factoring/data';
import { Client } from '@module-clients/data';
import { Broker } from '@module-brokers/data';
import Big from 'big.js';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { ITAppManager } from '../setup/it-app-manager';
import { IntegrationTestsSteps } from '../steps';

describe('Pending buyouts update tests', () => {
  let appManager: IntegrationTestsAppManager;
  let steps: IntegrationTestsSteps;
  let clientId: string;

  beforeAll(async () => {
    appManager = await IntegrationTestsAppManager.init();
    steps = new IntegrationTestsSteps(appManager);
    await new IntegrationTestsDataManager(appManager).setup();
    clientId = appManager.client.id;
  });

  afterAll(async () => {
    if (appManager) {
      await appManager.close();
    }
  });

  it('Should update load number on a pending buyout', async () => {
    await steps.buyout.createBatch({
      batch: [
        new CreateBuyoutsRequest({
          clientId,
          brokerName: 'Broker A',
          buyoutDate: new Date(),
          loadNumber: 'LOAD-001',
          mc: 'mc',
          rate: new Big(100),
        }),
      ],
    });
    const buyouts = await steps.buyout.getAll();
    const buyout = buyouts[0];

    const updated = await steps.buyout.update(buyout.id, {
      loadNumber: 'LOAD-UPDATED',
    });

    expect(updated.loadNumber).toBe('LOAD-UPDATED');
  }, 60000);

  it('Should update rate on a pending buyout', async () => {
    await steps.buyout.createBatch({
      batch: [
        new CreateBuyoutsRequest({
          clientId,
          brokerName: 'Broker A',
          buyoutDate: new Date(),
          loadNumber: 'LOAD-002',
          mc: 'mc',
          rate: new Big(100),
        }),
      ],
    });
    const buyouts = await steps.buyout.getAll();
    const buyout = buyouts[0];

    const updated = await steps.buyout.update(buyout.id, {
      rate: new Big(500),
    });

    expect(updated.rate).toEqual(new Big(500));
  }, 60000);

  it('Should update broker name on a pending buyout', async () => {
    await steps.buyout.createBatch({
      batch: [
        new CreateBuyoutsRequest({
          clientId,
          brokerName: 'Original Broker',
          buyoutDate: new Date(),
          loadNumber: 'LOAD-003',
          mc: 'mc',
          rate: new Big(100),
        }),
      ],
    });
    const buyouts = await steps.buyout.getAll();
    const buyout = buyouts[0];

    const updated = await steps.buyout.update(buyout.id, {
      brokerName: 'Updated Broker',
    });

    expect(updated.brokerName).toBe('Updated Broker');
  }, 60000);

  it('Should update multiple fields at once', async () => {
    await steps.buyout.createBatch({
      batch: [
        new CreateBuyoutsRequest({
          clientId,
          brokerName: 'Broker A',
          buyoutDate: new Date(),
          loadNumber: 'LOAD-004',
          mc: 'mc',
          rate: new Big(100),
        }),
      ],
    });
    const buyouts = await steps.buyout.getAll();
    const buyout = buyouts[0];

    const updated = await steps.buyout.update(buyout.id, {
      loadNumber: 'LOAD-MULTI',
      rate: new Big(999),
      brokerName: 'Multi Broker',
    });

    expect(updated.loadNumber).toBe('LOAD-MULTI');
    expect(updated.rate).toEqual(new Big(999));
    expect(updated.brokerName).toBe('Multi Broker');
  }, 60000);
});

describe('Pending buyouts update and bulk purchase tests', () => {
  let appManager: ITAppManager;
  let steps: IntegrationTestsSteps;
  let client: Client;
  let broker: Broker;

  beforeAll(async () => {
    appManager = await ITAppManager.init();
    steps = new IntegrationTestsSteps(appManager);
    client = await appManager.data.createClient({
      factoringConfig: {
        factoringRatePercentage: new Big(3.0),
        reserveRatePercentage: new Big(1.5),
      },
    });
    broker = appManager.data.createBroker();
  });

  afterAll(async () => {
    if (appManager) {
      await appManager.close();
    }
  });

  it('Should create, update, then bulk purchase - invoices reflect updated values', async () => {
    await steps.buyout.createBatch({
      batch: [
        new CreateBuyoutsRequest({
          clientId: client.id,
          brokerName: broker.legalName,
          buyoutDate: new Date(),
          loadNumber: 'ORIGINAL',
          mc: broker.mc,
          rate: new Big(100),
        }),
      ],
    });
    const buyouts = await steps.buyout.getAll();
    const buyout = buyouts[0];

    await steps.buyout.update(buyout.id, {
      loadNumber: 'UPDATED',
      rate: new Big(750),
    });

    const invoices = await steps.buyout.bulkPurchase();

    expect(invoices.length).toBeGreaterThan(0);
    const invoice = invoices[0];
    expect(invoice.loadNumber).toBe('UPDATED');
    expect(invoice.lineHaulRate).toEqual(new Big(750));
  }, 60000);
});
