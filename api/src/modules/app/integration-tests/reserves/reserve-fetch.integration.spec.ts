import { FilterCriteria, FilterOperator, PageCriteria } from '@core/data';
import { CreateReserveRequestBuilder } from '@module-reserves/test';
import Big from 'big.js';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Reserve fetching tests', () => {
  let appManager: IntegrationTestsAppManager;
  let steps: IntegrationTestsSteps;
  let clientId: string;

  beforeAll(async () => {
    appManager = await IntegrationTestsAppManager.init();
    steps = new IntegrationTestsSteps(appManager);
    await new IntegrationTestsDataManager(appManager).setup();
    clientId = appManager.client.id;
  });

  afterAll(async () => {
    if (appManager) {
      await appManager.close();
    }
  });

  it('Create Reserve - Fetch Reserves', async () => {
    const createdReserve = await steps.reserve.create(
      clientId,
      CreateReserveRequestBuilder.clientCredit(100),
    );
    const fetchedReserves = (await steps.reserve.getAll(clientId)).items;

    expect(fetchedReserves.length).toBeGreaterThanOrEqual(1);
    const targetReserve = fetchedReserves.find((r) => {
      return r.id === createdReserve.id;
    });
    expect(targetReserve).toBeDefined();
  }, 60000);

  it('Create Reserves - Fetch by reason', async () => {
    await steps.reserve.create(
      clientId,
      CreateReserveRequestBuilder.clientCredit(100),
    );
    await steps.reserve.create(
      clientId,
      CreateReserveRequestBuilder.clientCredit(100),
    );
    const reserves = await steps.reserve.getAll(clientId, {
      filters: [
        new FilterCriteria({
          name: 'reason',
          operator: FilterOperator.EQ,
          value: 'adjustment',
        }),
      ],
    });

    expect(reserves.items.length).toBeGreaterThanOrEqual(2);
  }, 60000);

  it('Create Reserves - Fetch Reserves - Total adds up', async () => {
    await steps.reserve.create(
      clientId,
      CreateReserveRequestBuilder.clientCredit(100),
    );
    await steps.reserve.create(
      clientId,
      CreateReserveRequestBuilder.clientCredit(100),
    );
    await steps.reserve.create(
      clientId,
      CreateReserveRequestBuilder.clientCredit(100),
    );
    const total = await steps.reserve.total(clientId);
    const limit = 10;
    let currentPage = 1;

    let currentTotal = Big(0);
    let isThereANextPage = true;
    while (isThereANextPage) {
      const result = await steps.reserve.getAll(clientId, {
        page: new PageCriteria({ page: currentPage, limit: limit }),
      });
      const reserves = result.items;
      for (let i = 0; i < result.items.length - 1; i++) {
        const reserve = reserves[i];
        currentTotal = currentTotal.plus(reserve.amount);
        expect(reserve.total.gt(reserve.total));
      }
      currentPage += 1;
      isThereANextPage = currentPage <= result.pagination.totalPages;
    }
    expect(currentTotal.eq(total.amount));
  }, 60000);

  it('Create Reserve - Fetch Reserve by id', async () => {
    const createdReserve = await steps.reserve.create(
      clientId,
      CreateReserveRequestBuilder.clientCredit(100),
    );
    const fetchedReserves = await steps.reserve.getOne(
      clientId,
      createdReserve.id,
    );

    expect(fetchedReserves.id).toBe(createdReserve.id);
    expect(fetchedReserves.amount.toNumber()).toBe(
      createdReserve.amount.toNumber(),
    );
    expect(fetchedReserves.clientId).toBe(createdReserve.clientId);
    expect(fetchedReserves.reason).toBe(createdReserve.reason);
  }, 60000);
});
