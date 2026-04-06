import { mockToken } from '@core/test';
import { ValidationError } from '@core/validation';
import { ClientBankAccountStatus } from '@fs-bobtail/factoring/data';
import { buildStubBroker } from '@module-brokers/test';
import { ClientService } from '@module-clients';
import {
  buildStubClient,
  buildStubClientBankAccount,
} from '@module-clients/test';
import { PurchaseInvoiceRequest } from '@module-invoices/data';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { RtpSupportService } from '@module-rtp';
import { ClientBankAccountValidator } from './client-bank-account.validator';

describe('Invoice verification status validator', () => {
  let validator: ClientBankAccountValidator;
  let clientService: ClientService;
  let rtpSupportService: RtpSupportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientBankAccountValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validator = module.get(ClientBankAccountValidator);
    clientService = module.get(ClientService);
    rtpSupportService = module.get(RtpSupportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Throws error if client does not have an active bank account', async () => {
    jest
      .spyOn(clientService, 'getPrimaryBankAccount')
      .mockResolvedValueOnce(null);
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new PurchaseInvoiceRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Does not throw error when RTP is supported for the active bank account', async () => {
    const activeBankAccount = buildStubClientBankAccount({
      status: ClientBankAccountStatus.Active,
    });

    jest
      .spyOn(clientService, 'getPrimaryBankAccount')
      .mockResolvedValueOnce(activeBankAccount);

    jest
      .spyOn(rtpSupportService, 'verifyAccounts')
      .mockResolvedValueOnce([activeBankAccount.id]);

    await expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new PurchaseInvoiceRequest(),
      }),
    ).resolves.not.toThrow(ValidationError);
  });

  it('Does not throw error when only wire is supported for the active bank account', async () => {
    const activeBankAccount = buildStubClientBankAccount({
      status: ClientBankAccountStatus.Active,
    });

    jest
      .spyOn(clientService, 'getPrimaryBankAccount')
      .mockResolvedValueOnce(activeBankAccount);

    jest.spyOn(rtpSupportService, 'verifyAccounts').mockResolvedValueOnce([]);

    await expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new PurchaseInvoiceRequest(),
      }),
    ).resolves.not.toThrow(ValidationError);
  });

  it('Throws error when active bank account does not support wire or RTP', async () => {
    const activeBankAccount = buildStubClientBankAccount({
      status: ClientBankAccountStatus.Active,
    });

    // Force wire support to be false
    activeBankAccount.modernTreasuryAccount.confirmedWire = false;
    activeBankAccount.wireRoutingNumber = undefined;
    activeBankAccount.plaidAccount.wireRoutingNumber = undefined;

    jest
      .spyOn(clientService, 'getPrimaryBankAccount')
      .mockResolvedValueOnce(activeBankAccount);

    jest.spyOn(rtpSupportService, 'verifyAccounts').mockResolvedValueOnce([]);

    await expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new PurchaseInvoiceRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });
});
