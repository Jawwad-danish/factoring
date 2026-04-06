import { PageResult, QueryCriteria, serializeQueryCriteria } from '@core/data';
import { EntityNotFoundError } from '@core/errors';
import { CrossCuttingConcerns } from '@core/util';
import { HttpClient } from '@core/web';
import {
  ClientBankAccount,
  ClientBankAccountMap,
  ProductName,
} from '@fs-bobtail/factoring/data';
import { AUTH0_M2M_TOKEN_SERVICE, AuthTokenService } from '@module-auth';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { QueryParams } from '@sentry/types';
import { plainToInstance } from 'class-transformer';
import {
  Client,
  ClientDocument,
  LightweightClient,
  UpdateClientDocumenRequest,
} from '../data';
import { ClientApiError } from './client-api.error';
import {
  ApiCreateClientRequest,
  ApiUpdateClientRequest,
  CreateBankAccountRequest,
} from './data';

@Injectable()
export class ClientApi {
  private readonly logger: Logger = new Logger(ClientApi.name);
  private readonly httpClient: HttpClient;
  private readonly url: string;

  constructor(
    @Inject(CONFIG_SERVICE) configService: ConfigService,
    @Inject(AUTH0_M2M_TOKEN_SERVICE) authTokenService: AuthTokenService,
  ) {
    this.httpClient = new HttpClient('client-service', authTokenService);
    const clientServiceUrl = configService.getValue('CLIENT_SERVICE_URL');
    if (!clientServiceUrl.hasValue()) {
      throw new Error(`Could not obtain CLIENT_SERVICE_URL config value`);
    }
    this.url = clientServiceUrl.asString();
  }

  @CrossCuttingConcerns({
    logging: () => {
      return {
        message: 'Fetching all clients from client service API',
      };
    },
    error: {
      errorSupplier: (cause) => new ClientApiError('get-all-clients', cause),
    },
    observability: {
      tag: ['client-api', 'get-all-clients'],
    },
  })
  async getAllClients(): Promise<LightweightClient[]> {
    const result = await this.httpClient.get(
      `${this.url}/clients/get-all-clients`,
      {
        response: { bodyType: LightweightClient },
      },
    );
    return result as LightweightClient[];
  }

  async findById(id: string): Promise<null | Client> {
    this.logger.log(`Fetching client from client service`, { id });
    const result = await this.httpClient.get(`${this.url}/clients/${id}`, {
      nullOnFail: true,
      response: {
        bodyType: Client,
      },
    });
    return result === null ? null : (result as Client);
  }

  async findAllClientIds(queryParams: QueryParams): Promise<string[]> {
    this.logger.log(`Fetching all client Ids from client service`);
    const result = await this.httpClient.get(
      `${this.url}/clients/getClientIds/id?${queryParams}`,
      {
        response: { mapper: (data) => data },
      },
    );
    return result as string[];
  }

  async findAll(
    queryParams: QueryParams,
    clientIds: string[] | undefined,
  ): Promise<PageResult<Client>> {
    this.logger.log(`Fetching all clients from client service`);
    const result = await this.httpClient.post(
      `${this.url}/clients/getByIds?${queryParams}`,
      {
        response: {
          mapper: (data) => plainToInstance(PageResult<Client>, data.data),
        },
        request: {
          body: clientIds,
        },
      },
    );
    return result as PageResult<Client>;
  }

  async getById(id: string): Promise<Client> {
    const client = await this.findById(id);
    if (client == null) {
      throw new EntityNotFoundError(
        'Could not find client in external service',
      );
    }
    return client;
  }

  async findByIds(ids: string[], batchSize: number = 10): Promise<Client[]> {
    this.logger.log(`Fetching clients from client service`, { ids });
    if (ids.length === 0) {
      return [];
    }
    if (ids.length === 1) {
      const result = await this.findById(ids[0]);
      return result !== null ? [result] : [];
    }

    const results: Client[] = [];

    for (let i = 0; i < ids.length; i += batchSize) {
      const batchIds = ids.slice(i, i + batchSize);
      const queryParams = batchIds.map((id) => `id=${id}`).join('&');

      const batchResult = await this.httpClient.get(
        `${this.url}/clients/getByIds/id?${queryParams}`,
        {
          response: { bodyType: Client },
        },
      );

      results.push(...(batchResult as Client[]));
    }

    return results;
  }

  @CrossCuttingConcerns({
    logging: (id: string) => {
      return {
        message: 'Fetching all client bank accounts from client service API',
        payload: {
          clientId: id,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new ClientApiError('get-bank-accounts', cause),
    },
    observability: {
      tag: ['client-api', 'get-bank-accounts'],
    },
  })
  async findBankAccountsByClientId(
    id: string,
    query?: Partial<QueryCriteria>,
    shouldMask: boolean = true,
  ): Promise<ClientBankAccount[] | null> {
    const serializedQueryParams = serializeQueryCriteria(query)
      .replace(/filter\[\]/g, 'filter') // client service does not support array query params
      .replace(/sort\[\]/g, 'sort'); // TODO: remove when client service supports array in query params

    const urlSearchParams = new URLSearchParams(serializedQueryParams);
    urlSearchParams.set('mask', shouldMask.toString());

    if (!urlSearchParams.has('sort')) {
      urlSearchParams.set('sort', 'status:ASC');
    }

    const allItems: ClientBankAccount[] = [];
    const pageSize = 20; // max size on client service
    const maxPages = 10; // safety mechanism
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= maxPages) {
      const paginatedParams = new URLSearchParams(urlSearchParams);
      paginatedParams.set('limit', pageSize.toString());
      paginatedParams.set('page', page.toString());

      const result = await this.httpClient.get(
        `${this.url}/clients/${id}/bank-accounts`,
        {
          nullOnFail: true,
          response: {
            mapper: (data) => plainToInstance(ClientBankAccount, data.items),
          },
          request: {
            queryParams: paginatedParams,
          },
        },
      );

      if (result === null) {
        return null;
      }

      const items = result as ClientBankAccount[];
      allItems.push(...items);
      hasMore = items.length === pageSize;
      page++;
    }

    return allItems;
  }

  async findBankAccountById(
    clientId: string,
    id: string,
    shouldMask: boolean = true,
  ): Promise<ClientBankAccount | null> {
    const result = await this.httpClient.get(
      `${this.url}/clients/${clientId}/bank-accounts/${id}?mask=${shouldMask}`,
      {
        nullOnFail: true,
        response: {
          bodyType: ClientBankAccount,
        },
      },
    );
    return result === null ? null : (result as ClientBankAccount);
  }

  async getBankAccountsByclientIds(
    clientIds: string[],
  ): Promise<ClientBankAccountMap[]> {
    const response = await this.httpClient.post(
      `${this.url}/clients-bank-accounts`,
      {
        request: { body: clientIds },
        response: {
          mapper: (bodyData) =>
            plainToInstance(
              ClientBankAccountMap,
              bodyData.data as any[],
            ) as unknown as ClientBankAccountMap[],
        },
      },
    );
    return response ?? [];
  }

  async getBankAccountsByClientId(
    id: string,
    query?: Partial<QueryCriteria>,
    shouldMask: boolean = true,
  ): Promise<ClientBankAccount[]> {
    const bankAccounts = await this.findBankAccountsByClientId(
      id,
      query,
      shouldMask,
    );
    if (bankAccounts == null) {
      throw new EntityNotFoundError('Could not find client bank accounts');
    }
    return bankAccounts;
  }

  async create(request: ApiCreateClientRequest): Promise<Client> {
    this.logger.log(`Create client in Client Service`);
    const result = await this.httpClient.post(`${this.url}/clients`, {
      request: {
        body: request,
      },
      response: { bodyType: Client },
    });
    if (result == null) {
      throw new ClientApiError('create', new Error('Could not create client'));
    }
    return result;
  }

  async update(
    clientId: string,
    request: ApiUpdateClientRequest,
  ): Promise<Client> {
    this.logger.log(`Update client in Client Service`);
    const result = await this.httpClient.put(
      `${this.url}/clients/${clientId}`,
      {
        request: {
          body: request,
        },
        response: { bodyType: Client },
      },
    );
    if (result == null) {
      throw new ClientApiError('create', new Error('Could not create client'));
    }
    return result;
  }

  async updateDocument(
    clientId: string,
    documentId: string,
    request: UpdateClientDocumenRequest,
  ): Promise<ClientDocument> {
    this.logger.log(`Update client document in Client Service`);
    const result = await this.httpClient.put(
      `${this.url}/clients/${clientId}/client-documents/${documentId}`,
      {
        request: {
          body: request,
        },
        response: {
          mapper: (data) => {
            return plainToInstance(ClientDocument, data.data);
          },
        },
      },
    );
    if (result == null) {
      throw new ClientApiError(
        'update',
        new Error('Could not update client document'),
      );
    }
    return result;
  }

  async createBankAccount(
    clientId: string,
    request: CreateBankAccountRequest,
  ): Promise<ClientBankAccount> {
    const result = await this.httpClient.post(
      `${this.url}/clients/${clientId}/bank-accounts`,
      {
        request: {
          body: request,
        },
        nullOnFail: true,
        response: {
          mapper: (data) => {
            return plainToInstance(ClientBankAccount, data.data);
          },
        },
      },
    );
    if (result == null) {
      throw new ClientApiError(
        'create',
        new Error('Could not create client bank account'),
      );
    }
    return result;
  }

  async markBankAccountAsPrimary(
    clientId: string,
    bankAccountId: string,
  ): Promise<ClientBankAccount> {
    const payload = { product: ProductName.Factoring };
    const result = await this.httpClient.put(
      `${this.url}/clients/${clientId}/bank-accounts/${bankAccountId}/mark-primary`,
      {
        request: {
          body: payload,
        },
        response: {
          mapper: (data) => {
            return plainToInstance(ClientBankAccount, data.data);
          },
        },
      },
    );
    if (result == null) {
      throw new ClientApiError(
        'mark-primary',
        new Error('Could not mark bank account as primary'),
      );
    }
    return result;
  }
}
