import { ReserveReason, TagDefinitionKey } from '@module-persistence/entities';
import { CreateReserveRequestBuilder } from '@module-reserves/test';
import Big from 'big.js';
import { expectTagKeyNotOnInvoice, expectTagKeyOnInvoice } from '../expects';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Invoice revert tests', () => {
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

  it('Create Invoice - Purchase - Revert', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
    });
    await steps.invoice.verify(createdInvoice.id);
    await steps.invoice.purchase(createdInvoice.id);
    await steps.invoice.revert(createdInvoice.id);

    const reserves = (await steps.reserve.getAll(clientId)).items;

    expect(reserves.length).toBeGreaterThanOrEqual(2);
    const targetReserve = reserves.find((r) => {
      return r.reason === ReserveReason.ReserveFeeRemoved;
    });

    expect(targetReserve).toBeDefined();
  }, 60000);

  it('Create Invoice with deduction - Purchase - Revert', async () => {
    const deduction = new Big(500);
    const total = await steps.reserve.total(clientId);
    if (deduction.gt(total.amount)) {
      await steps.reserve.create(
        clientId,
        CreateReserveRequestBuilder.fee(deduction),
      );
    }

    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
    });
    await steps.invoice.verify(createdInvoice.id);
    await steps.invoice.purchase(createdInvoice.id, {
      deduction: new Big(500),
    });
    await steps.invoice.revert(createdInvoice.id);

    const reserves = (await steps.reserve.getAll(clientId)).items;

    expect(reserves.length).toBeGreaterThanOrEqual(2);
    const targetReserve = reserves.find((r) => {
      return r.reason === ReserveReason.ChargebackRemoved;
    });

    expect(targetReserve).toBeDefined();
  }, 60000);

  it('Create Invoice with possible duplicate tags - Purchase - Tag gets removed - Revert - Tag gets added back', async () => {
    const deduction = new Big(500);
    const total = await steps.reserve.total(clientId);
    if (deduction.gt(total.amount)) {
      await steps.reserve.create(
        clientId,
        CreateReserveRequestBuilder.fee(deduction),
      );
    }

    const firstInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
    });
    const secondInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
      loadNumber: firstInvoice.loadNumber,
    });

    expectTagKeyOnInvoice(
      TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
      secondInvoice,
    );

    await steps.invoice.verify(secondInvoice.id);
    const purchasedInvoice = await steps.invoice.purchase(secondInvoice.id, {
      deduction,
    });

    expectTagKeyNotOnInvoice(
      TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
      purchasedInvoice,
    );

    const revertedInvoice = await steps.invoice.revert(secondInvoice.id);

    expectTagKeyOnInvoice(
      TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
      revertedInvoice,
    );
  }, 60000);
});
