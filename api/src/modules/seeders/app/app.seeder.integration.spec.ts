import { BrokerApi } from '@module-brokers';
import { ClientApi } from '@module-clients';
import { DatabaseModule, DatabaseService } from '@module-database';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app/app.module';
import { SeedersModules } from '../seeders.module';
import { AppSeeder, SeedResult } from './app.seeder';

describe('App seeder integration tests', () => {
  let app;
  let appSeeder: AppSeeder;
  let databaseService: DatabaseService;
  let testModule: TestingModule;

  beforeAll(async () => {
    testModule = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule, SeedersModules],
    })
      .overrideProvider(ClientApi)
      .useValue({})
      .overrideProvider(BrokerApi)
      .useValue({})
      .compile();
    app = testModule.createNestApplication();
    appSeeder = app.get(AppSeeder);
    databaseService = app.get(DatabaseService);
    expect(appSeeder).toBeDefined();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await testModule.close();
    await new Promise((fulfill) => setTimeout(fulfill, 250));
  });

  it('Seeder works as expected', async () => {
    let seedData!: SeedResult;
    await databaseService.withRequestContext(async () => {
      seedData = await appSeeder.seed({
        numberOfInvoices: 0,
        numberOfPendingBuyouts: 0,
      });
    });
    expect(seedData.invoices.length).toBe(0);
  }, 60000);
});
