import { PageResult, PaginationResult } from '@core/data';
import {
  MockAuthGuard,
  MockInvoiceGuard,
  MockPermissionsGuard,
  SQSMock,
} from '@core/test';
import { UUID } from '@core/uuid';
import {
  AuthorizationErrorFilter,
  CauseAwareErrorFilter,
  UnexpectedValueErrorFilter,
} from '@core/web';
import { createMock } from '@golevelup/ts-jest';
import { JwtAuthGuard, PermissionsGuard } from '@module-auth';
import { Broker, BrokerApi } from '@module-brokers';
import { ClientApi } from '@module-clients';
import { ReferralRockService } from '@module-common';
import { DatabaseService, Transactional } from '@module-database';
import { InvoicesGuard } from '@module-invoices';
import { QuickbooksApi } from '@module-quickbooks';
import {
  ReferralRockMemberResponse,
  ReferralRockRewardResponse,
} from '@module-reserves/data';
import { SeedersModules } from '@module-seeders';
import { TransfersApi } from '@module-transfers';
import { buildStubExpediteTransferResponse } from '@module-transfers/test';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  enableRequestContextHelper,
  enableValidation,
} from '../../../../middlewares';
import { AppModule } from '../../app.module';
import { ITDataManager } from './it-data-manager';

export class ITAppManager {
  private clientAPI: ClientApi;
  private brokerAPI: BrokerApi;
  private transfersApi: TransfersApi;
  private quickbooksApi: QuickbooksApi;
  private testingModule: TestingModule;
  private referralRockService: ReferralRockService;
  data: ITDataManager;
  app: INestApplication;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  static async init() {
    const manager = new ITAppManager();
    await manager.setup();
    return manager;
  }

  async setup() {
    this.mockClientAPI();
    this.mockBrokerAPI();
    this.mockTransfersAPI();
    this.mockQuickbooksAPI();
    this.mockReferralRockService();
    await this.createTestingModule();
    await this.createApplication();
    await this.createDataManager();
  }

  async close() {
    await this.app.close();
    await this.testingModule.close();
  }

  async runTransactionally<T>(fn: (app: INestApplication<any>) => Promise<T>) {
    const databaseService = this.app.get(DatabaseService);
    return databaseService.withRequestContext(() =>
      this.doRunTransactionally(fn),
    );
  }

  @Transactional('integration-tests')
  private doRunTransactionally<T>(
    fn: (app: INestApplication<any>) => Promise<T>,
  ) {
    return fn(this.app);
  }

  private mockClientAPI() {
    const mockAPI = createMock<ClientApi>();
    mockAPI.findById.mockImplementation((id) => {
      const client = this.data.clients.find((client) => client.id === id);
      return Promise.resolve(client || null);
    });
    mockAPI.findByIds.mockImplementation((ids) => {
      const clients = this.data.clients.filter((client) =>
        ids.includes(client.id),
      );
      return Promise.resolve(clients);
    });
    mockAPI.getById.mockImplementation((id) => {
      const client = this.data.clients.find((client) => client.id === id);
      if (!client) {
        throw new Error(
          `Could not find client with id ${id} in integration tests`,
        );
      }
      return Promise.resolve(client);
    });
    mockAPI.getBankAccountsByClientId.mockImplementation((id) => {
      const client = this.data.clients.find((client) => client.id === id);
      if (!client) {
        throw new Error(
          `Could not find client with id ${id} in integration tests`,
        );
      }
      return Promise.resolve(client.bankAccounts || []);
    });
    this.clientAPI = mockAPI;
  }

  private mockBrokerAPI() {
    const mockAPI = createMock<BrokerApi>();
    mockAPI.findById.mockImplementation((id) => {
      const broker = this.data.brokers.find((broker) => broker.id === id);
      return Promise.resolve(broker || null);
    });
    mockAPI.findByIds.mockImplementation((ids) => {
      const brokers = this.data.brokers.filter((broker) =>
        ids.includes(broker.id),
      );
      return Promise.resolve(brokers);
    });
    mockAPI.getById.mockImplementation(async (id) => {
      const broker = this.data.brokers.find((broker) => broker.id === id);
      if (!broker) {
        throw new Error(
          `Could not find broker with id ${id} in integration tests`,
        );
      }
      return broker;
    });
    mockAPI.findByTag.mockImplementation((tagKey) => {
      const brokers = this.data.brokers.filter((broker) =>
        broker.tags.some((tag) => tag.key === tagKey),
      );
      return Promise.resolve(brokers);
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mockAPI.findAll.mockImplementation((_queryParams) =>
      Promise.resolve(
        new PageResult<Broker>(
          this.data.brokers,
          new PaginationResult(1, 10, this.data.brokers.length),
        ),
      ),
    );
    this.brokerAPI = mockAPI;
  }

  private mockTransfersAPI() {
    const mockAPI = createMock<TransfersApi>();
    mockAPI.createModernTreasuryExpedite.mockResolvedValue(
      buildStubExpediteTransferResponse(),
    );
    this.transfersApi = mockAPI;
  }

  private mockQuickbooksAPI() {
    const mockAPI = createMock<QuickbooksApi>();
    this.quickbooksApi = mockAPI;
  }

  private mockReferralRockService() {
    const mockAPI = createMock<ReferralRockService>();
    mockAPI.getExistingRewardFromRefRock.mockImplementation(async () => {
      return {
        id: UUID.get(),
        referralDisplayName: 'John',
      } as ReferralRockRewardResponse;
    });
    mockAPI.getMemberDataFromRefRock.mockImplementation(async () => {
      if (this.data.clients.length != 0) {
        throw new Error('No clients for mocking Referral Rock Service');
      }

      return {
        externalIdentifier: `clientId:${this.data.clients[0].id}`,
      } as ReferralRockMemberResponse;
    });
    mockAPI.externalIdToClientId.mockImplementation(() => {
      if (this.data.clients.length != 0) {
        throw new Error('No clients for mocking Referral Rock Service');
      }
      return this.data.clients[0].id;
    });
    this.referralRockService = mockAPI;
  }

  private async createTestingModule() {
    this.testingModule = await Test.createTestingModule({
      imports: [AppModule, SeedersModules],
    })
      .overrideGuard(InvoicesGuard)
      .useClass(MockInvoiceGuard)
      .overrideProvider(ClientApi)
      .useValue(this.clientAPI)
      .overrideProvider(BrokerApi)
      .useValue(this.brokerAPI)
      .overrideProvider(TransfersApi)
      .useValue(this.transfersApi)
      .overrideProvider(QuickbooksApi)
      .useValue(this.quickbooksApi)
      .overrideProvider(ReferralRockService)
      .useValue(this.referralRockService)
      .overrideProvider(JwtAuthGuard)
      .useClass(MockAuthGuard)
      .overrideProvider(PermissionsGuard)
      .useClass(MockPermissionsGuard)
      .compile();
  }

  private async createApplication() {
    SQSMock.withDefaults();
    this.app = this.testingModule.createNestApplication({ rawBody: true });
    enableRequestContextHelper(this.app);
    enableValidation(this.app);
    this.app.useGlobalFilters(
      new UnexpectedValueErrorFilter(),
      new AuthorizationErrorFilter(),
      new CauseAwareErrorFilter(),
    );
    await this.app.init();
  }

  private async createDataManager() {
    this.data = new ITDataManager(this);
    await this.data.setup();
  }
}
