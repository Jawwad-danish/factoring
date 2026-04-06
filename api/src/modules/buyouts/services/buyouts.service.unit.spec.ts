import { mockToken } from '@core/test';
import { CommandRunner } from '@module-cqrs';
import { RecordStatus } from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityStubs } from '@module-persistence/test';
import { BuyoutsService } from './buyouts.service';

describe('Buyouts Service', () => {
  let buyoutsService: BuyoutsService;
  let commandRunner: CommandRunner;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BuyoutsService],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();
    buyoutsService = module.get(BuyoutsService);
    commandRunner = module.get(CommandRunner);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(buyoutsService).toBeDefined();
  });

  it('Buyout entity marked for soft delete', async () => {
    const entity = EntityStubs.buildStubPendingBuyout();
    entity.recordStatus = RecordStatus.Inactive;

    jest
      .spyOn(commandRunner, 'run')
      .mockImplementation(jest.fn())
      .mockResolvedValue(entity);

    await buyoutsService.delete('2134', {});

    expect(commandRunner.run).toHaveBeenCalledWith(
      expect.objectContaining({
        buyoutId: '2134',
      }),
    );
  });
});
