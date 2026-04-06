import { QueryCriteria } from '@core/data';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { ClientPaymentRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityStubs } from '@module-persistence/test';
import { FindClientPaymentsQuery } from '../find-client-payments.query';
import { FindClientPaymentsQueryHandler } from './find-client-payments.query-handler';

describe('Find Client Payments Query Handler', () => {
  let queryHandler: FindClientPaymentsQueryHandler;
  let repository: ClientPaymentRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FindClientPaymentsQueryHandler, mockMikroORMProvider],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    queryHandler = module.get(FindClientPaymentsQueryHandler);
    repository = module.get(ClientPaymentRepository);
  });

  it('Should be defined', () => {
    expect(queryHandler).toBeDefined();
  });

  it('Client payment repository is called', async () => {
    const findByQueryCriteriaSpy = jest
      .spyOn(repository, 'findByQueryCriteria')
      .mockResolvedValueOnce([[EntityStubs.buildStubClientPayment()], 1]);
    await queryHandler.execute(
      new FindClientPaymentsQuery('123', new QueryCriteria()),
    );
    expect(findByQueryCriteriaSpy).toBeCalledTimes(1);
  });
});
