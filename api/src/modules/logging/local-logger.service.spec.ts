jest.mock('winston', () => {
  const mockFormat = {
    combine: jest.fn(),
    timestamp: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
  };
  const mockTransports = {
    Console: jest.fn(),
  };
  const mockLogger = {
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  };
  return {
    format: mockFormat,
    transports: mockTransports,
    createLogger: jest.fn(() => mockLogger),
  };
});

import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService, CONFIG_SERVICE } from '@module-config';
import { LocalLogger } from './local-logger.service';

describe('AppLogger', () => {
  let logger: LocalLogger;
  let configServiceMock: DeepMocked<ConfigService>;

  beforeEach(async () => {
    configServiceMock = createMock<ConfigService>();
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        LocalLogger,
        {
          provide: CONFIG_SERVICE,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    logger = app.get<LocalLogger>(LocalLogger);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('Should be defined', () => {
    expect(logger).toBeDefined();
  });
});
