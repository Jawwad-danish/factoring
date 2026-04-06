import { getDateInBusinessTimezone } from '@core/date-time';
import { CreateBuyoutsRequest } from '@fs-bobtail/factoring/data';
import {
  ClientPaymentStatus,
  InvoiceStatus,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { CreateReserveRequestBuilder } from '@module-reserves/test';
import Big from 'big.js';
import { expectBigEquality } from '../expects';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';
import { Client } from '@module-clients/data';

describe('Invoice purchase tests', () => {
  let appManager: IntegrationTestsAppManager;
  let steps: IntegrationTestsSteps;
  let brokerId: string;
  let client: Client;

  beforeAll(async () => {
    appManager = await IntegrationTestsAppManager.init();
    steps = new IntegrationTestsSteps(appManager);
    await new IntegrationTestsDataManager(appManager).setup();
    brokerId = appManager.broker.id;
    client = appManager.client;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(async () => {
    if (appManager) {
      await appManager.close();
    }
  });

  it('Create Invoice - Purchase (no deduction)', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId: client.id,
      brokerId,
      lineHaulRate: new Big(10000),
    });
    await steps.invoice.verify(createdInvoice.id);
    const purchasedInvoice = await steps.invoice.purchase(createdInvoice.id);

    expect(purchasedInvoice.value).toStrictEqual(new Big(10000));
  }, 60000);

  it('Create Invoice - Purchase (with deduction)', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId: client.id,
      brokerId,
      lineHaulRate: new Big(10000),
    });
    await steps.invoice.verify(createdInvoice.id);

    // Reserve ledger needs to be negative to apply deduction on purchase
    await steps.reserve.create(client.id, CreateReserveRequestBuilder.fee(500));

    const purchasedInvoice = await steps.invoice.purchase(createdInvoice.id, {
      deduction: new Big(100),
    });

    expect(purchasedInvoice.value).toStrictEqual(new Big(10000));
  }, 60000);

  it('Create Invoice - Purchase - Reserve fee is calculated', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId: client.id,
      brokerId,
      lineHaulRate: new Big(1000),
    });

    await steps.invoice.verify(createdInvoice.id);
    const purchasedInvoice = await steps.invoice.purchase(createdInvoice.id);

    expectBigEquality(purchasedInvoice.reserveRatePercentage, new Big(1));
    expectBigEquality(purchasedInvoice.reserveFee, new Big(10));
  }, 60000);

  it('Create Invoice - Purchase - invoice is converted to regular if inside expedite override window', async () => {
    const date = getDateInBusinessTimezone().set('hour', 18).toDate();
    jest.useFakeTimers({ now: date });
    const createdInvoice = await steps.invoice.create({
      clientId: client.id,
      brokerId,
      expedited: true,
      lineHaulRate: new Big(10000),
    });

    await steps.invoice.verify(createdInvoice.id);
    const purchasedInvoice = await steps.invoice.purchase(createdInvoice.id);

    expect(purchasedInvoice.expedited).toBe(false);
  }, 60000);

  it('Create Buyout Invoice - Purchase - Client payment status is completed', async () => {
    await steps.buyout.createBatch({
      batch: [
        new CreateBuyoutsRequest({
          clientId: client.id,
          brokerName: '',
          buyoutDate: new Date(),
          loadNumber: 'l01',
          mc: 'mc',
          rate: new Big(100),
        }),
      ],
    });
    const buyoutId = (await steps.buyout.getAll())[0].id;
    const createdInvoice = await steps.invoice.create(
      {
        clientId: client.id,
        brokerId,
        lineHaulRate: new Big(10000),
        buyoutId,
      },
      {
        status: InvoiceStatus.Purchased,
      },
    );
    expect(createdInvoice.clientPaymentStatus).toStrictEqual(
      ClientPaymentStatus.Completed,
    );
  }, 60000);

  describe('Invoice tags auto-removal', () => {
    it('Tag is removed on purchase', async () => {
      const createdInvoice = await steps.invoice.create({
        clientId: client.id,
        brokerId,
        lineHaulRate: new Big(10000),
      });
      await steps.invoice.assignTag(createdInvoice.id, {
        key: TagDefinitionKey.OTHER_INVOICE_ISSUE,
      });

      await steps.invoice.verify(createdInvoice.id);
      await steps.invoice.purchase(createdInvoice.id);
      const updatedInvoice = await steps.invoice.getOne(createdInvoice.id);
      expect(updatedInvoice.tags).toHaveLength(0);
    }, 60000);

    it('Ignored tag is not removed on purchase', async () => {
      const createdInvoice = await steps.invoice.create({
        clientId: client.id,
        brokerId,
        lineHaulRate: new Big(10000),
      });
      await steps.invoice.assignTag(createdInvoice.id, {
        key: TagDefinitionKey.BROKER_NOT_FOUND,
      });

      await steps.invoice.verify(createdInvoice.id);
      await steps.invoice.purchase(createdInvoice.id);
      const updatedInvoice = await steps.invoice.getOne(createdInvoice.id);
      expect(updatedInvoice.tags).toHaveLength(1);
    }, 60000);
  });
});
