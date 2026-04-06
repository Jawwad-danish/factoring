import { PageCriteria, QueryCriteria } from '@core/data';
import { mockToken } from '@core/test';
import { ClientBatchPaymentRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { FindCompletedTransfersQuery } from '../../find-completed-transfers.query';
import { FindCompletedTransfersQueryHandler } from './find-completed-transfers.query-handler';
import { EntityStubs } from '@module-persistence/test';

describe('FindCompletedTransfersQueryHandler', () => {
  let clientBatchPaymentRepository: ClientBatchPaymentRepository;
  let handler: FindCompletedTransfersQueryHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FindCompletedTransfersQueryHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    clientBatchPaymentRepository = module.get(ClientBatchPaymentRepository);
    handler = module.get(FindCompletedTransfersQueryHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should find by query criteria', async () => {
    const findByQueryCriteriaSpy = jest
      .spyOn(clientBatchPaymentRepository, 'findAll')
      .mockResolvedValueOnce([[EntityStubs.buildStubClientBatchPayment()], 1]);

    const result = await handler.execute(
      new FindCompletedTransfersQuery(
        new QueryCriteria({
          page: new PageCriteria({
            limit: 25,
            page: 1,
          }),
          sort: [],
          filters: [],
        }),
      ),
    );

    expect(findByQueryCriteriaSpy).toBeCalledTimes(1);
    expect(result.batchPayments.length).toBe(1);
    expect(result.count).toBe(1);
  });
});
