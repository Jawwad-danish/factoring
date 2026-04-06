import { mockToken } from '@core/test';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ClientApi } from '@module-clients';
import { RtpSupportService } from '@module-rtp';
import { Test, TestingModule } from '@nestjs/testing';
import {
  buildStubClientBankAccount,
  buildStubPlaidAccount,
} from '../../../../../clients/test';
import { VerifyRtpForClientsQuery } from '../../verify-rtp-for-clients.query';
import { VerifyRtpForClientsQueryHandler } from './verify-rtp-for-clients.query-handler';
import { ClientBankAccountStatus } from '@fs-bobtail/factoring/data';

describe('VerifyRtpForClientsQueryHandler', () => {
  let handler: VerifyRtpForClientsQueryHandler;
  let clientApi: ClientApi;
  let rtpSupportService: DeepMocked<RtpSupportService>;

  beforeEach(async () => {
    rtpSupportService = createMock<RtpSupportService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyRtpForClientsQueryHandler,
        {
          provide: RtpSupportService,
          useValue: rtpSupportService,
        },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get(VerifyRtpForClientsQueryHandler);
    clientApi = module.get(ClientApi);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('returns verified client ids for supported accounts', async () => {
    const clients = ['client-bofa', 'client-modern'];
    jest.spyOn(clientApi, 'getBankAccountsByclientIds').mockResolvedValueOnce([
      {
        clientId: 'client-bofa',
        bankAccounts: [
          buildStubClientBankAccount({
            id: 'bofa-active',
            wireRoutingNumber: 'wire-1',
            modernTreasuryAccount: { externalAccountId: 'ext-1' },
          }),
          buildStubClientBankAccount({
            id: 'bofa-inactive',
            status: ClientBankAccountStatus.Inactive,
            wireRoutingNumber: 'wire-unused',
          }),
        ],
      },
      {
        clientId: 'client-modern',
        bankAccounts: [
          buildStubClientBankAccount({
            id: 'modern-active',
            modernTreasuryAccount: { externalAccountId: 'ext-2' },
          }),
        ],
      },
    ]);

    rtpSupportService.verifyAccounts.mockResolvedValue([
      'bofa-active',
      'modern-active',
    ]);

    const result = await handler.execute(new VerifyRtpForClientsQuery(clients));

    expect(rtpSupportService.verifyAccounts).toHaveBeenCalledWith([
      {
        clientId: 'client-bofa',
        accountId: 'bofa-active',
        routingNumber: undefined,
        wireRoutingNumber: 'wire-1',
        modernTreasuryExternalAccountId: 'ext-1',
      },
      {
        clientId: 'client-modern',
        accountId: 'modern-active',
        routingNumber: undefined,
        wireRoutingNumber: undefined,
        modernTreasuryExternalAccountId: 'ext-2',
      },
    ]);
    expect(result).toEqual(['client-bofa', 'client-modern']);
  });

  it('returns empty array when no clients have eligible accounts', async () => {
    jest.spyOn(clientApi, 'getBankAccountsByclientIds').mockResolvedValueOnce([
      {
        clientId: 'client-without-active',
        bankAccounts: [
          buildStubClientBankAccount({
            status: ClientBankAccountStatus.Inactive,
            wireRoutingNumber: 'wire-inactive',
          }),
          buildStubClientBankAccount({
            status: ClientBankAccountStatus.Inactive,
            modernTreasuryAccount: undefined,
            wireRoutingNumber: undefined,
          }),
        ],
      },
    ]);

    const result = await handler.execute(
      new VerifyRtpForClientsQuery(['client-without-active']),
    );

    expect(result).toEqual([]);
    expect(rtpSupportService.verifyAccounts).not.toHaveBeenCalled();
  });

  it('uses routing number fallback from plaidAccount when wireRoutingNumber is not available', async () => {
    const clients = ['client-plaid-wire', 'client-plaid-routing'];
    const accountWithPlaidWireRoutingNumber = buildStubClientBankAccount({
      id: 'account-plaid-wire',
      modernTreasuryAccount: undefined,
    });
    const accountWithPlaidRoutingNumber = buildStubClientBankAccount({
      id: 'account-plaid-routing',
      modernTreasuryAccount: undefined,
    });

    accountWithPlaidWireRoutingNumber.wireRoutingNumber = undefined;
    accountWithPlaidWireRoutingNumber.plaidAccount = buildStubPlaidAccount({
      wireRoutingNumber: 'plaid-wire-123',
      routingNumber: 'plaid-routing-456',
    });

    accountWithPlaidRoutingNumber.wireRoutingNumber = undefined;
    accountWithPlaidRoutingNumber.plaidAccount = buildStubPlaidAccount({
      wireRoutingNumber: undefined,
      routingNumber: 'plaid-routing-789',
    });

    jest.spyOn(clientApi, 'getBankAccountsByclientIds').mockResolvedValueOnce([
      {
        clientId: 'client-plaid-wire',
        bankAccounts: [accountWithPlaidWireRoutingNumber],
      },
      {
        clientId: 'client-plaid-routing',
        bankAccounts: [accountWithPlaidRoutingNumber],
      },
    ]);

    rtpSupportService.verifyAccounts.mockResolvedValue([
      'account-plaid-wire',
      'account-plaid-routing',
    ]);

    const result = await handler.execute(new VerifyRtpForClientsQuery(clients));

    expect(rtpSupportService.verifyAccounts).toHaveBeenCalledWith([
      expect.objectContaining({
        clientId: 'client-plaid-wire',
        accountId: 'account-plaid-wire',
        routingNumber: 'plaid-routing-456',
        wireRoutingNumber: 'plaid-wire-123',
      }),
      expect.objectContaining({
        clientId: 'client-plaid-routing',
        accountId: 'account-plaid-routing',
        routingNumber: 'plaid-routing-789',
        wireRoutingNumber: undefined,
      }),
    ]);
    expect(result).toEqual(['client-plaid-wire', 'client-plaid-routing']);
  });
});
