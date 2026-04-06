import { getDateInBusinessTimezone } from '@core/date-time';
import { CreateBuyoutsRequest } from '@fs-bobtail/factoring/data';
import { Broker } from '@module-brokers/data';
import { Client } from '@module-clients/data';
import { VerificationStatus } from '@module-persistence';
import Big from 'big.js';
import { TransferPaymentType } from '../../../transfers/data';
import { buildStubUpdateTransferStatusWebhookRequest } from '../../../transfers/test';
import { ITAppManager } from '../setup/it-app-manager';
import { IntegrationTestsSteps } from '../steps';

describe('Upcoming regular and expedited transfers merged into expedite tests', () => {
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

  beforeEach(async () => {
    jest.useRealTimers();
  });

  afterAll(async () => {
    if (appManager) {
      await appManager.close();
    }
  });

  it('Create regular invoice - Check upcoming regulars and expedites value', async () => {
    const invoice = await steps.invoice.create({
      clientId: client.id,
      brokerId: broker.id,
      expedited: false,
      lineHaulRate: new Big(500000),
    });

    await steps.invoice.verify(invoice.id, {
      status: VerificationStatus.Verified,
    });
    await steps.invoice.purchase(invoice.id);

    const result = await steps.transfers.upcomingRegulars();
    const targetClientAmount = result.clientAmounts.find(
      (clientAmount) => clientAmount.clientId === client.id,
    );
    expect(targetClientAmount).toBeDefined();
    expect(targetClientAmount?.fee.toNumber()).toBe(0);
    expect(targetClientAmount?.invoicesTotal.toNumber()).toBe(477500); // because of the factoring fee
    expect(targetClientAmount?.transferable.toNumber()).toBe(477500);
    expect(targetClientAmount?.reservesTotal.toNumber()).toBe(0);
    expect(result.purchasedInvoicesCount).toBe(1);
    expect(result.reservesCount).toBe(0);
    expect(result.totalAmount.toNumber()).toBe(477500);

    // check for expedites, it should be empty
    const expedites = await steps.transfers.upcomingExpedites();
    expect(expedites.length).toBe(0);
  });

  it('Create a buyout - Check upcoming regulars and expedites to not include the buyouts value', async () => {
    // add buyouts -> not include in the amount transfer
    await steps.buyout.createBatch({
      batch: [
        new CreateBuyoutsRequest({
          clientId: client.id,
          brokerName: broker.id,
          buyoutDate: new Date(),
          loadNumber: 'exptest123',
          mc: '998321',
          rate: new Big(12502),
        }),
      ],
    });

    // check the buyouts before approval
    const buyoutsBeforeApproval = await steps.buyout.getAll();
    expect(buyoutsBeforeApproval.length).toBe(1);
    expect(buyoutsBeforeApproval[0].loadNumber).toBe('exptest123');
    expect(buyoutsBeforeApproval[0].brokerMC).toBe('998321');
    expect(buyoutsBeforeApproval[0].rate.toNumber()).toBe(12502);

    // approved buyouts
    await steps.buyout.bulkPurchase();

    const result = await steps.transfers.upcomingRegulars();
    const targetClientAmount = result.clientAmounts.find(
      (clientAmount) => clientAmount.clientId === client.id,
    );
    expect(targetClientAmount).toBeDefined();
    expect(targetClientAmount?.fee.toNumber()).toBe(0);
    // buyouts are not included, so the value remains the same as before
    expect(targetClientAmount?.invoicesTotal.toNumber()).toBe(477500); // because of the factoring fee
    expect(targetClientAmount?.transferable.toNumber()).toBe(477500);
    expect(targetClientAmount?.reservesTotal.toNumber()).toBe(0);
    expect(result.purchasedInvoicesCount).toBe(1);
    expect(result.reservesCount).toBe(0);
    expect(result.totalAmount.toNumber()).toBe(477500);

    // check for expedites, it should be empty, no buyouts
    const expedites = await steps.transfers.upcomingExpedites();
    expect(expedites.length).toBe(0);

    // check the buyouts after approval
    const buyoutsAfterApproval = await steps.buyout.getAll();
    expect(buyoutsAfterApproval.length).toBe(0);
  });

  it('Create expedited invoice - Check upcoming value - Regulars for the same client should be included in the expedites', async () => {
    jest.useFakeTimers({
      now: getDateInBusinessTimezone().set('hour', 10).toDate(),
    });
    const invoice = await steps.invoice.create({
      clientId: client.id,
      brokerId: broker.id,
      expedited: true,
      lineHaulRate: new Big(300000),
    });

    await steps.invoice.verify(invoice.id, {
      status: VerificationStatus.Verified,
    });
    await steps.invoice.purchase(invoice.id);

    const result = await steps.transfers.upcomingRegulars();
    expect(result.clientAmounts.length).toBe(0);

    // check for expedites, it should countains amount of the 2 invoices
    const expedites = await steps.transfers.upcomingExpedites();
    const targetUpcomingExpedite = expedites.find(
      (clientUpcoming) => clientUpcoming.clientId === client.id,
    );
    expect(targetUpcomingExpedite).toBeDefined();
    expect(targetUpcomingExpedite?.purchasedInvoicesCount).toBe(2);
    expect(targetUpcomingExpedite?.underReviewInvoicesCount).toBe(0);
    expect(targetUpcomingExpedite?.amount.fee.toNumber()).toBe(1800);
    expect(targetUpcomingExpedite?.amount.invoicesTotal.toNumber()).toBe(
      764000,
    ); // because of the factoring fee and reserve fee
    expect(targetUpcomingExpedite?.amount.transferable.toNumber()).toBe(762200);

    // send transfers
    const batchPayment = await steps.transfers.initiateRegular();

    expect(batchPayment).toBeDefined();
    expect(batchPayment!.id).toBeDefined();

    // update transfer status
    const payload = buildStubUpdateTransferStatusWebhookRequest(
      TransferPaymentType.ACH,
    );
    payload.data.externalId = batchPayment!.id;
    await steps.transfers.updateTransferStatus(payload);
  });
});
