import { TagDefinitionKey } from '@module-persistence/entities';
import { expectTagKeyNotOnInvoice } from '../expects';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Invoice documents tests', () => {
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

  it('Create Invoice - PDF generation in progress - PDF generation failure', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId,
    });
    const invoice = await steps.invoice.failDocumentGeneration(
      createdInvoice.id,
    );
    expectTagKeyNotOnInvoice(TagDefinitionKey.INVOICE_PDF_FAILURE, invoice);
    expectTagKeyNotOnInvoice(TagDefinitionKey.INVOICE_PDF_IN_PROGRESS, invoice);
  }, 60000);
});
