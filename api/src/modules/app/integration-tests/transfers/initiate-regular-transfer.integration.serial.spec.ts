import { FilterCriteria, FilterOperator } from '@core/data';
import { getDateInBusinessTimezone } from '@core/date-time';
import {
  ClientBatchPaymentStatus,
  ClientPaymentStatus,
  VerificationStatus,
} from '@module-persistence/entities';
import { CreateReserveRequestBuilder } from '@module-reserves/test';
import Big from 'big.js';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';
import { buildStubUpdateTransferStatusWebhookRequest } from '../../../transfers/test';
import { TransferPaymentType } from '../../../transfers/data';
import { HttpStatus } from '@nestjs/common';

// This test needs to run in series because a regular transfer affects other clients

describe('Regular transfer integration tests', () => {
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

  beforeEach(() => {
    jest.useRealTimers();
  });

  afterAll(async () => {
    if (appManager) {
      await appManager.close();
    }
  });

  it('Create Invoices - Verify Invoices - Purchase invoices - Initiate regular transfer', async () => {
    const date = getDateInBusinessTimezone()
      .set('hour', 13)
      .startOf('hour')
      .toDate();
    jest.useFakeTimers({ now: date });

    const regularInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      expedited: false,
      lineHaulRate: new Big(100000),
    });
    await steps.invoice.verify(regularInvoice.id, {
      status: VerificationStatus.Verified,
    });
    await steps.invoice.purchase(regularInvoice.id);

    const expediteInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      expedited: true,
      lineHaulRate: new Big(100000),
    });
    await steps.invoice.verify(expediteInvoice.id, {
      status: VerificationStatus.Verified,
    });
    await steps.invoice.purchase(expediteInvoice.id);

    const batchPayment = await steps.transfers.initiateRegular();

    const invoices = await steps.invoice.getAll({
      filters: [
        new FilterCriteria({
          name: 'clientId',
          operator: FilterOperator.EQ,
          value: clientId,
        }),
        new FilterCriteria({
          name: 'clientPaymentStatus',
          operator: FilterOperator.EQ,
          value: ClientPaymentStatus.InProgress,
        }),
      ],
    });

    expect(
      invoices.find((invoice) => invoice.id === expediteInvoice.id),
    ).toBeUndefined();

    expect(invoices.length).toBe(1);
    for (const invoice of invoices) {
      expect(invoice.expedited).toBe(false);
      expect(invoice.clientPaymentStatus).toBe(ClientPaymentStatus.InProgress);

      // update transfer status
      const payload = buildStubUpdateTransferStatusWebhookRequest(
        TransferPaymentType.ACH,
      );
      payload.data.externalId = batchPayment!.id;
      await steps.transfers.updateTransferStatus(payload);
    }
  }, 60000);

  it('Create Invoices - Verify Invoices - Purchase invoices - Initiate regular transfer - Expedited invoices are included if inside the last transfer window', async () => {
    jest.useFakeTimers({
      now: getDateInBusinessTimezone().set('hour', 10).toDate(),
    });
    const regularInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      expedited: false,
      lineHaulRate: new Big(100000),
    });
    await steps.invoice.verify(regularInvoice.id, {
      status: VerificationStatus.Verified,
    });
    await steps.invoice.purchase(regularInvoice.id);

    const expediteInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      expedited: true,
      lineHaulRate: new Big(100000),
    });
    await steps.invoice.verify(expediteInvoice.id, {
      status: VerificationStatus.Verified,
    });
    // purchase it before the wire override window converts the invoice to a regular one
    await steps.invoice.purchase(expediteInvoice.id);

    // initiate transfer during the last transfer window of the day
    jest.useFakeTimers({
      now: getDateInBusinessTimezone().set('hour', 19).startOf('hour').toDate(),
    });
    const batchPayment = await steps.transfers.initiateRegular();

    const invoices = await steps.invoice.getAll({
      filters: [
        new FilterCriteria({
          name: 'clientId',
          operator: FilterOperator.EQ,
          value: clientId,
        }),
        new FilterCriteria({
          name: 'clientPaymentStatus',
          operator: FilterOperator.EQ,
          value: ClientPaymentStatus.InProgress,
        }),
      ],
    });

    const expeditedInvoiceAfterTransfer = invoices.find(
      (invoice) => invoice.id === expediteInvoice.id,
    );
    expect(expeditedInvoiceAfterTransfer).toBeDefined();
    expect(expeditedInvoiceAfterTransfer?.expedited).toBe(false);

    expect(invoices.length).toBeGreaterThanOrEqual(2);
    for (const invoice of invoices) {
      expect(invoice.expedited).toBe(false);
      expect(invoice.clientPaymentStatus).toBe(ClientPaymentStatus.InProgress);
    }

    // update transfer status
    const payload = buildStubUpdateTransferStatusWebhookRequest(
      TransferPaymentType.ACH,
    );
    payload.data.externalId = batchPayment!.id;
    await steps.transfers.updateTransferStatus(payload);
  }, 60000);

  it('Create Invoices - Verify Invoices - Purchase invoices - Initiate regular transfer - Handle reserves when initiate the regular', async () => {
    const date = getDateInBusinessTimezone()
      .set('hour', 13)
      .startOf('hour')
      .toDate();
    jest.useFakeTimers({ now: date });

    const regularInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      expedited: false,
      lineHaulRate: new Big(30200),
    });

    await steps.invoice.verify(regularInvoice.id, {
      status: VerificationStatus.Verified,
    });
    await steps.invoice.purchase(regularInvoice.id);

    // create a reserve for the regular transfer
    const releaseOfFundsAmount = 80;
    const reserve = await steps.reserve.create(
      clientId,
      CreateReserveRequestBuilder.releaseOfFunds(releaseOfFundsAmount),
    );

    const batchPayment = await steps.transfers.initiateRegular();

    const invoices = await steps.invoice.getAll({
      filters: [
        new FilterCriteria({
          name: 'clientId',
          operator: FilterOperator.EQ,
          value: clientId,
        }),
        new FilterCriteria({
          name: 'clientPaymentStatus',
          operator: FilterOperator.EQ,
          value: ClientPaymentStatus.InProgress,
        }),
      ],
    });

    expect(invoices.length).toBe(1);
    for (const invoice of invoices) {
      expect(invoice.expedited).toBe(false);
      expect(invoice.clientPaymentStatus).toBe(ClientPaymentStatus.InProgress);
    }

    const reserveAfterTransfer = await steps.reserve.getOne(
      clientId,
      reserve.id,
    );
    expect(reserveAfterTransfer.clientPaymentIds?.length).toBe(1);
    const clientPayments = await steps.clientPayments.getOne(
      clientId,
      reserveAfterTransfer.clientPaymentIds![0],
    );
    expect(clientPayments).toBeDefined();
    expect(clientPayments.reservePayments[0].reserve?.id).toBe(reserve.id);
    expect(clientPayments.reservePayments[0].reserve?.amount).toBe(
      `${-releaseOfFundsAmount}`,
    );

    // update transfer status
    const payload = buildStubUpdateTransferStatusWebhookRequest(
      TransferPaymentType.ACH,
    );
    payload.data.externalId = batchPayment!.id;
    await steps.transfers.updateTransferStatus(payload);
  }, 60000);

  it(`Create reserve - No invoices - Initiate regular transfer - Reserve is applied to the regular transfer`, async () => {
    const date = getDateInBusinessTimezone()
      .set('hour', 13)
      .startOf('hour')
      .toDate();
    jest.useFakeTimers({ now: date });

    // create a reserve for the regular transfer. we will initiate just this
    const releaseOfFundsAmount = 200;
    const reserve = await steps.reserve.create(
      clientId,
      CreateReserveRequestBuilder.releaseOfFunds(releaseOfFundsAmount),
    );

    const batchPayment = await steps.transfers.initiateRegular();

    // update transfer status
    const payload = buildStubUpdateTransferStatusWebhookRequest(
      TransferPaymentType.ACH,
    );
    payload.data.externalId = batchPayment!.id;
    await steps.transfers.updateTransferStatus(payload);

    const reserveAfterTransfer = await steps.reserve.getOne(
      clientId,
      reserve.id,
    );
    expect(reserveAfterTransfer.clientPaymentIds?.length).toBe(1);
    const clientPayments = await steps.clientPayments.getOne(
      clientId,
      reserveAfterTransfer.clientPaymentIds![0],
    );
    expect(clientPayments).toBeDefined();
    expect(clientPayments.reservePayments.length).toBe(1);
    expect(clientPayments.reservePayments[0].reserve?.id).toBe(reserve.id);
    expect(clientPayments.reservePayments[0].reserve?.amount).toBe(
      `${-releaseOfFundsAmount}`,
    );
  });

  it('Should throw error when another regular transfer is in progress', async () => {
    const date = getDateInBusinessTimezone()
      .set('hour', 13)
      .startOf('hour')
      .toDate();
    jest.useFakeTimers({ now: date });

    const invoice1 = await steps.invoice.create({
      clientId,
      brokerId,
      expedited: false,
      lineHaulRate: new Big(100000),
    });
    await steps.invoice.verify(invoice1.id, {
      status: VerificationStatus.Verified,
    });
    await steps.invoice.purchase(invoice1.id);

    const invoice2 = await steps.invoice.create({
      clientId,
      brokerId,
      expedited: false,
      lineHaulRate: new Big(100000),
    });
    await steps.invoice.verify(invoice2.id, {
      status: VerificationStatus.Verified,
    });
    await steps.invoice.purchase(invoice2.id);

    const firstBatchPayment = await steps.transfers.initiateRegular();
    const secondBatchPayment = await steps.transfers.initiateRegular(
      undefined,
      HttpStatus.BAD_REQUEST,
    );

    expect(firstBatchPayment).not.toBeNull();
    expect(firstBatchPayment!.status).toBe(ClientBatchPaymentStatus.InProgress);

    expect(secondBatchPayment).toBeNull();

    const payload = buildStubUpdateTransferStatusWebhookRequest(
      TransferPaymentType.ACH,
    );
    payload.data.externalId = firstBatchPayment!.id;
    await steps.transfers.updateTransferStatus(payload);
  }, 60000);
});
