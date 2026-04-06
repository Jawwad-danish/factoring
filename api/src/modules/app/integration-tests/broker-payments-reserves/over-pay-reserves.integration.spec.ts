import Big from 'big.js';
import { expectBigEquality } from '../expects';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Overpay invoice broker payments reserves', () => {
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

  it('Create Invoice - Verify Invoice - Purchase Invoice - Pay Invoice - Shortpay - Check reserves - Overpay - Check reserves', async () => {
    const initialTotal = (await steps.reserve.total(clientId)).amount;
    const createdInvoice = await steps.invoice.createAndSendPayment({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
    });
    await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(100),
    });

    const firstTotal = await steps.reserve.total(clientId);
    expectBigEquality(
      firstTotal.amount,
      initialTotal.plus(-900).plus(createdInvoice.reserveFee),
    );

    await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(1100),
    });

    const secondTotal = await steps.reserve.total(clientId);
    expectBigEquality(
      secondTotal.amount,
      initialTotal.plus(200).plus(createdInvoice.reserveFee),
    );
  });

  it('Create Invoice - Verify Invoice - Purchase Invoice - Pay Invoice - Overpay - Check reserves - Overpay - Check reserves', async () => {
    const initialTotal = (await steps.reserve.total(clientId)).amount;
    const createdInvoice = await steps.invoice.createAndSendPayment({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
    });
    await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(1500),
    });

    const firstTotal = await steps.reserve.total(clientId);
    expectBigEquality(
      firstTotal.amount,
      initialTotal.plus(500).plus(createdInvoice.reserveFee),
    );

    await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(1000),
    });

    const secondTotal = await steps.reserve.total(clientId);
    expectBigEquality(
      secondTotal.amount,
      initialTotal.plus(1500).plus(createdInvoice.reserveFee),
    );
  });

  it('Create Invoice - Verify Invoice - Purchase Invoice - Pay Invoice - Overpay - Check reserves - Delete broker payment - Check reserves', async () => {
    const createdInvoice = await steps.invoice.createAndSendPayment({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
    });

    const initialReservesTotal = await steps.reserve.total(clientId);
    const brokerPayment = await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(1500),
    });

    const firstTotal = await steps.reserve.total(clientId);
    expectBigEquality(firstTotal.amount, initialReservesTotal.amount.plus(500));

    await steps.brokerPayment.delete(brokerPayment.id);
    const secondTotal = await steps.reserve.total(clientId);
    expectBigEquality(secondTotal.amount, initialReservesTotal.amount);
  });

  // https://bobtail.atlassian.net/browse/IC-3219
  it('Create Invoice - Verify Invoice - Purchase Invoice - Pay Invoice - Overpay - Check reserves - Delete broker payment - Overpay - Check reserves -  Delete broker payment - Overpay - Check reserves', async () => {
    const createdInvoice = await steps.invoice.createAndSendPayment({
      clientId,
      brokerId,
      lineHaulRate: new Big(5000),
    });

    const initialReservesTotal = await steps.reserve.total(clientId);

    const firstBrokerPayment = await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(10000),
    });
    const afterFirstBrokerPaymentReservesTotal = await steps.reserve.total(
      clientId,
    );
    expectBigEquality(
      afterFirstBrokerPaymentReservesTotal.amount,
      initialReservesTotal.amount.plus(5000),
    );
    await steps.brokerPayment.delete(firstBrokerPayment.id);

    const secondBrokerPayment = await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(10000),
    });
    const afterSecondBrokerPaymentReservesTotal = await steps.reserve.total(
      clientId,
    );
    expectBigEquality(
      afterSecondBrokerPaymentReservesTotal.amount,
      initialReservesTotal.amount.plus(5000),
    );
    await steps.brokerPayment.delete(secondBrokerPayment.id);

    await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(10000),
    });
    const afterThirdBrokerPaymentReservesTotal = await steps.reserve.total(
      clientId,
    );
    expectBigEquality(
      afterThirdBrokerPaymentReservesTotal.amount,
      initialReservesTotal.amount.plus(5000),
    );
  });
});
