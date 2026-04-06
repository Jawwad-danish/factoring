import { TagDefinitionKey } from '@module-persistence';
import { CreateReserveRequestBuilder } from '@module-reserves/test';
import { expectTagKeyOnInvoiceActivity } from '../expects';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Client overview integration tests', () => {
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

  it('Client overview', async () => {
    await initDataForInvoicesNeedsAttentionCount();
    await initDataForInvoicesPossibleChargebacksCount();
    const totalReserves = await initTotalReservesAmount();

    const overview = await steps.clients.overview(clientId);

    expect(overview.totalReservesAmount.toNumber()).toBe(
      totalReserves.amount.toNumber(),
    );
    expect(overview.invoicesNeedsAttentionCount).toBe(2);
    expect(overview.invoicesPossibleChargebacksCount).toBe(2);
    expect(overview.invoicesProcessingCount).toBe(5);
  });

  const initTotalReservesAmount = async () => {
    await steps.reserve.create(clientId, CreateReserveRequestBuilder.fee(100));
    await steps.reserve.create(
      clientId,
      CreateReserveRequestBuilder.clientCredit(200),
    );
    return await steps.reserve.total(clientId);
  };

  const initDataForInvoicesNeedsAttentionCount = async () => {
    await invoiceUnderReviewWithInvoiceIssuesTags();
    await invoiceUnderReviewWithProcessingActionItemsTags();
    await invoiceUnderReviewWithInvoiceIssuesTagsRemoved();
    await invoicePurchasedWithoutTags();
    await invoicePurchasedWithInvoiceIssuesTags();
    await invoicePaidWithoutTags();
  };

  /**
   * Represents an invoice that was not purchased yet with
   * one flag from the invoice issues category
   */
  const invoiceUnderReviewWithInvoiceIssuesTags = async () => {
    let invoice = await steps.invoice.create({
      clientId,
      brokerId,
    });
    invoice = await steps.invoice.assignTag(invoice.id, {
      key: TagDefinitionKey.MISSING_LUMPER_RECEIPT,
    });
    expectTagKeyOnInvoiceActivity(
      TagDefinitionKey.MISSING_LUMPER_RECEIPT,
      invoice,
    );
  };

  /**
   * Represents an invoice that was not purchased yet with
   * one flag from the invoice issues category
   */
  const invoiceUnderReviewWithProcessingActionItemsTags = async () => {
    let invoice = await steps.invoice.create({
      clientId,
      brokerId,
    });
    invoice = await steps.invoice.assignTag(invoice.id, {
      key: TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
    });
    expectTagKeyOnInvoiceActivity(
      TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
      invoice,
    );
  };

  /**
   * Represents an invoice that was not purchased yet with
   * one flag from the invoice issues category that was deleted
   */
  const invoiceUnderReviewWithInvoiceIssuesTagsRemoved = async () => {
    let invoice = await steps.invoice.create({
      clientId,
      brokerId,
    });
    invoice = await steps.invoice.assignTag(invoice.id, {
      key: TagDefinitionKey.MISSING_LUMPER_RECEIPT,
    });
    const activity = expectTagKeyOnInvoiceActivity(
      TagDefinitionKey.MISSING_LUMPER_RECEIPT,
      invoice,
    );

    await steps.invoice.deleteActivity(invoice.id, activity.id);
  };

  /**
   * Represents an invoice that was purchased
   * with no invoice issues tags
   */
  const invoicePurchasedWithoutTags = async () => {
    await steps.invoice.createAndPurchase({
      clientId,
      brokerId,
    });
  };

  /**
   * Represents an invoice that was purchased
   * with one invoice issue tag
   */
  const invoicePurchasedWithInvoiceIssuesTags = async () => {
    let invoice = await steps.invoice.createAndPurchase({
      clientId,
      brokerId,
    });
    invoice = await steps.invoice.assignTag(invoice.id, {
      key: TagDefinitionKey.MISSING_LUMPER_RECEIPT,
    });
    expectTagKeyOnInvoiceActivity(
      TagDefinitionKey.MISSING_LUMPER_RECEIPT,
      invoice,
    );
  };

  /**
   * Represents an invoice that was purchased
   * and paid with no invoice issues tags
   */
  const invoicePaidWithoutTags = async () => {
    await steps.invoice.createAndSendPayment({
      clientId,
      brokerId,
    });
  };

  const initDataForInvoicesPossibleChargebacksCount = async () => {
    await invoicePaymentSentWithInvoiceIssuesTags();
    await invoicePaymentCompletedWithInvoiceIssuesTags();
    await invoicePaymentSentWithProcessingActionItemsTags();
    await invoicePaymentCompletedWithInvoiceIssuesTagsRemoved();
  };

  /**
   * Represents an invoice that was purchased
   * and payment was sent with one invoice issue tag
   */
  const invoicePaymentSentWithInvoiceIssuesTags = async () => {
    let invoice = await steps.invoice.createAndSendPayment({
      clientId,
      brokerId,
    });
    invoice = await steps.invoice.assignTag(invoice.id, {
      key: TagDefinitionKey.MISSING_LUMPER_RECEIPT,
    });
    expectTagKeyOnInvoiceActivity(
      TagDefinitionKey.MISSING_LUMPER_RECEIPT,
      invoice,
    );
  };

  /**
   * Represents an invoice that was purchased
   * and payment was completed with one invoice issue tag
   */
  const invoicePaymentCompletedWithInvoiceIssuesTags = async () => {
    let invoice = await steps.invoice.createAndCompletePayment({
      clientId,
      brokerId,
    });
    invoice = await steps.invoice.assignTag(invoice.id, {
      key: TagDefinitionKey.MISSING_LUMPER_RECEIPT,
    });
    expectTagKeyOnInvoiceActivity(
      TagDefinitionKey.MISSING_LUMPER_RECEIPT,
      invoice,
    );
  };

  /**
   * Represents an invoice that was purchased and
   * payment was sent with one broker payment issues tag
   */
  const invoicePaymentSentWithProcessingActionItemsTags = async () => {
    let invoice = await steps.invoice.createAndSendPayment({
      clientId,
      brokerId,
    });
    invoice = await steps.invoice.assignTag(invoice.id, {
      key: TagDefinitionKey.BROKER_UNRESPONSIVE,
    });
    expectTagKeyOnInvoiceActivity(
      TagDefinitionKey.BROKER_UNRESPONSIVE,
      invoice,
    );
  };

  /**
   * Represents an invoice that was purchased
   * and payment was completed with one invoice issue tag
   */
  const invoicePaymentCompletedWithInvoiceIssuesTagsRemoved = async () => {
    let invoice = await steps.invoice.createAndCompletePayment({
      clientId,
      brokerId,
    });
    invoice = await steps.invoice.assignTag(invoice.id, {
      key: TagDefinitionKey.MISSING_LUMPER_RECEIPT,
    });
    const activity = expectTagKeyOnInvoiceActivity(
      TagDefinitionKey.MISSING_LUMPER_RECEIPT,
      invoice,
    );

    await steps.invoice.deleteActivity(invoice.id, activity.id);
  };
});
