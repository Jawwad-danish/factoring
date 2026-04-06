import { BrokerPaymentStatus } from '@module-persistence/entities';
import Big from 'big.js';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Invoice delete broker payments', () => {
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

  it('Create Invoice - Verify Invoice - Purchase Invoice - Pay Invoice - Short pay - Short pay - Delete - Shortpay invoice', async () => {
    const { id } = await steps.invoice.create({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
      lumper: new Big(0),
      detention: new Big(0),
      advance: new Big(0),
    });
    await steps.invoice.verify(id);
    await steps.invoice.purchase(id);
    await steps.invoice.sendPayment(id);
    await steps.brokerPayment.create({
      invoiceId: id,
      amount: new Big(500),
    });
    const lastBrokerPayment = await steps.brokerPayment.create({
      invoiceId: id,
      amount: new Big(500),
    });
    const beforeDeleteInvoice = await steps.invoice.getOne(id);
    expect(beforeDeleteInvoice.brokerPaymentStatus).toBe(
      BrokerPaymentStatus.InFull,
    );

    await steps.brokerPayment.delete(lastBrokerPayment.id);
    const afterDeleteInvoice = await steps.invoice.getOne(id);

    expect(afterDeleteInvoice.brokerPaymentStatus).toBe(
      BrokerPaymentStatus.ShortPaid,
    );
  });
});
