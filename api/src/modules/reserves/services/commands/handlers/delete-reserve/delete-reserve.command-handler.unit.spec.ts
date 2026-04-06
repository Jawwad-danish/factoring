import { mockToken } from '@core/test';
import { ReserveReason } from '@module-persistence/entities';
import { ReserveRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { DeleteReserveRequestBuilder } from '../../../../test';
import { DeleteReserveCommand } from '../../delete-reserve.command';
import { DeleteReserveCommandHandler } from './delete-reserve.command-handler';
import { DeleteReserveValidationService } from './validation';
import Big from 'big.js';
import { EntityStubs } from '@module-persistence/test';

describe('DeleteReserveCommandHandler', () => {
  let repository: ReserveRepository;
  let validationService: DeleteReserveValidationService;
  let handler: DeleteReserveCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeleteReserveCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validationService = module.get(DeleteReserveValidationService);
    repository = module.get(ReserveRepository);
    handler = module.get(DeleteReserveCommandHandler);
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Validation is called and reserve is persisted', async () => {
    jest.spyOn(repository, 'getOneById').mockResolvedValue(
      EntityStubs.buildStubReserve({
        reason: ReserveReason.Fee,
      }),
    );
    const validationSpy = jest.spyOn(validationService, 'validate');
    await handler.execute(
      new DeleteReserveCommand(
        UUID.get(),
        UUID.get(),
        DeleteReserveRequestBuilder.from(),
      ),
    );

    expect(validationSpy).toBeCalledTimes(1);
  });

  it('Reserve is persisted', async () => {
    jest.spyOn(repository, 'getOneById').mockResolvedValue(
      EntityStubs.buildStubReserve({
        reason: ReserveReason.Fee,
        amount: new Big(100),
      }),
    );
    const persistSpy = jest.spyOn(repository, 'persist');
    const reserve = await handler.execute(
      new DeleteReserveCommand(
        UUID.get(),
        UUID.get(),
        DeleteReserveRequestBuilder.from(),
      ),
    );

    expect(persistSpy).toBeCalledTimes(1);
    expect(reserve.reason).toBe(ReserveReason.FeeRemoved);
    expect(reserve.amount.toNumber()).toBe(-100);
  });
});
