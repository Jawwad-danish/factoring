import { Test, TestingModule } from '@nestjs/testing';
import { testingRequest, MockAuthGuard } from '@core/test';
import { AppModule } from '../app/app.module';
import { ClientApi } from '@module-clients';
import { BrokerApi } from '@module-brokers';
import { INestApplication } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { JwtAuthGuard } from './guards';

describe('App seeder integration tests', () => {
  let app: INestApplication;
  let testModule: TestingModule;

  beforeAll(async () => {
    testModule = await Test.createTestingModule({
      imports: [AppModule, AuthModule],
    })
      .overrideProvider(ClientApi)
      .useValue({})
      .overrideProvider(BrokerApi)
      .useValue({})
      .overrideProvider(JwtAuthGuard)
      .useClass(MockAuthGuard)
      .compile();
    app = testModule.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await testModule.close();
    await new Promise((fulfill) => setTimeout(fulfill, 250));
  });
  it('App is under auth guard', async () => {
    testingRequest(app.getHttpServer()).get('/').expect(200);
  });

  it('Can not access endpoints without token', async () => {
    testingRequest(app.getHttpServer())
      .get('/')
      .unset('Authorization')
      .expect(401);
  });
});
