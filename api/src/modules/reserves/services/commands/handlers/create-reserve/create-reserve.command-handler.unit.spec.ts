import { mockToken } from '@core/test';
import { ReserveEntity } from '@module-persistence';
import { ReserveRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { CreateReserveRequestBuilder } from '../../../../test';
import { CreateReserveCommand } from '../../create-reserve.command';
import { CreateReserveCommandHandler } from './create-reserve.command-handler';

describe('CreateReserveCommandHandler', () => {
  let repository: ReserveRepository;
  let handler: CreateReserveCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateReserveCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    repository = module.get(ReserveRepository);
    handler = module.get(CreateReserveCommandHandler);
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Reserve is persisted', async () => {
    const persistSpy = jest.spyOn(repository, 'persist');
    const reserve = await handler.execute(
      new CreateReserveCommand(
        UUID.get(),
        CreateReserveRequestBuilder.releaseOfFundsTo3rdParty(),
      ),
    );

    expect(reserve).toBeInstanceOf(ReserveEntity);
    expect(persistSpy).toBeCalledTimes(1);
  });
});
