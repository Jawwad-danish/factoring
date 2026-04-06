import { IntegrationTestsAppManager } from '../setup';
import { IntegrationTestsSteps } from '../steps';
import { IntegrationTestsDataManager } from '../setup';
import { TagDefinitionKey } from '@module-persistence/entities';
import { expectTagKeyNotOnInvoice, expectTagKeyOnInvoice } from '../expects';
import { Invoice } from '@module-invoices/data';

describe('Invoice tag tests', () => {
  let appManager: IntegrationTestsAppManager;
  let steps: IntegrationTestsSteps;
  let brokerId: string;
  let clientId: string;
  let createdInvoice: Invoice;

  beforeAll(async () => {
    appManager = await IntegrationTestsAppManager.init();
    steps = new IntegrationTestsSteps(appManager);
    await new IntegrationTestsDataManager(appManager).setup();
    brokerId = appManager.broker.id;
    clientId = appManager.client.id;
    createdInvoice = await steps.invoice.create({
      clientId,
      brokerId,
    });
  });

  afterAll(async () => {
    if (appManager) {
      await appManager.close();
    }
  });

  it('Purchase - Assign Activity BROKER_PAYMENT_SCHEDULED over other issues tags - issues tags should be removed', async () => {
    await steps.invoice.verify(createdInvoice.id);
    await steps.invoice.purchase(createdInvoice.id);

    await steps.invoice.assignTag(createdInvoice.id, {
      key: TagDefinitionKey.LOAD_NOT_DELIVERED,
      note: 'load not delivered',
    });
    await steps.invoice.assignTag(createdInvoice.id, {
      key: TagDefinitionKey.INCORRECT_RATE_ADDED,
      note: 'incorrect rate added',
    });

    let foundInvoice = await steps.invoice.getOne(createdInvoice.id);
    expect(foundInvoice.tags.length).toBe(2);
    expectTagKeyOnInvoice(TagDefinitionKey.LOAD_NOT_DELIVERED, foundInvoice);
    expectTagKeyOnInvoice(TagDefinitionKey.INCORRECT_RATE_ADDED, foundInvoice);

    await steps.invoice.assignTag(createdInvoice.id, {
      key: TagDefinitionKey.BROKER_PAYMENT_SCHEDULED,
      note: 'payment scheduled',
    });

    foundInvoice = await steps.invoice.getOne(createdInvoice.id);
    expect(foundInvoice.tags.length).toBe(1);
    expectTagKeyOnInvoice(
      TagDefinitionKey.BROKER_PAYMENT_SCHEDULED,
      foundInvoice,
    );
    expectTagKeyNotOnInvoice(TagDefinitionKey.LOAD_NOT_DELIVERED, foundInvoice);
    expectTagKeyNotOnInvoice(
      TagDefinitionKey.INCORRECT_RATE_ADDED,
      foundInvoice,
    );
  });

  it('Assign another tag over BROKER_PAYMENT_SCHEDULED - BROKER_PAYMENT_SCHEDULED should be removed', async () => {
    await steps.invoice.assignTag(createdInvoice.id, {
      key: TagDefinitionKey.LOAD_NOT_DELIVERED,
      note: 'broker not found',
    });

    const foundInvoice = await steps.invoice.getOne(createdInvoice.id);
    expect(foundInvoice.tags.length).toBe(1);
    expectTagKeyOnInvoice(TagDefinitionKey.LOAD_NOT_DELIVERED, foundInvoice);
    expectTagKeyNotOnInvoice(
      TagDefinitionKey.BROKER_PAYMENT_SCHEDULED,
      foundInvoice,
    );
  });

  it('Create Invoice - purchase - Assign Activity BROKER_PAYMENT_SCHEDULED 2 times - should remain just one BROKER_PAYMENT_SCHEDULED tags', async () => {
    const invoice = await steps.invoice.create({
      clientId,
      brokerId,
    });

    await steps.invoice.verify(invoice.id);
    await steps.invoice.purchase(invoice.id);

    await steps.invoice.assignTag(invoice.id, {
      key: TagDefinitionKey.BROKER_PAYMENT_SCHEDULED,
      note: 'payment scheduled',
    });

    let foundInvoice = await steps.invoice.getOne(invoice.id);
    expect(foundInvoice.tags.length).toBe(1);
    expectTagKeyOnInvoice(
      TagDefinitionKey.BROKER_PAYMENT_SCHEDULED,
      foundInvoice,
    );

    await steps.invoice.assignTag(invoice.id, {
      key: TagDefinitionKey.BROKER_PAYMENT_SCHEDULED,
      note: 'payment scheduled',
    });

    foundInvoice = await steps.invoice.getOne(invoice.id);
    expect(foundInvoice.tags.length).toBe(1);
    expectTagKeyOnInvoice(
      TagDefinitionKey.BROKER_PAYMENT_SCHEDULED,
      foundInvoice,
    );
  });
});
