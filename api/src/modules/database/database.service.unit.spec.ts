import { AWSModule } from '@module-aws';
import { Test, TestingModule } from '@nestjs/testing';
import { BobtailConfigModule } from '../bobtail-config/bobtail-config.modules';
import {
  DatabaseCredentials,
  DatabaseCredentialService,
} from './database-credentials.service';
import { DatabaseService } from './database.service';

const databaseCredentials: DatabaseCredentials = {
  username: 'username',
  password: 'password',
  database: 'database',
  host: 'host',
  readerEndpointHost: 'replicaHost',
  port: 1,
};

jest.mock('@module-persistence/entities', () => {
  return {
    registry: [],
  };
});

jest.mock('@module-persistence/history', () => {
  return {
    historyRegistry: [],
  };
});

jest.mock('mikro-orm');
jest.mock('rxjs', () => {
  const original = jest.requireActual('rxjs');
  return {
    ...original,
    firstValueFrom: jest.fn(() => Promise.resolve(databaseCredentials)),
    timeout: jest.fn(),
    skip: jest.fn(),
  };
});

describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: DatabaseService,
          useFactory: async (
            databaseCredentialsService: DatabaseCredentialService,
          ) => {
            return new DatabaseService(databaseCredentialsService);
          },
          inject: [DatabaseCredentialService],
        },
      ],
      imports: [BobtailConfigModule, AWSModule],
    })
      .useMocker((token) => {
        if (token === DatabaseCredentialService) {
          return {
            observe: jest.fn().mockReturnThis(),
            pipe: jest.fn().mockReturnThis(),
            subscribe: jest.fn().mockReturnThis(),
            get: jest.fn().mockReturnThis(),
          };
        }
        return {};
      })
      .compile();

    service = module.get<DatabaseService>(DatabaseService);
  }, 60000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  it('MikroORM is not instantiated if not loaded', async () => {
    expect(service.getMikroORM()).toBe(undefined);
  });
});
