import { EntityNotFoundError } from '@core/errors';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { ReserveRepository } from '@module-persistence/repositories';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { FindReserveQuery } from '../find-reserve.query';
import { FindReserveQueryHandler } from './find-reserve.query-handler';

describe('FindReserveQueryHandler', () => {
  let handler: FindReserveQueryHandler;
  let repository: ReserveRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FindReserveQueryHandler, mockMikroORMProvider],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get(FindReserveQueryHandler);
    repository = module.get(ReserveRepository);
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('When reserve is found total amount is calculated an results are returned', async () => {
    const reserve = EntityStubs.buildStubReserve();
    jest.spyOn(repository, 'findOne').mockResolvedValueOnce(reserve);
    jest.spyOn(repository, 'getTotalByClient').mockResolvedValueOnce(10);

    const result = await handler.execute(new FindReserveQuery('', ''));

    expect(result.reserve.id).toBe(reserve.id);
    expect(result.totalAmount).toBe(10);
  });

  it('When reserve is not found exception is thrown', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

    expect(handler.execute(new FindReserveQuery('', ''))).rejects.toThrowError(
      EntityNotFoundError,
    );
  });
});
