import { Injectable, Logger } from '@nestjs/common';
import {
  Client,
  ClientConfigUser,
  ClientDocument,
  ClientFactoringConfigMapper,
  ClientOverview,
  ClientReleasedEvent,
  CreateClientFactoringConfigRequest,
  CreateClientRequest,
  LightweightClient,
  UpdateClientDocumenRequest,
  UpdateClientFactoringConfigRequest,
  UpdateClientRequest,
} from '../data';

import { ClientEvents, ClientLimitEvent } from '@common/events';
import {
  externalServicesSerializeQueryCriteria,
  FilterCriteria,
  FilterOperator,
  FilterStrategyOps,
  PageResult,
  PaginationResult,
  QueryCriteria,
} from '@core/data';
import { EntityNotFoundError } from '@core/errors';
import { batch, CrossCuttingConcerns } from '@core/util';
import { CommandRunner, EventPublisher, QueryRunner } from '@module-cqrs';
import { DatabaseService, Transactional } from '@module-database';
import { UpdateInvoiceExpeditedCommand } from '@module-invoices/commands';
import {
  ClientFactoringConfigsEntity,
  ClientFactoringStatus,
  ClientSuccessTeamEntity,
  RecordStatus,
} from '@module-persistence/entities';
import {
  ClientFactoringConfigsRepository,
  ClientSuccessTeamRepository,
} from '@module-persistence/repositories';
import { VerifyRtpSupportAccount, VerifyRtpSupportQuery } from '@module-rtp';
import { UserService } from '@module-users';

import {
  BankAccountIssues,
  ClientBankAccount,
  ClientBankAccountStatus,
  FactoringBankAccount,
  ProductName,
  SupportedPaymentMethod,
} from '@fs-bobtail/factoring/data';
import { ClientApi } from '../api';
import {
  CreateClientCommand,
  CreateClientFactoringConfigCommand,
  UpdateClientCommand,
  UpdateClientDocumentCommand,
  UpdateClientFactoringConfigCommand,
  UpdateClientsFromFmcsaCommand,
  UpdateClientsFromInactivityCommand,
} from './commands';
import {
  ClientCreateError,
  ClientNotFoundError,
  ClientsNotFoundError,
  ClientStatusSyncError,
  UpdateClientConfigError,
  UserNotFoundError,
} from './errors';
import { ClientStatusChangedEvent } from './events';
import { ClientOverviewQuery, FindClientsByIds } from './queries';

const OBSERVABILITY_TAG = 'client-service';

interface ClientFetchOptions {
  includeBankAccounts?: boolean;
  includeHistory?: boolean;
  includeAudit?: boolean;
  includeUser?: boolean;
}
@Injectable()
export class ClientService {
  private logger: Logger = new Logger(ClientService.name);

  constructor(
    private readonly clientApi: ClientApi,
    private readonly clientFactoringConfigRepository: ClientFactoringConfigsRepository,
    private readonly successTeamRepository: ClientSuccessTeamRepository,
    private readonly clientFactoringConfigMapper: ClientFactoringConfigMapper,
    private readonly commandRunner: CommandRunner,
    private readonly queryRunner: QueryRunner,
    private readonly eventPublisher: EventPublisher,
    private readonly databaseService: DatabaseService,
    private readonly userService: UserService,
  ) {}

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause: Error, id: string) =>
        new ClientNotFoundError(id, cause),
    },
    logging: (id: string) => {
      return {
        message: 'Getting client by id',
        payload: {
          clientId: id,
        },
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'get-by-id'],
    },
  })
  async getOneById(id: string, options?: ClientFetchOptions): Promise<Client> {
    const client = await this.clientApi.getById(id);
    if (options?.includeBankAccounts) {
      await this.loadBankAccounts([client]);
    }
    await this.loadFactoringConfigs([client], options);
    return client;
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause: Error, id: string) =>
        new ClientNotFoundError(id, cause),
    },
    logging: (clientId: string) => {
      return {
        message: 'Fetching primary factoring bank account',
        payload: {
          clientId,
        },
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'get-primary-bank-account'],
    },
  })
  async getPrimaryBankAccount(
    clientId: string,
    shouldMask: boolean = true,
  ): Promise<null | ClientBankAccount> {
    const bankAccounts = await this.clientApi.getBankAccountsByClientId(
      clientId,
      {
        filters: [
          new FilterCriteria({
            name: 'status',
            operator: FilterOperator.EQ,
            value: ClientBankAccountStatus.Active,
          }),
        ],
      },
      shouldMask,
    );
    const bankAccount = bankAccounts.find((bankAccount) => {
      const products = bankAccount.products || [];

      const hasNonCardProducts = products.some(
        (product) => product.name != ProductName.Card,
      );
      const hasNoProducts = products.length === 0;
      const isValidForFactoring = hasNonCardProducts || hasNoProducts;

      return isValidForFactoring;
    });
    if (!bankAccount) {
      this.logger.warn('Could not find factoring bank account for client', {
        clientId,
        totalBankAccounts: bankAccounts.length,
      });
      return null;
    }
    return bankAccount;
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause) => new ClientsNotFoundError(cause),
    },
    logging: (ids: string[]) => {
      return {
        message: 'Finding clients by ids',
        payload: {
          clientIds: ids,
        },
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'find-by-ids'],
    },
  })
  async findByIds(
    ids: string[],
    options?: ClientFetchOptions,
  ): Promise<Client[]> {
    return await this.queryRunner.run(new FindClientsByIds(ids, options));
  }

  @CrossCuttingConcerns({
    logging: (clientId: string) => {
      return {
        message: 'Fetching factoring bank accounts',
        payload: {
          clientId,
        },
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'get-factoring-bank-accounts'],
    },
  })
  async getFactoringBankAccounts(
    clientId: string,
    options?: { includeSensitive: boolean },
  ): Promise<FactoringBankAccount[]> {
    const result = await this.clientApi.getBankAccountsByClientId(
      clientId,
      undefined,
      !options?.includeSensitive,
    );

    if (result === null) {
      return [];
    }

    const factoringBankAccounts = result.filter((bankAccount) => {
      const products = bankAccount.products || [];
      return (
        products.some((product) => product.name === ProductName.Factoring) ||
        products.length === 0
      );
    });

    const accountsToCheck = factoringBankAccounts.map(
      (acc): VerifyRtpSupportAccount => {
        return {
          clientId: clientId,
          accountId: acc.id,
          routingNumber: acc.getRoutingNumber(),
          wireRoutingNumber: acc.getWireRoutingNumber(),
          modernTreasuryExternalAccountId:
            acc.modernTreasuryAccount?.externalAccountId,
        };
      },
    );

    const rtpSupportedAccountIds = await this.queryRunner.run(
      new VerifyRtpSupportQuery(accountsToCheck),
    );

    return factoringBankAccounts.map((acc) => {
      const supportedPaymentMethods = [SupportedPaymentMethod.Ach];
      if (acc.getWireRoutingNumber()) {
        supportedPaymentMethods.push(SupportedPaymentMethod.Wire);
      }
      if (rtpSupportedAccountIds.includes(acc.id)) {
        supportedPaymentMethods.push(SupportedPaymentMethod.Rtp);
      }
      const issues = this.computeBankAccountIssues(acc);
      const factoringBankAccount = new FactoringBankAccount(acc);
      factoringBankAccount.supportedPaymentMethods = supportedPaymentMethods;
      factoringBankAccount.issues = issues;
      return factoringBankAccount;
    });
  }

  private computeBankAccountIssues(
    bankAccount: ClientBankAccount,
  ): BankAccountIssues[] {
    const issues: BankAccountIssues[] = [];
    if (
      bankAccount.plaidAccount.verificationStatus ===
      'pending_automatic_verification'
    ) {
      issues.push(BankAccountIssues.PendingVerification);
    }
    if (bankAccount.plaidAccount.verificationStatus === 'ITEM_LOGIN_REQUIRED') {
      issues.push(BankAccountIssues.VerificationExpired);
    }
    if (
      bankAccount.plaidAccount.verificationStatus ===
      'pending_manual_verification'
    ) {
      issues.push(BankAccountIssues.PendingMicroDeposits);
    }
    const wireRoutingNumber = bankAccount.getWireRoutingNumber();

    if (!wireRoutingNumber) {
      issues.push(BankAccountIssues.RequiresWireRoutingNumber);
    }
    if (!bankAccount.plaidAccount?.bankName) {
      issues.push(BankAccountIssues.MissingBankName);
    }
    return issues;
  }

  private async loadBankAccounts(clients: Client[]): Promise<void> {
    for (const client of clients) {
      const bankAccounts = await this.clientApi.getBankAccountsByClientId(
        client.id,
      );
      client.bankAccounts = bankAccounts;
    }
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause) => new ClientNotFoundError('all', cause),
    },
    logging: () => {
      return {
        message: 'Finding all clients',
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'find-all'],
    },
  })
  async findAll(
    criteria: QueryCriteria,
    options?: ClientFetchOptions,
  ): Promise<PageResult<Client>> {
    //extract status filter if it exists and remove it from the criteria
    const statusValue = criteria.filters?.find(
      (data) => data.name === 'status',
    )?.value;
    criteria.filters = criteria.filters.filter((item) => item.name != 'status');

    const queryParams = externalServicesSerializeQueryCriteria({
      sort: criteria.sort,
      filters: criteria.filters,
      filterStrategy: { filterMode: FilterStrategyOps.OR },
    });
    const factoringConfigFilter: { [key: string]: any } = {};
    // If there are other filters, fetch client IDs
    let csFilteredClientIds: string[] = [];
    if (criteria.filters.length > 0) {
      csFilteredClientIds = await this.clientApi.findAllClientIds(queryParams);
      factoringConfigFilter.clientId = { $in: csFilteredClientIds };
    }

    // If a status is specified, filter the clients based on the status
    if (statusValue) {
      const statusFilter =
        statusValue === 'active'
          ? ClientFactoringStatus.Active
          : { $ne: ClientFactoringStatus.Active };
      factoringConfigFilter.status = statusFilter;
    }

    const sorting = {};
    if (criteria.sort) {
      for (const sortItem of criteria.sort) {
        if (sortItem.name === 'createdAt') {
          sorting['createdAt'] = sortItem.order === 'DESC' ? -1 : 1;
        }
      }
    }

    const [factoringClients, totalItems] =
      await this.clientFactoringConfigRepository.findAll(
        factoringConfigFilter,
        {
          offset: criteria.page.getOffset(),
          limit: criteria.page.limit,
          orderBy: sorting,
        },
      );
    const clientIds = factoringClients.map((item) => item.clientId);

    const clients: Client[] = [];
    if (clientIds.length > 0) {
      const clientsResponse = await this.clientApi.findAll(
        queryParams,
        clientIds,
      );
      clients.push(...clientsResponse.items);
    }

    if (options?.includeBankAccounts) {
      await this.loadBankAccounts(clients);
    }
    await this.loadFactoringConfigs(clients, options);

    return new PageResult(
      clients,
      new PaginationResult(criteria.page.page, criteria.page.limit, totalItems),
    );
  }

  private async loadFactoringConfigs(
    clients: Client[],
    options?: ClientFetchOptions,
  ): Promise<void> {
    const clientIds = clients.map((client) => client.id);
    const configs = await this.clientFactoringConfigRepository.findByClientIds(
      clientIds,
      {
        history: options?.includeHistory || false,
        audit: options?.includeAudit || false,
        user: options?.includeUser || false,
      },
    );

    for (const client of clients) {
      const config = configs.find((config) => config.clientId === client.id);
      if (!config) {
        this.logger.error('Could not find client factoring config', {
          clientId: client.id,
        });
        throw EntityNotFoundError.byId(client.id, 'client factoring config');
      }

      client.factoringConfig =
        await this.clientFactoringConfigMapper.entityToModel(config);
      client.email = config.user?.email || '';
    }
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause, clientId: string) =>
        new UpdateClientConfigError(clientId, cause),
    },
    logging: (
      clientId: string,
      request: UpdateClientFactoringConfigRequest,
    ) => {
      return {
        message: 'Update client factoring config',
        payload: {
          clientId,
          request,
        },
      };
    },
  })
  @Transactional('update-client-factoring-config')
  private async doUpdateFactoringConfig(
    clientId: string,
    request: UpdateClientFactoringConfigRequest,
  ) {
    const expedite =
      request.doneSubmittingInvoices === false
        ? true
        : request.expediteTransferOnly != null
        ? request.expediteTransferOnly
        : undefined;

    if (expedite != null) {
      await this.commandRunner.run(
        new UpdateInvoiceExpeditedCommand({
          clientId,
          expedite,
          ingestThrough: request.ingestThrough,
          v1Payload: request.v1Payload,
        }),
      );
    }

    return await this.commandRunner.run(
      new UpdateClientFactoringConfigCommand(clientId, request),
    );
  }

  async updateFactoringConfig(
    clientId: string,
    request: UpdateClientFactoringConfigRequest,
  ): Promise<ClientFactoringConfigsEntity> {
    const currentStatus = (
      await this.clientFactoringConfigRepository.getOneByClientId(clientId)
    ).status;
    const result = await this.doUpdateFactoringConfig(clientId, request);
    if (
      result.status === ClientFactoringStatus.Released &&
      result.status !== currentStatus
    ) {
      const client = await this.getOneById(clientId);

      this.eventPublisher.emit(
        ClientEvents.Released,
        new ClientReleasedEvent({
          client: client,
          releaseReason: request.statusReason,
          releaseDate: client.factoringConfig.updatedAt,
        }),
      );
    }

    if (request.clientLimitAmount) {
      this.eventPublisher.emit(
        ClientEvents.Limit,
        new ClientLimitEvent(clientId),
      );
    }
    return result;
  }

  @Transactional('update-client-document')
  async updateClientDocument(
    clientId: string,
    documentId: string,
    request: UpdateClientDocumenRequest,
  ): Promise<ClientDocument> {
    return await this.commandRunner.run(
      new UpdateClientDocumentCommand(clientId, documentId, request),
    );
  }

  @Transactional('create-client-factoring-config')
  async createClientFactoringConfig(
    request: CreateClientFactoringConfigRequest,
  ): Promise<ClientConfigUser> {
    return await this.commandRunner.run(
      new CreateClientFactoringConfigCommand(request),
    );
  }

  @Transactional('create-client')
  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause) => new ClientCreateError(cause),
    },
    logging: () => {
      return {
        message: 'Creating client',
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'create'],
    },
  })
  async createClient(
    request: CreateClientRequest,
  ): Promise<ClientFactoringConfigsEntity> {
    return await this.commandRunner.run(new CreateClientCommand(request));
  }

  @Transactional('update-client')
  async updateClient(
    clientId: string,
    request: UpdateClientRequest,
  ): Promise<ClientFactoringConfigsEntity> {
    return await this.commandRunner.run(
      new UpdateClientCommand(clientId, request),
    );
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause: Error, email: string) =>
        new UserNotFoundError('email', email, cause),
    },
    logging: (email: string) => {
      return {
        message: 'Getting current user',
        payload: {
          clientEmail: email,
        },
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'get-me'],
    },
  })
  async getMe(email: string): Promise<Client> {
    const clientFactoringConfigEntity =
      await this.clientFactoringConfigRepository.getOneByUserEmail(email);
    const client = await this.clientApi.getById(
      clientFactoringConfigEntity.clientId,
    );
    client.email = clientFactoringConfigEntity.user?.email || email;
    client.factoringConfig =
      await this.clientFactoringConfigMapper.entityToModel(
        clientFactoringConfigEntity,
      );
    client.accountExecutivePhoneNumber = ''; //TODO: temporary, until this field gets figured out
    return client;
  }

  @CrossCuttingConcerns<ClientService, 'overview'>({
    error: {
      errorSupplier: (cause: Error, id: string) =>
        new ClientNotFoundError(id, cause),
    },
    logging: (id: string) => {
      return {
        message: `Fetching client overview for client ${id}`,
        payload: {
          clientId: id,
        },
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'overview'],
    },
  })
  async overview(id: string): Promise<ClientOverview> {
    const client = await this.clientApi.getById(id);
    return this.queryRunner.run(new ClientOverviewQuery(client.id));
  }

  async getClientSuccessTeams(): Promise<ClientSuccessTeamEntity[]> {
    return await this.successTeamRepository.find({
      recordStatus: RecordStatus.Active,
      name: {
        $ilike: 'team%',
      },
    });
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause) => new ClientStatusSyncError(cause),
    },
    logging: () => {
      return {
        message: 'Updating client from FMCSA',
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'update-client-from-fmcsa'],
    },
  })
  async updateClientsFromFmcsa(): Promise<void> {
    const clients = await this.clientApi.getAllClients();
    const batchesOfClients = batch(clients, 200);
    this.logger.log(
      `Processing ${clients.length} clients in ${batchesOfClients.length} batches`,
    );
    for (let i = 0; i < batchesOfClients.length; i++) {
      this.logger.log(
        `Processing FMCSA batch ${i + 1}/${batchesOfClients.length}`,
      );
      const result = await this.databaseService.withRequestContext(() =>
        this.doUpdateClientsFromFmcsa(batchesOfClients[i]),
      );
      this.eventPublisher.emit(
        ClientStatusChangedEvent.EVENT_NAME,
        new ClientStatusChangedEvent(result.changes),
      );
      const mem = process.memoryUsage();
      this.logger.debug(
        `Batch ${i + 1}/${batchesOfClients.length} done — heap: ${Math.round(
          mem.heapUsed / 1024 / 1024,
        )}MB`,
      );
    }
  }

  @Transactional('update-client-from-fmcsa')
  private async doUpdateClientsFromFmcsa(clients: LightweightClient[]) {
    return await this.commandRunner.run(
      new UpdateClientsFromFmcsaCommand(clients),
    );
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause) => new ClientStatusSyncError(cause),
    },
    logging: () => {
      return {
        message: 'Updating clients from inactivity',
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'sync-config-statuses'],
    },
  })
  async updateClientsFromInactivity(): Promise<void> {
    const result = await this.doUpdateClientsFromInactivity();
    this.eventPublisher.emit(
      ClientStatusChangedEvent.EVENT_NAME,
      new ClientStatusChangedEvent(result.changes),
    );
  }

  @Transactional('update-client-from-inactivity')
  private async doUpdateClientsFromInactivity() {
    return await this.commandRunner.run(
      new UpdateClientsFromInactivityCommand(),
    );
  }

  @CrossCuttingConcerns({
    logging: (clientId: string) => {
      return {
        message: 'Send reset client password request',
        payload: {
          clientId,
        },
      };
    },
  })
  async sendResetClientPasswordRequest(clientId: string): Promise<void> {
    const clientConfig =
      await this.clientFactoringConfigRepository.getOneByClientId(clientId);
    await this.userService.validateUserIsNotEmployee(clientConfig.user.id);
    await this.userService.sendResetPasswordRequest(clientConfig.user.id);
  }
}
