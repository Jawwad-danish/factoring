import { TagDefinitionKey } from '@module-persistence/entities';
import {
  expectTagActivityKeyOnInvoiceCount,
  expectTagKeyNotOnInvoice,
  expectTagKeyNotOnInvoiceActivity,
  expectTagKeyOnInvoice,
  expectTagKeyOnInvoiceActivity,
} from '../expects';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Invoice tag tests', () => {
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

  it('Create Invoice - Assign Activity (Invoice Issues) - Tag and activity are present', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId,
    });
    await steps.invoice.assignTag(createdInvoice.id, {
      key: TagDefinitionKey.OTHER_INVOICE_ISSUE,
      note: 'Other invoice issue',
    });

    const foundInvoice = await steps.invoice.getOne(createdInvoice.id);
    expectTagKeyOnInvoice(TagDefinitionKey.OTHER_INVOICE_ISSUE, foundInvoice);
    expectTagKeyOnInvoiceActivity(
      TagDefinitionKey.OTHER_INVOICE_ISSUE,
      foundInvoice,
    );
  }, 60000);

  it('Create Invoice - Assign Activity (Note) - Tag is not present, only activity', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId,
    });
    await steps.invoice.assignTag(createdInvoice.id, {
      key: TagDefinitionKey.NOTE,
      note: 'Normal note',
    });

    const foundInvoice = await steps.invoice.getOne(createdInvoice.id);
    expectTagKeyNotOnInvoice(TagDefinitionKey.NOTE, foundInvoice);
    expectTagKeyOnInvoiceActivity(TagDefinitionKey.NOTE, foundInvoice);
  }, 60000);

  it('Create Invoice - Assign Activity (Processing) - Tag is not present, only activity', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId,
    });
    await steps.invoice.assignTag(createdInvoice.id, {
      key: TagDefinitionKey.PROCESSING,
      note: 'Processing note',
    });

    const foundInvoice = await steps.invoice.getOne(createdInvoice.id);
    expectTagKeyNotOnInvoice(TagDefinitionKey.PROCESSING, foundInvoice);
    expectTagKeyOnInvoiceActivity(TagDefinitionKey.PROCESSING, foundInvoice);
  }, 60000);

  it('Create Invoice - Assign Activity (Note) - Delete Activity', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId,
    });
    await steps.invoice.assignTag(createdInvoice.id, {
      key: TagDefinitionKey.NOTE,
      note: 'Normal note',
    });

    let foundInvoice = await steps.invoice.getOne(createdInvoice.id);
    expectTagKeyNotOnInvoice(TagDefinitionKey.NOTE, foundInvoice);
    const activity = expectTagKeyOnInvoiceActivity(
      TagDefinitionKey.NOTE,
      foundInvoice,
    );

    await steps.invoice.deleteActivity(createdInvoice.id, activity.id);
    foundInvoice = await steps.invoice.getOne(createdInvoice.id);
    expectTagKeyNotOnInvoiceActivity(TagDefinitionKey.NOTE, foundInvoice);
  }, 60000);

  it('Create Invoice - Assign Activity (Invoice Issues) - Delete tag', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId,
    });
    await steps.invoice.assignTag(createdInvoice.id, {
      key: TagDefinitionKey.OTHER_INVOICE_ISSUE,
      note: 'Other invoice issue',
    });

    let foundInvoice = await steps.invoice.getOne(createdInvoice.id);
    expectTagKeyOnInvoice(TagDefinitionKey.OTHER_INVOICE_ISSUE, foundInvoice);
    const activity = expectTagKeyOnInvoiceActivity(
      TagDefinitionKey.OTHER_INVOICE_ISSUE,
      foundInvoice,
    );

    await steps.invoice.deleteActivity(createdInvoice.id, activity.id);
    foundInvoice = await steps.invoice.getOne(createdInvoice.id);
    expectTagKeyNotOnInvoice(
      TagDefinitionKey.OTHER_INVOICE_ISSUE,
      foundInvoice,
    );
    expectTagActivityKeyOnInvoiceCount(
      TagDefinitionKey.OTHER_INVOICE_ISSUE,
      foundInvoice,
      0,
    );
    expectTagKeyNotOnInvoiceActivity(
      TagDefinitionKey.OTHER_INVOICE_ISSUE,
      foundInvoice,
    );
  }, 60000);
});
