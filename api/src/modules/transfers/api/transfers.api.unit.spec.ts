import { createMock } from '@golevelup/ts-jest';
import { FeatureFlagResolver } from '@module-common';
import { Test, TestingModule } from '@nestjs/testing';
import { TransfersApi } from './transfers.api';
import { BofaTransferRequest, BofaWireTransferRequest } from './models';
import { TransferType } from './models/transfer-type';
import { TransfersApiError } from './transfers-api.error';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { AUTH0_M2M_TOKEN_SERVICE, AuthTokenService } from '@module-auth';

const mockHttpPost = jest.fn().mockResolvedValue({});
const mockHttpGet = jest.fn().mockResolvedValue({});

jest.mock('@core/web', () => ({
  HttpClient: jest.fn().mockImplementation(() => ({
    post: mockHttpPost,
    get: mockHttpGet,
  })),
}));

const TRANSFERS_SERVICE_URL = 'http://transfers-service';

const buildBofaTransferRequest = (
  overrides?: Partial<BofaTransferRequest>,
): BofaTransferRequest => ({
  batchPaymentId: 'batch-1',
  transferType: TransferType.Expedite,
  payments: [
    {
      amount: 1000,
      creditorName: 'Test',
      creditorPostalAddress: {
        addressLine: ['123 Main St'],
        city: 'City',
      },
      creditorAccountNumber: '987654321',
      creditorRoutingNumber: '123456789',
    },
  ],
  ...overrides,
});

const buildBofaWireTransferRequest = (
  overrides?: Partial<BofaWireTransferRequest>,
): BofaWireTransferRequest => ({
  ...buildBofaTransferRequest(),
  transferType: TransferType.Wire,
  ...overrides,
});

const buildBofaPaymentWithAmount = (amount: number) => [
  {
    amount,
    creditorName: 'Test',
    creditorPostalAddress: {
      addressLine: ['123 Main St'],
      city: 'City',
    },
    creditorAccountNumber: '123',
    creditorRoutingNumber: '456',
  },
];

describe('TransfersApi', () => {
  let transfersApi: TransfersApi;
  let featureFlagResolver: FeatureFlagResolver;

  const configService = createMock<ConfigService>({
    getValue: jest.fn().mockReturnValue({
      hasValue: () => true,
      asString: () => TRANSFERS_SERVICE_URL,
    }),
  });

  const authTokenService = createMock<AuthTokenService>();

  beforeEach(async () => {
    featureFlagResolver = createMock<FeatureFlagResolver>({
      isEnabled: jest.fn().mockReturnValue(true),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransfersApi,
        { provide: CONFIG_SERVICE, useValue: configService },
        { provide: AUTH0_M2M_TOKEN_SERVICE, useValue: authTokenService },
        { provide: FeatureFlagResolver, useValue: featureFlagResolver },
      ],
    }).compile();

    transfersApi = module.get(TransfersApi);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBankOfAmericaExpediteOnApiEnabled', () => {
    it('should return null when feature flag is disabled', async () => {
      (featureFlagResolver.isEnabled as jest.Mock).mockReturnValue(false);

      const result = await transfersApi.createBankOfAmericaExpediteOnApiEnabled(
        'key-1',
        buildBofaTransferRequest(),
      );

      expect(result).toBeNull();
      expect(mockHttpPost).not.toHaveBeenCalled();
    });

    it('should delegate to createBankOfAmericaExpedite when feature flag is enabled', async () => {
      const dto = buildBofaTransferRequest();
      mockHttpPost.mockResolvedValueOnce({ id: 'bofa-expedite-1' });

      const spy = jest.spyOn(transfersApi, 'createBankOfAmericaExpedite');
      await transfersApi.createBankOfAmericaExpediteOnApiEnabled('key-1', dto);

      expect(spy).toHaveBeenCalledWith('key-1', dto);
    });
  });

  describe('createBankOfAmericaExpedite', () => {
    it('should throw when a payment has zero amount', async () => {
      await expect(
        transfersApi.createBankOfAmericaExpedite(
          'key-1',
          buildBofaTransferRequest({
            payments: buildBofaPaymentWithAmount(0),
          }),
        ),
      ).rejects.toThrow(TransfersApiError);
    });

    it('should throw when a payment has negative amount', async () => {
      await expect(
        transfersApi.createBankOfAmericaExpedite(
          'key-1',
          buildBofaTransferRequest({
            payments: buildBofaPaymentWithAmount(-100),
          }),
        ),
      ).rejects.toThrow(TransfersApiError);
    });

    it('should call httpClient.post with correct v2 expedite url', async () => {
      const dto = buildBofaTransferRequest();
      const responseData = { id: 'bofa-expedite-1' };
      mockHttpPost.mockResolvedValueOnce(responseData);

      const result = await transfersApi.createBankOfAmericaExpedite(
        'key-1',
        dto,
      );

      expect(mockHttpPost).toHaveBeenCalledWith(
        `${TRANSFERS_SERVICE_URL}/v2/transfers/expedite`,
        expect.objectContaining({
          request: expect.objectContaining({
            body: dto,
            headers: { 'Idempotency-Key': 'key-1' },
          }),
          response: expect.objectContaining({
            mapper: expect.any(Function),
          }),
        }),
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('createBankOfAmericaWire', () => {
    it('should throw when a payment has zero amount', async () => {
      await expect(
        transfersApi.createBankOfAmericaWire(
          'key-1',
          buildBofaWireTransferRequest({
            payments: buildBofaPaymentWithAmount(0),
          }),
        ),
      ).rejects.toThrow(TransfersApiError);
    });

    it('should throw when a payment has negative amount', async () => {
      await expect(
        transfersApi.createBankOfAmericaWire(
          'key-1',
          buildBofaWireTransferRequest({
            payments: buildBofaPaymentWithAmount(-100),
          }),
        ),
      ).rejects.toThrow(TransfersApiError);
    });

    it('should call httpClient.post with correct v2 wire url', async () => {
      const dto = buildBofaWireTransferRequest();
      mockHttpPost.mockResolvedValueOnce({ id: 'wire-1' });

      const result = await transfersApi.createBankOfAmericaWire('key-1', dto);

      expect(mockHttpPost).toHaveBeenCalledWith(
        `${TRANSFERS_SERVICE_URL}/v2/transfers/wire`,
        expect.objectContaining({
          request: expect.objectContaining({
            body: dto,
            headers: { 'Idempotency-Key': 'key-1' },
          }),
          response: expect.objectContaining({
            mapper: expect.any(Function),
          }),
        }),
      );
      expect(result).toEqual({ id: 'wire-1' });
    });
  });
});
