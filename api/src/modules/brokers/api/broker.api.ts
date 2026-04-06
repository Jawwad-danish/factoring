import { CrossCuttingConcerns } from '@core/util';
import { EntityNotFoundError } from '@core/errors';
import { HttpClient } from '@core/web';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AUTH0_M2M_TOKEN_SERVICE, AuthTokenService } from '../../auth';
import { Broker, LightweightBroker, BrokerContact } from '../data/model';
import { PageResult } from '@core/data';
import { plainToInstance } from 'class-transformer';
import {
  BrokerCreateApiRequest,
  BrokerDocumentResponse,
  BrokerUpdateApiRequest,
} from './data';
import { BrokerApiError } from './broker-api.error';
import {
  CreateBrokerContactRequest,
  BrokerDocumentRequest,
  UpdateBrokerContactRequest,
} from '../data/web';

@Injectable()
export class BrokerApi {
  private readonly logger: Logger = new Logger(BrokerApi.name);
  private readonly httpClient: HttpClient;
  private readonly url: string;

  constructor(
    @Inject(CONFIG_SERVICE) configService: ConfigService,
    @Inject(AUTH0_M2M_TOKEN_SERVICE) authTokenService: AuthTokenService,
  ) {
    this.httpClient = new HttpClient('broker-service', authTokenService);
    const brokerServiceUrl = configService.getValue('BROKER_SERVICE_URL');
    if (!brokerServiceUrl.hasValue()) {
      throw new Error('Could not obtain BROKER_SERVICE_URL config value');
    }
    this.url = brokerServiceUrl.asString();
  }

  async findById(id: string | null): Promise<Broker | null> {
    if (!id) {
      this.logger.log(`Broker API case BrokerNotFound, returning null`);
      return null;
    }
    this.logger.log(`Calling broker service for id ${id}`);
    const result = await this.httpClient.get(`${this.url}/brokers/${id}`, {
      nullOnFail: true,
      response: {
        bodyType: Broker,
      },
    });

    return result === null ? null : (result as Broker);
  }

  async create(request: BrokerCreateApiRequest): Promise<Broker> {
    const result = await this.httpClient.post(`${this.url}/brokers`, {
      request: {
        body: request,
      },
      response: { bodyType: Broker },
    });
    if (result == null) {
      throw new BrokerApiError('create', new Error('Could not create broker'));
    }
    return result;
  }

  async update(
    brokerId: string,
    request: Partial<BrokerUpdateApiRequest>,
  ): Promise<Broker> {
    const result = await this.httpClient.put(
      `${this.url}/brokers/${brokerId}`,
      {
        request: {
          body: request,
        },
        response: { bodyType: Broker },
      },
    );
    if (result == null) {
      throw new BrokerApiError('update', new Error('Could not update broker'));
    }
    return result;
  }

  async findAll(queryParams: string): Promise<PageResult<Broker>> {
    this.logger.log(
      `Calling broker service for findAll with queryParams: ${queryParams}`,
    );
    const result = await this.httpClient.get(
      `${this.url}/brokers?${queryParams}`,
      {
        response: {
          mapper: (data) => plainToInstance(PageResult<Broker>, data),
        },
      },
    );
    return result as PageResult<Broker>;
  }

  async getById(id: null | string): Promise<null | Broker> {
    const broker = await this.findById(id);
    if (broker == null && id != null) {
      throw EntityNotFoundError.byId(id, 'broker');
    }
    return broker;
  }

  async findByIds(ids: string[], batchSize: number = 10): Promise<Broker[]> {
    this.logger.log(`Calling broker service for ids ${ids}`);
    if (ids.length === 0) {
      return [];
    }
    if (ids.length === 1) {
      const result = await this.findById(ids[0]);
      return result !== null ? [result] : [];
    }

    const results: Broker[] = [];

    for (let i = 0; i < ids.length; i += batchSize) {
      const batchIds = ids.slice(i, i + batchSize);
      const queryParams = batchIds.map((id) => `id=${id}`).join('&');

      const batchResult = await this.httpClient.get(
        `${this.url}/brokers/getByIds/id?${queryParams}`,
        {
          response: { bodyType: Broker },
        },
      );

      results.push(...(batchResult as Broker[]));
    }

    return results;
  }

  @CrossCuttingConcerns({
    logging: () => {
      return {
        message: 'Fetching all lightweight brokers from broker service API',
      };
    },
    error: {
      errorSupplier: (cause) =>
        new BrokerApiError('get-all-lightweight-brokers', cause),
    },
    observability: {
      tag: ['broker-api', 'get-all-lightweight-brokers'],
    },
  })
  async getAllBrokers(): Promise<LightweightBroker[]> {
    const result = await this.httpClient.get(
      `${this.url}/brokers/get-all-brokers`,
      {
        response: { bodyType: LightweightBroker },
      },
    );
    return result as LightweightBroker[];
  }

  @CrossCuttingConcerns({
    logging: (key: string) => {
      return {
        message: 'Calling broker service for tag',
        payload: {
          key: key,
        },
      };
    },
  })
  async findByTag(key: string): Promise<Broker[]> {
    const result = await this.httpClient.get(
      `${this.url}/brokers/by-tag/${key}`,
      {
        response: { bodyType: Broker },
      },
    );
    return result as Broker[];
  }

  async createBrokerContact(
    id: string,
    request: CreateBrokerContactRequest,
  ): Promise<BrokerContact> {
    const result = await this.httpClient.post(
      `${this.url}/brokers/${id}/contacts`,
      {
        request: {
          body: request,
        },
        nullOnFail: true,
        response: { mapper: (body) => body.data },
      },
    );
    if (result == null) {
      throw new BrokerApiError(
        'create',
        new Error('Could not create broker contact'),
      );
    }

    return result;
  }

  async updateBrokerContact(
    id: string,
    contactId: string,
    request: UpdateBrokerContactRequest,
  ): Promise<BrokerContact> {
    const result = await this.httpClient.put(
      `${this.url}/brokers/${id}/contacts/${contactId}`,
      {
        request: {
          body: request,
        },
        nullOnFail: true,
        response: { mapper: (body) => body.data },
      },
    );
    if (result == null) {
      throw new BrokerApiError(
        'update',
        new Error('Could not update broker contact'),
      );
    }
    return result;
  }

  async createBrokerDocument(
    id: string,
    request: BrokerDocumentRequest,
  ): Promise<BrokerDocumentResponse> {
    const result = await this.httpClient.post(
      `${this.url}/brokers/${id}/broker-documents`,
      {
        request: {
          body: request,
        },
        nullOnFail: true,
        response: { mapper: (body) => body.data },
      },
    );
    if (result == null) {
      throw new BrokerApiError(
        'create-broker-document',
        new Error('Could not create broker document'),
      );
    }
    return result;
  }

  async updateBrokerDocument(
    id: string,
    documentId: string,
    request: BrokerDocumentRequest,
  ): Promise<BrokerDocumentResponse> {
    const result = await this.httpClient.patch(
      `${this.url}/brokers/${id}/broker-documents/${documentId}`,
      {
        request: {
          body: request,
        },
        nullOnFail: true,
        response: { mapper: (body) => body.data },
      },
    );
    if (result == null) {
      throw new BrokerApiError(
        'update-broker-document',
        new Error('Could not update broker document'),
      );
    }

    return result;
  }

  async deleteBrokerDocument(id: string, documentId: string): Promise<void> {
    await this.httpClient.delete(
      `${this.url}/brokers/${id}/broker-documents/${documentId}`,
    );
  }
}
