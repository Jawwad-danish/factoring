import { mockToken } from '@core/test';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import {
  FEATURE_TOGGLES_SERVICE,
  FeatureTogglesService,
  LDFlags,
} from '@module-feature-toggles';
import { Test, TestingModule } from '@nestjs/testing';
import { TransfersApi } from '../../transfers/api';
import { VerifyRtpSupportAccount } from '../queries/verify-rtp-support.query';
import { RtpSupportService } from './rtp-support.service';

describe('RtpSupportService', () => {
  let service: RtpSupportService;
  let transfersApi: jest.Mocked<TransfersApi>;
  let featureTogglesServiceMock: DeepMocked<FeatureTogglesService>;

  beforeEach(async () => {
    featureTogglesServiceMock = createMock<FeatureTogglesService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RtpSupportService,
        {
          provide: FEATURE_TOGGLES_SERVICE,
          useValue: featureTogglesServiceMock,
        },
      ],
    })
      .useMocker((token) => mockToken(token))
      .compile();

    service = module.get(RtpSupportService);
    transfersApi = module.get(TransfersApi) as jest.Mocked<TransfersApi>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty array when accounts list is empty', async () => {
    const result = await service.verifyAccounts([]);

    expect(result).toEqual([]);
    expect(featureTogglesServiceMock.isEnabledForClient).not.toHaveBeenCalled();
    expect(
      transfersApi.verifyRTPSupportForRoutingNumbers,
    ).not.toHaveBeenCalled();
    expect(transfersApi.verifyRTPSupportForAccounts).not.toHaveBeenCalled();
  });

  it('verifies accounts using both integrations and returns matching account ids', async () => {
    featureTogglesServiceMock.isEnabledForClient.mockImplementation(
      async (clientId) => clientId === 'client-bofa',
    );

    transfersApi.verifyRTPSupportForRoutingNumbers.mockResolvedValue(['rn-1']);
    transfersApi.verifyRTPSupportForAccounts.mockResolvedValue([
      'ext-1',
      'ext-ignored',
    ]);

    const accounts: VerifyRtpSupportAccount[] = [
      {
        clientId: 'client-bofa',
        accountId: 'acct-bofa-1',
        routingNumber: 'rn-1',
      },
      {
        clientId: 'client-bofa',
        accountId: 'acct-bofa-2',
        routingNumber: 'rn-2',
      },
      {
        clientId: 'client-modern',
        accountId: 'acct-modern-1',
        modernTreasuryExternalAccountId: 'ext-1',
      },
      {
        clientId: 'client-modern',
        accountId: 'acct-modern-2',
        modernTreasuryExternalAccountId: 'ext-2',
      },
    ];

    const result = await service.verifyAccounts(accounts);

    expect(featureTogglesServiceMock.isEnabledForClient).toHaveBeenCalledTimes(
      2,
    );
    expect(
      featureTogglesServiceMock.isEnabledForClient,
    ).toHaveBeenNthCalledWith(
      1,
      'client-bofa',
      LDFlags.useBankOfAmericaIntegration,
      false,
    );
    expect(
      featureTogglesServiceMock.isEnabledForClient,
    ).toHaveBeenNthCalledWith(
      2,
      'client-modern',
      LDFlags.useBankOfAmericaIntegration,
      false,
    );
    expect(transfersApi.verifyRTPSupportForRoutingNumbers).toHaveBeenCalledWith(
      expect.arrayContaining(['rn-1', 'rn-2']),
    );
    expect(transfersApi.verifyRTPSupportForAccounts).toHaveBeenCalledWith([
      'ext-1',
      'ext-2',
    ]);
    expect(result).toEqual(['acct-bofa-1', 'acct-modern-1']);
  });

  it('verifies accounts if either routing number or wire routing number is supported', async () => {
    featureTogglesServiceMock.isEnabledForClient.mockImplementation(
      async (clientId) => clientId === 'client-bofa',
    );

    transfersApi.verifyRTPSupportForRoutingNumbers.mockResolvedValue([
      'rn-wire-supported',
      'rn-regular-supported',
    ]);
    transfersApi.verifyRTPSupportForAccounts.mockResolvedValue([]);

    const accounts: VerifyRtpSupportAccount[] = [
      {
        clientId: 'client-bofa',
        accountId: 'acct-wire-supported',
        routingNumber: 'rn-regular-unsupported',
        wireRoutingNumber: 'rn-wire-supported',
      },
      {
        clientId: 'client-bofa',
        accountId: 'acct-regular-supported',
        routingNumber: 'rn-regular-supported',
        wireRoutingNumber: 'rn-wire-unsupported',
      },
      {
        clientId: 'client-bofa',
        accountId: 'acct-none-supported',
        routingNumber: 'rn-unsupported',
        wireRoutingNumber: 'rn-unsupported-2',
      },
    ];

    const result = await service.verifyAccounts(accounts);

    expect(result).toEqual(['acct-wire-supported', 'acct-regular-supported']);
  });

  it('skips verification calls when accounts lack identifiers', async () => {
    featureTogglesServiceMock.isEnabledForClient.mockImplementation(
      async (clientId) => clientId === 'client-bofa',
    );

    const accounts: VerifyRtpSupportAccount[] = [
      {
        clientId: 'client-bofa',
        accountId: 'acct-bofa',
      },
      {
        clientId: 'client-modern',
        accountId: 'acct-modern',
      },
    ];

    const result = await service.verifyAccounts(accounts);

    expect(result).toEqual([]);
    expect(
      transfersApi.verifyRTPSupportForRoutingNumbers,
    ).not.toHaveBeenCalled();
    expect(transfersApi.verifyRTPSupportForAccounts).not.toHaveBeenCalled();
  });
});
