import Big from 'big.js';
import { expectBigEquality } from '../expects';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';
import { BrokerPaymentStatus } from '@module-persistence/entities';

describe('Shortpaid invoice broker payments reserves', () => {
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

  it('Create Invoice - Verify Invoice - Purchase Invoice - Pay Invoice - Shortpay - Check reserves - Shortpay - Check reserves', async () => {
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
      Big(-900).plus(createdInvoice.reserveFee),
    );

    await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(200),
    });

    const secondTotal = await steps.reserve.total(clientId);
    expectBigEquality(
      secondTotal.amount,
      Big(-700).plus(createdInvoice.reserveFee),
    );

    await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(500),
    });

    const thirdTotal = await steps.reserve.total(clientId);
    expectBigEquality(
      thirdTotal.amount,
      Big(-200).plus(createdInvoice.reserveFee),
    );

    const invoice = await steps.invoice.getOne(createdInvoice.id);
    expect(invoice.brokerPaymentStatus).toBe(BrokerPaymentStatus.ShortPaid);
  });

  it('Create Invoice - Verify Invoice - Purchase Invoice - Pay Invoice - Shortpay - Check reserves - Shortpay - Check reserves - Delete Broker Payment - Check reserves', async () => {
    const createdInvoice = await steps.invoice.createAndSendPayment({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
    });

    const initialReservesTotal = await steps.reserve.total(clientId);
    await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(100),
    });
    expectBigEquality(
      (await steps.reserve.total(clientId)).amount,
      initialReservesTotal.amount.minus(900),
    );

    const brokerPayment = await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(100),
    });
    expectBigEquality(
      (await steps.reserve.total(clientId)).amount,
      initialReservesTotal.amount.minus(800),
    );

    await steps.brokerPayment.delete(brokerPayment.id);
    const finalReserveTotal = await steps.reserve.total(clientId);
    expectBigEquality(
      finalReserveTotal.amount,
      initialReservesTotal.amount.minus(900),
    );
  });

  it('Create Invoice - Verify Invoice - Purchase Invoice - Pay Invoice - Shortpay - Check reserves - Delete Broker Payment - Check reserves', async () => {
    const createdInvoice = await steps.invoice.createAndSendPayment({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
    });

    const initialReservesTotal = await steps.reserve.total(clientId);
    const brokerPayment = await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(100),
    });

    const afterBrokerPaymentReserveTotal = await steps.reserve.total(clientId);
    expectBigEquality(
      afterBrokerPaymentReserveTotal.amount,
      Big(-900).plus(initialReservesTotal.amount),
    );

    await steps.brokerPayment.delete(brokerPayment.id);

    const finalReserveTotal = await steps.reserve.total(clientId);
    expectBigEquality(finalReserveTotal.amount, initialReservesTotal.amount);

    const invoice = await steps.invoice.getOne(createdInvoice.id);
    expect(invoice.brokerPaymentStatus).toBe(BrokerPaymentStatus.NotReceived);
  });

  it('Create Invoice - Verify Invoice - Purchase Invoice - Pay Invoice - Shortpay - Check reserves - Delete Broker Payment - Check reserves - Shortpay - Check reserves', async () => {
    const createdInvoice = await steps.invoice.createAndSendPayment({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
    });

    const initialReservesTotal = await steps.reserve.total(clientId);
    const brokerPayment = await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(100),
    });

    const afterBrokerPaymentReserveTotal = await steps.reserve.total(clientId);
    expectBigEquality(
      afterBrokerPaymentReserveTotal.amount,
      Big(-900).plus(initialReservesTotal.amount),
    );

    await steps.brokerPayment.delete(brokerPayment.id);

    const finalReserveTotal = await steps.reserve.total(clientId);
    expectBigEquality(finalReserveTotal.amount, initialReservesTotal.amount);

    await steps.brokerPayment.create({
      invoiceId: createdInvoice.id,
      amount: new Big(100),
    });

    const afterSecondBrokerPaymentReserveTotal = await steps.reserve.total(
      clientId,
    );
    expectBigEquality(
      afterSecondBrokerPaymentReserveTotal.amount,
      Big(-900).plus(initialReservesTotal.amount),
    );

    const invoice = await steps.invoice.getOne(createdInvoice.id);
    expect(invoice.brokerPaymentStatus).toBe(BrokerPaymentStatus.ShortPaid);
  });
});
