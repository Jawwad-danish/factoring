import { CreateInvoiceRequestBuilder } from '@module-invoices/test';
import { TagDefinitionKey } from '@module-persistence/entities';
import { expectTagKeyNotOnInvoice, expectTagKeyOnInvoice } from '../expects';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Duplicate detection for invoices', () => {
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

  it('should tag invoice as possible duplicate when load number matches existing invoice', async () => {
    const firstInvoice = await steps.invoice.create({
      clientId,
      brokerId,
    });
    const secondInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      loadNumber: firstInvoice.loadNumber,
    });

    expectTagKeyOnInvoice(
      TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
      secondInvoice,
    );
  }, 60000);

  it('should not tag invoice as duplicate when only monetary values match', async () => {
    const firstInvoice = await steps.invoice.create({
      clientId,
      brokerId,
    });
    const secondInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      lineHaulRate: firstInvoice.lineHaulRate,
      lumper: firstInvoice.lumper,
      detention: firstInvoice.detention,
      advance: firstInvoice.advance,
    });

    expectTagKeyNotOnInvoice(
      TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
      secondInvoice,
    );
  }, 60000);

  it('should not tag invoice as duplicate when no fields match', async () => {
    const firstInvoice = await steps.invoice.create({
      clientId,
      brokerId,
    });
    const secondInvoice = await steps.invoice.create({
      clientId,
      brokerId,
    });

    expectTagKeyNotOnInvoice(
      TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
      firstInvoice,
    );
    expectTagKeyNotOnInvoice(
      TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
      secondInvoice,
    );
  }, 60000);

  it('should remove duplicate tag when load number is updated to differ from existing invoice', async () => {
    const firstInvoice = await steps.invoice.create({
      clientId,
      brokerId,
    });
    const secondInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      loadNumber: firstInvoice.loadNumber,
    });

    expectTagKeyOnInvoice(
      TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
      secondInvoice,
    );

    const updatedInvoice = await steps.invoice.update(secondInvoice.id, {
      loadNumber: 'jan01inv01',
    });

    expectTagKeyNotOnInvoice(
      TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
      updatedInvoice,
    );
  }, 60000);

  // https://bobtail.atlassian.net/browse/IC-3441
  it('should tag possible duplicate when load number is updated to match one from existing invoice, and also reverted', async () => {
    const firstInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      loadNumber: '2589',
    });
    const secondInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      loadNumber: '2588',
    });

    expectTagKeyNotOnInvoice(
      TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
      secondInvoice,
    );

    const updatedInvoice = await steps.invoice.update(firstInvoice.id, {
      loadNumber: '2588',
    });

    expectTagKeyOnInvoice(
      TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
      updatedInvoice,
    );

    await steps.invoice.verify(updatedInvoice.id);
    await steps.invoice.purchase(updatedInvoice.id);
    await steps.invoice.revert(updatedInvoice.id);
    const finalInvoice = await steps.invoice.getOne(updatedInvoice.id);

    expectTagKeyOnInvoice(
      TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
      finalInvoice,
    );
  }, 60000);

  it('should detect possible duplicate when checking invoice with matching load number', async () => {
    const request = CreateInvoiceRequestBuilder.from({
      clientId,
      brokerId,
    });
    await steps.invoice.create(request);
    const checkResult = await steps.invoice.checkPossibleDuplicate(request);
    expect(checkResult.result).toBeTruthy();
  }, 60000);

  it('should not detect duplicate when checking invoice with different values', async () => {
    await steps.invoice.create({
      clientId,
      brokerId,
    });
    const request = CreateInvoiceRequestBuilder.from({
      clientId,
      brokerId,
    });
    const checkResult = await steps.invoice.checkPossibleDuplicate(request);
    expect(checkResult.result).toBeFalsy();
  }, 60000);
});
