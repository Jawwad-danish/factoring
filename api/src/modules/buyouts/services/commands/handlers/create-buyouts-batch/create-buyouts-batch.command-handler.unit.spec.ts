import { mockToken } from '@core/test';
import {
  PendingBuyoutRepository,
  PendingBuyoutsBatchRepository,
} from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { buildStubCreateBuyoutsBatchRequest } from '../../../../test';
import { CreateBuyoutsBatchCommand } from '../../create-buyouts-batch.command';
import { CreateBuyoutsBatchCommandHandler } from './create-buyouts-batch.command-handler';
import { createMock } from '@golevelup/ts-jest';
import { QueryBuilder } from '@mikro-orm/postgresql';
import {
  PendingBuyoutEntity,
  PendingBuyoutsBatchEntity,
  RecordStatus,
} from '@module-persistence';

describe('CreateBuyoutsBatchCommandHandler', () => {
  const batchQueryBuilderMock = createMock<
    QueryBuilder<PendingBuyoutsBatchEntity>
  >({
    update: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affectedRows: 1 }),
  });
  const pendingBuyoutsBatchRepository =
    createMock<PendingBuyoutsBatchRepository>();

  pendingBuyoutsBatchRepository.queryBuilder.mockReturnValue(
    batchQueryBuilderMock,
  );

  const buyoutQueryBuilderMock = createMock<QueryBuilder<PendingBuyoutEntity>>({
    update: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affectedRows: 1 }),
  });
  const pendingBuyoutRepository = createMock<PendingBuyoutRepository>();
  pendingBuyoutRepository.queryBuilder.mockImplementation(() => {
    return buyoutQueryBuilderMock;
  });
  let handler: CreateBuyoutsBatchCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateBuyoutsBatchCommandHandler,
        PendingBuyoutsBatchRepository,
        PendingBuyoutRepository,
      ],
    })

      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(PendingBuyoutsBatchRepository)
      .useValue(pendingBuyoutsBatchRepository)
      .overrideProvider(PendingBuyoutRepository)
      .useValue(pendingBuyoutRepository)
      .compile();

    handler = module.get(CreateBuyoutsBatchCommandHandler);
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Save to database is called', async () => {
    await handler.execute(
      new CreateBuyoutsBatchCommand(
        buildStubCreateBuyoutsBatchRequest({
          batch: [],
        }),
      ),
    );

    expect(batchQueryBuilderMock.update).toHaveBeenCalledWith({
      recordStatus: RecordStatus.Inactive,
    });

    expect(buyoutQueryBuilderMock.update).toHaveBeenCalledWith({
      recordStatus: RecordStatus.Inactive,
    });

    expect(batchQueryBuilderMock.execute).toBeCalledTimes(1);
    expect(buyoutQueryBuilderMock.execute).toBeCalledTimes(1);
    expect(pendingBuyoutsBatchRepository.persist).toBeCalledTimes(1);
  });
});
