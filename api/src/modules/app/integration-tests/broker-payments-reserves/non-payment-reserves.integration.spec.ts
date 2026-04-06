import Big from 'big.js';
import { expectBigEquality } from '../expects';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Non payment invoice broker payments reserves', () => {
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

  it('Create Invoice - Verify Invoice - Purchase Invoice - Pay Invoice - Non payment - Check reserves - Overpay - Check reserves', async () => {
    const initialTotal = (await steps.reserve.total(clientId)).amount;
    const createdInvoice = await steps.invoice.createAndSendPayment({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
    });
    await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(0),
    });

    const firstTotal = await steps.reserve.total(clientId);
    expectBigEquality(
      firstTotal.amount,
      initialTotal.plus(-1000).plus(createdInvoice.reserveFee),
    );

    await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(1500),
    });

    const secondTotal = await steps.reserve.total(clientId);
    expectBigEquality(
      secondTotal.amount,
      initialTotal.plus(500).plus(createdInvoice.reserveFee),
    );
  });

  it('Create Invoice - Verify Invoice - Purchase Invoice - Pay Invoice - Non payment - Check reserves - Shortpay - Check reserves', async () => {
    const initialTotal = (await steps.reserve.total(clientId)).amount;
    const createdInvoice = await steps.invoice.createAndSendPayment({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
    });
    await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(0),
    });

    const firstTotal = await steps.reserve.total(clientId);
    expectBigEquality(
      firstTotal.amount,
      initialTotal.plus(-1000).plus(createdInvoice.reserveFee),
    );

    await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(500),
    });

    const secondTotal = await steps.reserve.total(clientId);
    expectBigEquality(
      secondTotal.amount,
      initialTotal.plus(-500).plus(createdInvoice.reserveFee),
    );
  });

  it('Create Invoice - Verify Invoice - Purchase Invoice - Pay Invoice - Non payment - Check reserves - In Full - Check reserves', async () => {
    const initialTotal = (await steps.reserve.total(clientId)).amount;
    const createdInvoice = await steps.invoice.createAndSendPayment({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
    });
    await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(0),
    });

    const firstTotal = await steps.reserve.total(clientId);
    expectBigEquality(
      firstTotal.amount,
      initialTotal.plus(-1000).plus(createdInvoice.reserveFee),
    );

    await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(1000),
    });

    const secondTotal = await steps.reserve.total(clientId);
    expectBigEquality(
      secondTotal.amount,
      initialTotal.plus(createdInvoice.reserveFee),
    );
  });

  it('Create Invoice - Verify Invoice - Purchase Invoice - Pay Invoice - Non payment - Check reserves - Delete broker payment - Check reserves', async () => {
    const createdInvoice = await steps.invoice.createAndSendPayment({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
    });

    const initialReservesTotal = await steps.reserve.total(clientId);
    const brokerPayment = await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(0),
    });

    const afterNonPaymentReserveTotal = await steps.reserve.total(clientId);
    expectBigEquality(
      afterNonPaymentReserveTotal.amount,
      initialReservesTotal.amount.minus(1000),
    );

    await steps.brokerPayment.delete(brokerPayment.id);
    const currentReservesTotal = await steps.reserve.total(clientId);
    expectBigEquality(initialReservesTotal.amount, currentReservesTotal.amount);
  });
});
