import { BrokerPaymentStatus } from '@module-persistence/entities';
import Big from 'big.js';
import { expectBigEquality } from '../expects';
import { ITAppManager } from '../setup/it-app-manager';
import { IntegrationTestsSteps } from '../steps';

describe('Full paid invoice broker payments reserves', () => {
  let appManager: ITAppManager;
  let steps: IntegrationTestsSteps;
  let brokerId: string;
  let clientId: string;

  beforeAll(async () => {
    appManager = await ITAppManager.init();
    steps = new IntegrationTestsSteps(appManager);
    const client = await appManager.data.createClient({
      factoringConfig: {
        factoringRatePercentage: new Big(3.25),
        reserveRatePercentage: new Big(0),
      },
    });
    const broker = appManager.data.createBroker();
    brokerId = broker.id;
    clientId = client.id;
  });

  afterAll(async () => {
    if (appManager) {
      await appManager.close();
    }
  });

  it('Create Invoice - Verify Invoice - Purchase Invoice - Pay Invoice - Full pay - Check reserves - Delete pay - Check reserves', async () => {
    const createdInvoice = await steps.invoice.createAndSendPayment({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
    });
    const brokerPayment = await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(1000),
    });

    const firstTotal = await steps.reserve.total(clientId);
    expectBigEquality(firstTotal.amount, 0);

    await steps.brokerPayment.delete(brokerPayment.id);
    const finalReserveTotal = await steps.reserve.total(clientId);
    expectBigEquality(finalReserveTotal.amount, 0);

    const invoice = await steps.invoice.getOne(createdInvoice.id);
    expect(invoice.brokerPaymentStatus).toBe(BrokerPaymentStatus.NotReceived);
  });
});
