import { BrokerPaymentStatus } from '@module-persistence/entities';
import Big from 'big.js';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('In full invoice broker payments', () => {
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

  it('Create Invoice - Verify Invoice - Purchase Invoice - Pay Invoice - Overpay - Overpay invoice', async () => {
    const { id } = await steps.invoice.create({
      clientId,
      brokerId,
    });
    await steps.invoice.verify(id);
    await steps.invoice.purchase(id);
    await steps.invoice.sendPayment(id);
    const { accountsReceivableValue } = await steps.invoice.getOne(id);
    await steps.brokerPayment.create({
      invoiceId: id,
      amount: accountsReceivableValue.plus(10),
    });
    const invoice = await steps.invoice.getOne(id);
    expect(invoice.brokerPaymentStatus).toBe(BrokerPaymentStatus.Overpaid);
  });

  it('Create Invoice - Verify Invoice - Purchase Invoice - Pay Invoice - Shortpay - Shortpay - Overpay invoice', async () => {
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
    await steps.brokerPayment.create({
      invoiceId: id,
      amount: new Big(600),
    });
    const invoice = await steps.invoice.getOne(id);
    expect(invoice.brokerPaymentStatus).toBe(BrokerPaymentStatus.Overpaid);
  });
});
