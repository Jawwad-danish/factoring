import { mockToken } from '@core/test';
import { ReserveAccountFundsEntity } from '@module-persistence/entities';
import { ReserveAccountFundsRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { CreateReserveAccountFundsRequestBuilder } from '../../../test';
import { CreateReserveAccountFundsCommand } from '../create-reserve-account-funds.command';
import { CreateReserveAccountFundsCommandHandler } from './create-reserve-account-funds.command-handler';

describe('CreateReserveAccountFundsCommandHandler', () => {
  let repository: ReserveAccountFundsRepository;
  let handler: CreateReserveAccountFundsCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateReserveAccountFundsCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    repository = module.get(ReserveAccountFundsRepository);
    handler = module.get(CreateReserveAccountFundsCommandHandler);
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Reserve account fund is persisted', async () => {
    const persistSpy = jest.spyOn(repository, 'persist');
    const reserve = await handler.execute(
      new CreateReserveAccountFundsCommand(
        UUID.get(),
        CreateReserveAccountFundsRequestBuilder.from(),
      ),
    );

    expect(reserve).toBeInstanceOf(ReserveAccountFundsEntity);
    expect(persistSpy).toBeCalledTimes(1);
  });
});
