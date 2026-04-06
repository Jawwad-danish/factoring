import { EntityNotFoundError } from '@core/errors';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { Loaded } from '@mikro-orm/core';
import { ClientPaymentEntity } from '@module-persistence';
import { ClientPaymentRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityStubs } from '@module-persistence/test';
import { FindClientPaymentQuery } from '../find-client-payment.query';
import { FindClientPaymentQueryHandler } from './find-client-payment.query-handler';

describe('FindClientPaymentQueryHandler', () => {
  let handler: FindClientPaymentQueryHandler;
  let repository: ClientPaymentRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FindClientPaymentQueryHandler, mockMikroORMProvider],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get(FindClientPaymentQueryHandler);
    repository = module.get(ClientPaymentRepository);
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Client payment entity is returned if found', async () => {
    const clientPayment = EntityStubs.buildStubClientPayment() as Loaded<
      ClientPaymentEntity,
      string
    >;
    jest.spyOn(repository, 'findOne').mockResolvedValueOnce(clientPayment);

    const result = await handler.execute(new FindClientPaymentQuery('', ''));

    expect(result.clientPaymentEntity.id).toBe(clientPayment.id);
  });

  it('When client payment is not found exception is thrown', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

    expect(
      handler.execute(new FindClientPaymentQuery('', '')),
    ).rejects.toThrowError(EntityNotFoundError);
  });
});
