import { environment } from '@core/environment';
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
import { buildStubBroker } from '@module-brokers/test';
import { Client, ClientApi } from '@module-clients';
import {
  buildStubClient,
  buildStubClientBankAccount,
} from '@module-clients/test';
import { ReferralRockService, ReferralRockWebhookGuard } from '@module-common';
import { DatabaseService, Transactional } from '@module-database';
import { InvoicesGuard } from '@module-invoices';
import {
  InvoiceEntitySchema,
  UserEntity,
  UserRepository,
} from '@module-persistence';
import { QuickbooksApi } from '@module-quickbooks';
import {
  ReferralRockMemberResponse,
  ReferralRockRewardResponse,
} from '@module-reserves/data';
import { SeedersModules } from '@module-seeders';
import { TransfersApi } from '@module-transfers';
import { buildStubExpediteTransferResponse } from '@module-transfers/test';
import { AppContextHolder, Authentication } from '@core/app-context';
import { CanActivate, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  enableRequestContextHelper,
  enableValidation,
} from '../../../../middlewares';
import { AppModule } from '../../app.module';

class MockReferralRockWebhookGuard implements CanActivate {
  canActivate(): boolean {
    AppContextHolder.get().setAuthentication(Authentication.getSystem());
    return true;
  }
}

export class IntegrationTestsAppManager {
  private clientAPI: ClientApi;
  private brokerAPI: BrokerApi;
  private transfersApi: TransfersApi;
  private quickbooksApi: QuickbooksApi;
  private testingModule: TestingModule;
  private referralRockService: ReferralRockService;
  user: UserEntity;
  client: Client;
  broker: Broker;
  app: INestApplication;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  static async init() {
    const manager = new IntegrationTestsAppManager();
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
    await this.loadSystemUser();
  }

  async close() {
    await this.app.close();
    await this.testingModule.close();
  }

  async cleanupInvoices() {
    await this.runTransactionally(async (app) => {
      const em = app.get(DatabaseService).getEntityManager();
      await em.execute(
        `TRUNCATE TABLE public.${InvoiceEntitySchema.TABLE_NAME} CASCADE`,
      );
    });
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

  private async loadSystemUser() {
    const databaseService = this.app.get(DatabaseService);
    return databaseService.withRequestContext(async () => {
      const userRepository = this.app.get(UserRepository);
      const systemUser = await userRepository.findOneById(
        environment.core.systemId(),
      );
      if (!systemUser) {
        throw new Error(
          'Could not find system user in database. Make sure to run migrations first',
        );
      }

      this.user = systemUser;
    });
  }

  private mockClientAPI() {
    const bankAccounts = [buildStubClientBankAccount()];
    this.client = buildStubClient();
    this.client.bankAccounts = bankAccounts;
    const mockAPI = createMock<ClientApi>();
    mockAPI.findById.mockResolvedValue(this.client);
    mockAPI.findByIds.mockResolvedValue([this.client]);
    mockAPI.getById.mockResolvedValue(this.client);
    mockAPI.getBankAccountsByClientId.mockResolvedValue(bankAccounts);
    this.clientAPI = mockAPI;
  }

  private mockBrokerAPI() {
    this.broker = buildStubBroker();
    const mockAPI = createMock<BrokerApi>();
    mockAPI.findById.mockResolvedValue(this.broker);
    mockAPI.findByIds.mockResolvedValue([this.broker]);
    mockAPI.findById.mockResolvedValue(this.broker);
    mockAPI.getById.mockResolvedValue(this.broker);
    mockAPI.findByTag.mockImplementation((filterTag) =>
      Promise.resolve(
        [this.broker].filter((broker) =>
          broker.tags.some((tag) => tag.key === filterTag),
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
    mockAPI.getExistingRewardFromRefRock.mockResolvedValue({
      id: UUID.get(),
      referralDisplayName: 'John',
    } as ReferralRockRewardResponse);
    mockAPI.getMemberDataFromRefRock.mockResolvedValue({
      externalIdentifier: `clientId:${this.client.id}`,
    } as ReferralRockMemberResponse);
    mockAPI.externalIdToClientId.mockReturnValue(this.client.id);
    this.referralRockService = mockAPI;
  }

  private async createTestingModule() {
    this.testingModule = await Test.createTestingModule({
      imports: [AppModule, SeedersModules],
    })
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
      .overrideGuard(ReferralRockWebhookGuard)
      .useClass(MockReferralRockWebhookGuard)
      .overrideGuard(InvoicesGuard)
      .useClass(MockInvoiceGuard)
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
}
