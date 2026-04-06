import {
  TagDefinitionKey,
  VerificationStatus,
} from '@module-persistence/entities';
import { expectTagKeyOnInvoice } from '../expects';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Invoice verification tests', () => {
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

  it('Create Invoice - Tag Invoice (Invoice Issues) - Verify Invoice - Tag is present and status is set', async () => {
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

    const verifiedInvoice = await steps.invoice.verify(createdInvoice.id, {
      status: VerificationStatus.Bypassed,
    });

    expectTagKeyOnInvoice(
      TagDefinitionKey.OTHER_INVOICE_ISSUE,
      verifiedInvoice,
    );
    expect(verifiedInvoice.verificationStatus).toBe(
      VerificationStatus.Bypassed,
    );
  }, 60000);
});
