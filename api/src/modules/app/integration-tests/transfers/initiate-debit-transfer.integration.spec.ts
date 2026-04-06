import { UUID } from '@core/uuid';
import { Client } from '@module-clients';
import { InitiateDebitRegularTransferRequest } from '@module-transfers/data';
import { HttpStatus } from '@nestjs/common';
import assert from 'assert';
import Big from 'big.js';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Debit regular transfer integration tests', () => {
  let appManager: IntegrationTestsAppManager;
  let steps: IntegrationTestsSteps;
  let client: Client;

  beforeAll(async () => {
    appManager = await IntegrationTestsAppManager.init();
    steps = new IntegrationTestsSteps(appManager);
    await new IntegrationTestsDataManager(appManager).setup();
    client = appManager.client;
  });

  afterAll(async () => {
    if (appManager) {
      await appManager.close();
    }
  });

  it('Debit regular transfer happy path', async () => {
    expect(client.bankAccounts).toBeDefined();
    expect(client.bankAccounts?.length).toBeGreaterThan(0);
    expect(client.bankAccounts![0].id).toBeDefined();
    const payload = new InitiateDebitRegularTransferRequest({
      clientId: client.id,
      amount: Big(2000),
      bankAccountId: client.bankAccounts![0].id,
    });
    const batchPayment = await steps.transfers.initiateDebitRegular(payload);

    assert(batchPayment !== null);
    expect(batchPayment.clientPayments.length).toBe(1);
    expect(batchPayment.clientPayments[0].amount).toStrictEqual(Big(2000));
  }, 60000);

  it('Invalid bank account', async () => {
    expect(client.bankAccounts).toBeDefined();
    expect(client.bankAccounts?.length).toBeGreaterThan(0);
    expect(client.bankAccounts![0].id).toBeDefined();
    const payload = new InitiateDebitRegularTransferRequest({
      clientId: client.id,
      amount: Big(2000),
      bankAccountId: UUID.get(),
    });
    const batchPayment = await steps.transfers.initiateDebitRegular(
      payload,
      HttpStatus.BAD_REQUEST,
    );

    expect(batchPayment).toBeNull();
  }, 60000);
});
