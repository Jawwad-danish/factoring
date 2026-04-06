import { Broker } from '@module-brokers/data';
import { ITAppManager } from '../setup/it-app-manager';
import { CreateBuyoutsRequest } from '@fs-bobtail/factoring/data';
import { Client } from '@module-clients/data';
import { VerificationStatus } from '@module-persistence/entities';
import { CreateReserveRequestBuilder } from '@module-reserves/test';
import Big from 'big.js';
import { TransferPaymentType } from '../../../transfers/data';
import { buildStubUpdateTransferStatusWebhookRequest } from '../../../transfers/test';
import { IntegrationTestsSteps } from '../steps';

describe('Upcoming regular transfers tests', () => {
  let appManager: ITAppManager;
  let steps: IntegrationTestsSteps;

  let firstClient: Client;
  let secondClient: Client;
  let broker: Broker;

  beforeAll(async () => {
    appManager = await ITAppManager.init();
    steps = new IntegrationTestsSteps(appManager);
    firstClient = await appManager.data.createClient({
      factoringConfig: {
        factoringRatePercentage: new Big(0.4),
        reserveRatePercentage: new Big(1),
      },
    });
    broker = appManager.data.createBroker();
    secondClient = await appManager.data.createClient();
  });

  afterAll(async () => {
    if (appManager) {
      await appManager.close();
    }
  });

  it('Create Invoices & reserves - Verify Invoices - Purchase invoices - Verify upcoming regular', async () => {
    const invoice = await steps.invoice.create({
      clientId: firstClient.id,
      brokerId: broker.id,
      expedited: false,
      lineHaulRate: new Big(100000),
    });

    const releaseOfFundsAmount = 100;
    const reserveTotal = await steps.reserve.total(firstClient.id);
    if (reserveTotal.amount.lt(releaseOfFundsAmount)) {
      await steps.reserve.create(
        firstClient.id,
        CreateReserveRequestBuilder.clientCredit(releaseOfFundsAmount * 2),
      );
    }
    await steps.reserve.create(
      firstClient.id,
      CreateReserveRequestBuilder.releaseOfFunds(releaseOfFundsAmount),
    );
    await steps.invoice.verify(invoice.id, {
      status: VerificationStatus.Verified,
    });
    await steps.invoice.purchase(invoice.id);

    const result = await steps.transfers.upcomingRegulars();
    const targetClientAmount = result.clientAmounts.find(
      (clientAmount) => clientAmount.clientId === firstClient.id,
    );
    expect(targetClientAmount).toBeDefined();
    expect(targetClientAmount?.fee.toNumber()).toBe(0);
    expect(targetClientAmount?.invoicesTotal.toNumber()).toBe(98600); // because of the factoring fee and reserve fee
    expect(targetClientAmount?.transferable.toNumber()).toBe(98700);
    expect(targetClientAmount?.reservesTotal.toNumber()).toBe(100);
    expect(result.transferTime).toBeDefined();
    expect(new Date(result.transferTime)).toBeInstanceOf(Date);
    expect(new Date(result.transferTime) > new Date()).toBeTruthy();
  }, 60000);

  it('Create Reserves - no invoices - Verify upcoming regular to include just the reserves', async () => {
    // initiate the above regular to release the invoice amount transfer
    const batchPayment = await steps.transfers.initiateRegular();

    // update transfer status
    const payload = buildStubUpdateTransferStatusWebhookRequest(
      TransferPaymentType.ACH,
    );
    payload.data.externalId = batchPayment!.id;
    await steps.transfers.updateTransferStatus(payload);

    const releaseOfFundsAmount = 450;
    const reserveTotal = await steps.reserve.total(firstClient.id);
    if (reserveTotal.amount.lt(releaseOfFundsAmount)) {
      await steps.reserve.create(
        firstClient.id,
        CreateReserveRequestBuilder.clientCredit(releaseOfFundsAmount * 2),
      );
    }
    await steps.reserve.create(
      firstClient.id,
      CreateReserveRequestBuilder.releaseOfFunds(releaseOfFundsAmount),
    );

    const result = await steps.transfers.upcomingRegulars();
    const targetClientAmount = result.clientAmounts.find(
      (clientAmount) => clientAmount.clientId === firstClient.id,
    );
    expect(targetClientAmount).toBeDefined();
    expect(targetClientAmount?.fee.toNumber()).toBe(0);
    expect(targetClientAmount?.invoicesTotal.toNumber()).toBe(0);
    expect(targetClientAmount?.transferable.toNumber()).toBe(450);
    expect(targetClientAmount?.reservesTotal.toNumber()).toBe(450);
    expect(result.transferTime).toBeDefined();
    expect(new Date(result.transferTime)).toBeInstanceOf(Date);
    expect(new Date(result.transferTime) > new Date()).toBeTruthy();
  }, 60000);

  it(`Create Invoice and reserves - One reserves belongs to the client's Invoice one doesn't - Initiate regular for invoice and both reserves`, async () => {
    // initiate the above regular to release the invoice amount transfer
    const firstBatchPayment = await steps.transfers.initiateRegular();

    // update transfer status
    const firstPayload = buildStubUpdateTransferStatusWebhookRequest(
      TransferPaymentType.ACH,
    );
    firstPayload.data.externalId = firstBatchPayment!.id;
    await steps.transfers.updateTransferStatus(firstPayload);

    const invoice = await steps.invoice.create({
      clientId: firstClient.id,
      brokerId: broker.id,
      expedited: false,
      lineHaulRate: new Big(800000),
    });

    // first release of funds that belongs to the client's invoice
    const releaseOfFundsAmount1 = 200;
    const reserveTotal1 = await steps.reserve.total(firstClient.id);
    if (reserveTotal1.amount.lt(releaseOfFundsAmount1)) {
      await steps.reserve.create(
        firstClient.id,
        CreateReserveRequestBuilder.clientCredit(releaseOfFundsAmount1 * 2),
      );
    }
    await steps.reserve.create(
      firstClient.id,
      CreateReserveRequestBuilder.releaseOfFunds(releaseOfFundsAmount1),
    );
    await steps.invoice.verify(invoice.id, {
      status: VerificationStatus.Verified,
    });
    await steps.invoice.purchase(invoice.id);

    // second release of funds that does not belong to the client
    const releaseOfFundsAmount = 450;
    const reserveTotal = await steps.reserve.total(secondClient.id);
    if (reserveTotal.amount.lt(releaseOfFundsAmount)) {
      await steps.reserve.create(
        secondClient.id,
        CreateReserveRequestBuilder.clientCredit(releaseOfFundsAmount * 2),
      );
    }
    await steps.reserve.create(
      secondClient.id,
      CreateReserveRequestBuilder.releaseOfFunds(releaseOfFundsAmount),
    );

    const result = await steps.transfers.upcomingRegulars();
    expect(result.clientAmounts.length).toBe(2);
    expect(result.reservesCount).toBe(2);
    expect(result.purchasedInvoicesCount).toBe(1);

    // check on both client amounts
    const firstClientAmount = result.clientAmounts.find(
      (clientAmount) => clientAmount.clientId === firstClient.id,
    );
    expect(firstClientAmount).toBeDefined();
    expect(firstClientAmount?.fee.toNumber()).toBe(0);
    expect(firstClientAmount?.invoicesTotal.toNumber()).toBe(788800);
    expect(firstClientAmount?.transferable.toNumber()).toBe(789000);
    expect(firstClientAmount?.reservesTotal.toNumber()).toBe(200);

    const secondClientAmount = result.clientAmounts.find(
      (clientAmount) => clientAmount.clientId === secondClient.id,
    );
    expect(secondClientAmount).toBeDefined();
    expect(secondClientAmount?.fee.toNumber()).toBe(0);
    expect(secondClientAmount?.invoicesTotal.toNumber()).toBe(0);
    expect(secondClientAmount?.transferable.toNumber()).toBe(450);
    expect(secondClientAmount?.reservesTotal.toNumber()).toBe(450);

    // initiate the above regular to release the invoice amount transfer
    const batchPayment = await steps.transfers.initiateRegular();

    expect(batchPayment).toBeDefined();
    expect(batchPayment!.id).toBeDefined();

    // update transfer status
    const payload = buildStubUpdateTransferStatusWebhookRequest(
      TransferPaymentType.ACH,
    );
    payload.data.externalId = batchPayment!.id;
    await steps.transfers.updateTransferStatus(payload);
  }, 60000);

  it(`Create buyout invoice - Get upcoming regular transfer - Buyout invoice should not be included in the regular transfer`, async () => {
    await steps.buyout.createBatch({
      batch: [
        new CreateBuyoutsRequest({
          clientId: firstClient.id,
          brokerName: broker.legalName,
          buyoutDate: new Date(),
          loadNumber: 'l0100test',
          mc: broker.mc,
          rate: new Big(20021),
        }),
      ],
    });

    await steps.buyout.bulkPurchase();

    const result = await steps.transfers.upcomingRegulars();
    expect(result.clientAmounts.length).toBe(0);
    expect(result.reservesCount).toBe(0);
    expect(result.purchasedInvoicesCount).toBe(0);
    expect(result.transferTime).toBeDefined();
  });
});
