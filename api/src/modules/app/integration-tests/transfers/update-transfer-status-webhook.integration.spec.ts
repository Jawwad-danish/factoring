import { FilterCriteria, FilterOperator } from '@core/data';
import {
  ClientPaymentStatus,
  VerificationStatus,
} from '@module-persistence/entities';
import { buildStubUpdateTransferStatusWebhookRequest } from '@module-transfers/test';
import Big from 'big.js';
import { TransferPaymentType } from '../../../transfers/data';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Update transfer status webhook tests', () => {
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

  it('Create Invoices - Verify Invoices - Purchase invoices - Initiate expedite transfer - receive update from transfers serivce', async () => {
    const invoice1 = await steps.invoice.create({
      clientId,
      brokerId,
      expedited: false,
      lineHaulRate: new Big(3000),
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

    const batchPayment = await steps.transfers.initiateExpedite({
      clientId: clientId,
    });

    const payload = buildStubUpdateTransferStatusWebhookRequest(
      TransferPaymentType.Wire,
    );
    payload.data.externalId = batchPayment.id;
    await steps.transfers.updateTransferStatus(payload);

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
      expect(invoice.clientPaymentStatus).toBe(ClientPaymentStatus.Completed);
    }
  }, 60000);
});
