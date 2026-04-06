import { PageCriteria } from '@core/data';
import { CreateReserveAccountFundsRequestBuilder } from '@module-reserve-account-funds/test';
import Big from 'big.js';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Fetch reserve account funds', () => {
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

  it('Create reserve account funds - Verify reserve account funds total', async () => {
    await steps.reserveAccountFunds.create(
      clientId,
      CreateReserveAccountFundsRequestBuilder.from({
        amount: new Big(100),
        note: 'note',
      }),
    );

    await steps.reserveAccountFunds.create(
      clientId,
      CreateReserveAccountFundsRequestBuilder.from({
        amount: new Big(450),
        note: 'note',
      }),
    );

    const limit = 10;
    let currentPage = 1;
    let currentTotal = Big(0);
    let isThereANextPage = true;
    while (isThereANextPage) {
      const result = await steps.reserveAccountFunds.getAll(clientId, {
        page: new PageCriteria({ page: currentPage, limit: limit }),
      });
      const reserveAccountFunds = result.items;
      for (let i = 0; i < result.items.length - 1; i++) {
        currentTotal = currentTotal.plus(reserveAccountFunds[i].amount);
      }
      currentPage += 1;
      isThereANextPage = currentPage <= result.pagination.totalPages;
    }
    const total = await steps.reserveAccountFunds.total(clientId);
    expect(currentTotal.eq(total.amount));
  }, 60000);
});
