import { mockToken } from '@core/test';
import { CommandRunner, QueryRunner } from '@module-cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InitiateExpediteTransferRequest,
  InitiateRegularTransferRequest,
} from '../data';
import {
  InitiateExpediteTransferCommand,
  InitiateRegularTransferCommand,
} from './commands';
import { FindUpcomingExpediteTransfersQuery } from './queries';
import { TransferService } from './transfer.service';

describe('TransferFeeFinder', () => {
  let commandRunner: CommandRunner;
  let queryRunner: QueryRunner;
  let transferService: TransferService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransferService],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    commandRunner = module.get(CommandRunner);
    queryRunner = module.get(QueryRunner);
    transferService = module.get(TransferService);
  }, 60000);

  it('Should be defined', () => {
    expect(transferService).toBeDefined();
  });

  it('Get upcoming expedited transfers sends the correct query', async () => {
    const runSpy = jest.spyOn(queryRunner, 'run');
    await transferService.getUpcomingExpediteTransfers();

    expect(runSpy).toBeCalledTimes(1);
    const query = runSpy.mock.calls[0][0];
    expect(query).toBeInstanceOf(FindUpcomingExpediteTransfersQuery);
  });

  it('Initiate expedite transfer sends the correct command', async () => {
    const runSpy = jest.spyOn(commandRunner, 'run');
    await transferService.doInitiateExpediteTransfer(
      new InitiateExpediteTransferRequest({
        clientId: '',
      }),
    );

    expect(runSpy).toBeCalledTimes(1);
    const command = runSpy.mock.calls[0][0];
    expect(command).toBeInstanceOf(InitiateExpediteTransferCommand);
  });

  it('Initiate regular transfer sends the correct command', async () => {
    const runSpy = jest.spyOn(commandRunner, 'run');
    await transferService.doInitiateRegularTransfer(
      new InitiateRegularTransferRequest(),
    );

    expect(runSpy).toBeCalledTimes(1);
    const command = runSpy.mock.calls[0][0];
    expect(command).toBeInstanceOf(InitiateRegularTransferCommand);
  });
});
