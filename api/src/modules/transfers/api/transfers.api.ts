import { CrossCuttingConcerns } from '@core/util';
import { ValidationError } from '@core/validation';
import { HttpClient } from '@core/web';
import { AUTH0_M2M_TOKEN_SERVICE, AuthTokenService } from '@module-auth';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { Inject, Injectable, Logger } from '@nestjs/common';
import Big from 'big.js';
import {
  ACHBatchTransferDto,
  AchBatchTransferResponseV1,
  BofaTransferRequest,
  BofaWireTransferRequest,
  BatchTransferResponseV1,
  BatchTransferResponseV2,
  BatchTransferResponseV1List,
  ExpediteTransferDto,
  PlaidTransferDto,
  PlaidTransferResponse,
  RtpBatchTransferDto,
} from './models';
import { TransfersApiError } from './transfers-api.error';
import {
  QueryCriteria,
  serializeQueryCriteriaForTransfersService,
} from '@core/data';

@Injectable()
export class TransfersApi {
  private readonly logger: Logger = new Logger(TransfersApi.name);
  private readonly httpClient: HttpClient;
  private readonly url: string;

  constructor(
    @Inject(CONFIG_SERVICE) configService: ConfigService,
    @Inject(AUTH0_M2M_TOKEN_SERVICE) authTokenService: AuthTokenService,
    private readonly featureFlagResolver: FeatureFlagResolver,
  ) {
    this.httpClient = new HttpClient('transfers-service', authTokenService);
    this.logger.log('Creating http client for transfers service');
    const transfersServiceUrl = configService.getValue('TRANSFERS_SERVICE_URL');
    if (!transfersServiceUrl.hasValue()) {
      throw new Error(`Could not obtain TRANSFERS_SERVICE_URL config value`);
    }
    this.url = transfersServiceUrl.asString();
  }

  private shouldCallTransfersApi(): boolean {
    return this.featureFlagResolver.isEnabled(FeatureFlag.UseTransfersApi);
  }

  private getIdempotencyKeyHeader(key: string): {
    'Idempotency-Key': string;
  } {
    return { 'Idempotency-Key': key };
  }

  @CrossCuttingConcerns({
    logging: () => {
      return {
        message: 'Creating a Plaid ACH transfer',
      };
    },
    error: {
      errorSupplier: (cause) =>
        new TransfersApiError('create-plaid-ach', cause),
    },
    observability: {
      tag: ['transfers-api', 'create-plaid-ach'],
    },
  })
  async createPlaidAchTransfer(
    idempotencyKey: string,
    transfer: PlaidTransferDto,
  ): Promise<PlaidTransferResponse | null> {
    if (!this.shouldCallTransfersApi()) {
      return null;
    }
    if (new Big(transfer.amount).lte(0)) {
      throw new ValidationError(
        'validate-ach',
        'Cannot initiate an plaid ach transfer with negative amounts',
      );
    }
    const result = await this.httpClient.post(
      `${this.url}/v1/transfers/plaid/ach`,
      {
        request: {
          body: transfer,
          headers: {
            ...this.getIdempotencyKeyHeader(idempotencyKey),
          },
        },
        response: {},
      },
    );
    return result as PlaidTransferResponse;
  }

  @CrossCuttingConcerns({
    logging: (idempotencyKey: string, batch: ACHBatchTransferDto) => {
      return {
        message: 'Creating an ACH Batch',
        payload: {
          idempotencyKey,
          batch,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new TransfersApiError('create-ach', cause),
    },
    observability: {
      tag: ['transfers-api', 'create-ach-batch'],
    },
  })
  async createAchBatch(
    idempotencyKey: string,
    batch: ACHBatchTransferDto,
  ): Promise<AchBatchTransferResponseV1 | null> {
    if (!this.shouldCallTransfersApi()) {
      this.logger.debug('Skipping call to transfer API for ACH transfer', {
        idempotencyKey,
        batchPaymentId: batch.batchPaymentId,
      });
      return null;
    }
    for (const payment of batch.payments) {
      if (new Big(payment.amount).lte(0)) {
        throw new ValidationError(
          'validate-ach',
          'Cannot initiate an ACH transfer with negative amounts',
        );
      }
    }
    const result = await this.httpClient.post(`${this.url}/v1/transfers/ach`, {
      request: {
        body: batch,
        headers: {
          ...this.getIdempotencyKeyHeader(idempotencyKey),
        },
      },
      response: {},
    });
    return result as AchBatchTransferResponseV1;
  }

  @CrossCuttingConcerns({
    logging: () => {
      return {
        message: 'Creating an expedite transfer',
      };
    },
    error: {
      errorSupplier: (cause) => new TransfersApiError('create-expedite', cause),
    },
    observability: {
      tag: ['transfers-api', 'create-expedite'],
    },
  })
  async createModernTreasuryExpedite(
    idempotencyKey: string,
    batch: ExpediteTransferDto,
  ): Promise<BatchTransferResponseV1 | null> {
    if (!this.shouldCallTransfersApi()) {
      this.logger.debug('Skipping call to transfer API for expedite transfer', {
        idempotencyKey,
        batchPaymentId: batch.batchPaymentId,
      });
      return null;
    }
    for (const payment of batch.payments) {
      if (new Big(payment.amount).lte(0)) {
        throw new ValidationError(
          'validate-expedite',
          'Cannot initiate an expedite transfer with negative amounts',
        );
      }
    }
    const result = await this.httpClient.post(
      `${this.url}/v1/transfers/expedite`,
      {
        request: {
          body: batch,
          headers: {
            ...this.getIdempotencyKeyHeader(idempotencyKey),
          },
        },
        response: {},
      },
    );
    return result as BatchTransferResponseV1;
  }

  async createBankOfAmericaExpediteOnApiEnabled(
    idempotencyKey: string,
    batch: BofaTransferRequest,
  ): Promise<BatchTransferResponseV2 | null> {
    if (!this.shouldCallTransfersApi()) {
      this.logger.debug('Skipping call to transfer API for expedite transfer', {
        idempotencyKey,
        batchPaymentId: batch.batchPaymentId,
      });
      return null;
    }

    return this.createBankOfAmericaExpedite(idempotencyKey, batch);
  }

  @CrossCuttingConcerns({
    logging: () => {
      return {
        message: 'Creating an expedite transfer',
      };
    },
    error: {
      errorSupplier: (cause) => new TransfersApiError('create-expedite', cause),
    },
    observability: {
      tag: ['transfers-api', 'create-expedite'],
    },
  })
  async createBankOfAmericaExpedite(
    idempotencyKey: string,
    batch: BofaTransferRequest,
  ): Promise<BatchTransferResponseV2> {
    for (const payment of batch.payments) {
      if (new Big(payment.amount).lte(0)) {
        throw new ValidationError(
          'validate-expedite',
          'Cannot initiate an expedite transfer with negative amounts',
        );
      }
    }
    const result = await this.httpClient.post(
      `${this.url}/v2/transfers/expedite`,
      {
        request: {
          body: batch,
          headers: {
            ...this.getIdempotencyKeyHeader(idempotencyKey),
          },
        },
        response: { mapper: (body) => body.data },
      },
    );
    return result as BatchTransferResponseV2;
  }

  @CrossCuttingConcerns({
    logging: () => {
      return {
        message: 'Creating an Ach transfer',
      };
    },
    error: {
      errorSupplier: (cause) => new TransfersApiError('create-ach', cause),
    },
    observability: {
      tag: ['transfers-api', 'create-ach'],
    },
  })
  async createBankOfAmericaAch(
    idempotencyKey: string,
    batch: BofaTransferRequest,
  ): Promise<BatchTransferResponseV2> {
    for (const payment of batch.payments) {
      if (new Big(payment.amount).lte(0)) {
        throw new ValidationError(
          'validate-ach',
          'Cannot initiate an Ach transfer with negative amounts',
        );
      }
    }
    const result = await this.httpClient.post(`${this.url}/v2/transfers/ach`, {
      request: {
        body: batch,
        headers: {
          ...this.getIdempotencyKeyHeader(idempotencyKey),
        },
      },
      response: { mapper: (body) => body.data },
    });
    return result as BatchTransferResponseV2;
  }

  @CrossCuttingConcerns({
    logging: () => {
      return {
        message: 'Creating a wire transfer',
      };
    },
    error: {
      errorSupplier: (cause) => new TransfersApiError('create-wire', cause),
    },
    observability: {
      tag: ['transfers-api', 'create-wire'],
    },
  })
  async createBankOfAmericaWire(
    idempotencyKey: string,
    batch: BofaWireTransferRequest,
  ): Promise<BatchTransferResponseV2> {
    for (const payment of batch.payments) {
      if (new Big(payment.amount).lte(0)) {
        throw new ValidationError(
          'validate-wire',
          'Cannot initiate a wire transfer with negative amounts',
        );
      }
    }
    const result = await this.httpClient.post(`${this.url}/v2/transfers/wire`, {
      request: {
        body: batch,
        headers: {
          ...this.getIdempotencyKeyHeader(idempotencyKey),
        },
      },
      response: { mapper: (body) => body.data },
    });
    return result as BatchTransferResponseV2;
  }

  @CrossCuttingConcerns({
    logging: () => {
      return {
        message: 'Creating a RTP batch transfer',
      };
    },
    error: {
      errorSupplier: (cause) =>
        new TransfersApiError('create-rtp-transfer', cause),
    },
    observability: {
      tag: ['transfers-api', 'create-rtp-transfer'],
    },
  })
  async createRTPTransfer(
    idempotencyKey: string,
    batch: RtpBatchTransferDto,
  ): Promise<BatchTransferResponseV1 | null> {
    if (!this.shouldCallTransfersApi()) {
      return null;
    }
    const result = await this.httpClient.post(`${this.url}/v1/transfers/rtp`, {
      request: {
        body: batch,
        headers: {
          ...this.getIdempotencyKeyHeader(idempotencyKey),
        },
      },
      response: {},
    });
    return result as BatchTransferResponseV1;
  }

  @CrossCuttingConcerns({
    logging: () => {
      return {
        message: 'Fetching an expedite transfer',
      };
    },
    error: {
      errorSupplier: (cause) => new TransfersApiError('fetch-expedite', cause),
    },
    observability: {
      tag: ['transfers-api', 'fetch-expedite'],
    },
  })
  async getExpediteTransferById(
    id: string,
    includeAuditTrails: boolean,
  ): Promise<BatchTransferResponseV1 | null> {
    if (!this.shouldCallTransfersApi()) {
      return null;
    }
    const queryParams = new URLSearchParams({
      includeAuditTrails: String(includeAuditTrails),
    });

    const result = await this.httpClient.get(
      `${this.url}/v1/transfers/expedite/${id}`,
      {
        request: {
          queryParams,
        },
        response: {},
      },
    );
    return result as BatchTransferResponseV1;
  }

  @CrossCuttingConcerns({
    logging: () => {
      return {
        message: 'Verifying RTP support',
      };
    },
    error: {
      errorSupplier: (cause) =>
        new TransfersApiError('fetch-rtp-support', cause),
    },
    observability: {
      tag: ['transfers-api', 'fetch-rtp-support'],
    },
  })
  async verifyRTPSupportForAccounts(
    accountIds: string[],
  ): Promise<string[] | null> {
    const result = await this.httpClient.get(
      `${this.url}/v1/transfers/verify-rtp`,
      {
        request: {
          body: accountIds,
        },
        response: { mapper: (data) => data },
      },
    );
    return result as string[];
  }

  async verifyRTPSupportForRoutingNumbers(
    routingNumbers: string[],
  ): Promise<string[] | null> {
    const result = await this.httpClient.get(
      `${this.url}/v2/transfers/verify-rtp`,
      {
        request: {
          body: routingNumbers,
        },
        response: { mapper: (data) => data },
      },
    );
    return result as string[];
  }

  @CrossCuttingConcerns({
    logging: () => {
      return {
        message: 'List expedite transfers',
      };
    },
    error: {
      errorSupplier: (cause) => new TransfersApiError('list-expedite', cause),
    },
    observability: {
      tag: ['transfers-api', 'list-expedite'],
    },
  })
  async listTransfers(
    criteria: QueryCriteria,
  ): Promise<BatchTransferResponseV1List> {
    const serializedQueryParams =
      serializeQueryCriteriaForTransfersService(criteria);
    const urlSearchParams = new URLSearchParams(serializedQueryParams);

    const result = await this.httpClient.get(`${this.url}/v1/transfers/list`, {
      response: { mapper: (data) => data },
      request: {
        queryParams: urlSearchParams,
      },
    });
    return result as BatchTransferResponseV1List;
  }
}
