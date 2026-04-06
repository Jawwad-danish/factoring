import { QueryCriteria } from '@core/data';
import { mockToken } from '@core/test';
import { CommandRunner, QueryRunner } from '@module-cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { CreateReserveAccountFundsRequestBuilder } from '../test';
import { CreateReserveAccountFundsCommand } from './commands';
import { FindReserveAccountFundsQuery } from './queries';
import { ReserveAccountFundsService } from './reserve-account-funds.service';
import Big from 'big.js';
import { ReserveAccountFundsRepository } from '@module-persistence';

describe('Reserve account funds service', () => {
  let service: ReserveAccountFundsService;
  let commandRunner: CommandRunner;
  let queryRunner: QueryRunner;
  let repository: ReserveAccountFundsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReserveAccountFundsService],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    commandRunner = module.get(CommandRunner);
    queryRunner = module.get(QueryRunner);
    service = module.get(ReserveAccountFundsService);
    repository = module.get(ReserveAccountFundsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  it('When creating a reserve account fund, command is sent', async () => {
    const commandRunnerSpy = jest.spyOn(commandRunner, 'run');
    await service.create(
      UUID.get(),
      CreateReserveAccountFundsRequestBuilder.from({
        note: 'Note',
        amount: new Big(100),
      }),
    );

    expect(commandRunnerSpy.mock.calls[0][0]).toBeInstanceOf(
      CreateReserveAccountFundsCommand,
    );
  });

  it('When fetching reserve account funds, query is sent', async () => {
    const queryRunnerSpy = jest.spyOn(queryRunner, 'run');
    queryRunnerSpy.mockResolvedValueOnce([[], 0]);
    await service.findAll(UUID.get(), new QueryCriteria());

    expect(queryRunnerSpy.mock.calls[0][0]).toBeInstanceOf(
      FindReserveAccountFundsQuery,
    );
  });

  it('When fetching reserve total, amount is retrieved', async () => {
    jest.spyOn(repository, 'getTotalForClient').mockResolvedValueOnce(100);
    const result = await service.getTotal(UUID.get());

    expect(result.toFixed()).toBe('100');
  });
});
