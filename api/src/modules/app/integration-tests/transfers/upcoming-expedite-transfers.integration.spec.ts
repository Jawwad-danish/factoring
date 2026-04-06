import { Broker } from '@module-brokers/data';
import { Client } from '@module-clients/data';
import { VerificationStatus } from '@module-persistence/entities';
import Big from 'big.js';
import { ITAppManager } from '../setup/it-app-manager';
import { IntegrationTestsSteps } from '../steps';

describe('Upcoming expedite transfers tests', () => {
  let appManager: ITAppManager;
  let steps: IntegrationTestsSteps;
  let client: Client;
  let broker: Broker;

  beforeAll(async () => {
    appManager = await ITAppManager.init();
    steps = new IntegrationTestsSteps(appManager);
    client = await appManager.data.createClient({
      factoringConfig: {
        factoringRatePercentage: new Big(3),
        reserveRatePercentage: new Big(2),
      },
    });
    broker = appManager.data.createBroker();
  });

  afterAll(async () => {
    if (appManager) {
      await appManager.close();
    }
  });

  it('Create Invoices - Verify Invoices - Purchase invoices - Verify upcoming expedited', async () => {
    await steps.invoice.create({
      clientId: client.id,
      brokerId: broker.id,
      lineHaulRate: new Big(40000),
    });
    const invoice = await steps.invoice.create({
      clientId: client.id,
      brokerId: broker.id,
      expedited: true,
      lineHaulRate: new Big(30000),
    });
    await steps.invoice.verify(invoice.id, {
      status: VerificationStatus.Verified,
    });
    await steps.invoice.purchase(invoice.id);
    const result = await steps.transfers.upcomingExpedites();

    const targetUpcomingExpedite = result.find(
      (clientUpcoming) => clientUpcoming.clientId === client.id,
    );

    expect(targetUpcomingExpedite).toBeDefined();
    expect(targetUpcomingExpedite?.purchasedInvoicesCount).toBe(1);
    expect(targetUpcomingExpedite?.underReviewInvoicesCount).toBe(1);
    expect(targetUpcomingExpedite?.amount.fee.toNumber()).toBe(1800);
    expect(targetUpcomingExpedite?.amount.invoicesTotal.toNumber()).toBe(28500); // because of the factoring fee and reserve fee
    expect(targetUpcomingExpedite?.amount.transferable.toNumber()).toBe(26700);
  }, 60000);
});
