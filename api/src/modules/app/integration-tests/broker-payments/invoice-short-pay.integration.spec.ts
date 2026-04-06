import { BrokerPaymentStatus } from '@module-persistence/entities';
import Big from 'big.js';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Shortpaid invoice broker payments', () => {
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

  it('Create Invoice - Verify Invoice - Purchase Invoice - Pay Invoice - Shortpay - Shortpaid invoice', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId,
    });
    await steps.invoice.verify(createdInvoice.id);
    await steps.invoice.purchase(createdInvoice.id);
    await steps.invoice.sendPayment(createdInvoice.id);
    await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: createdInvoice.accountsReceivableValue.minus(1),
    });
    const invoice = await steps.invoice.getOne(createdInvoice.id);
    expect(invoice.brokerPaymentStatus).toBe(BrokerPaymentStatus.ShortPaid);
  });

  it('Create Invoice - Verify Invoice - Purchase Invoice - Pay Invoice - Shortpay - Shortpay - Shortpaid invoice', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
      lumper: new Big(0),
      detention: new Big(0),
      advance: new Big(0),
    });
    await steps.invoice.verify(createdInvoice.id);
    await steps.invoice.purchase(createdInvoice.id);
    await steps.invoice.sendPayment(createdInvoice.id);
    await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(100),
    });
    await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(100),
    });
    const invoice = await steps.invoice.getOne(createdInvoice.id);
    expect(invoice.brokerPaymentStatus).toBe(BrokerPaymentStatus.ShortPaid);
  });
});
