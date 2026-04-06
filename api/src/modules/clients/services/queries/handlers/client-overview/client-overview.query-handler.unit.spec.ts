import { mockMikroORMProvider, mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { EntityStubs } from '@module-persistence/test';
import {
  ClientPaymentEntity,
  ClientPaymentRepository,
  InvoiceRepository,
  Repositories,
  ReserveRepository,
} from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { ClientOverviewQuery } from '../../client-overview.query';
import { ClientOverviewQueryHandler } from './client-overview.query-handler';
import { Loaded } from '@mikro-orm/core';

describe('ClientOverviewQueryHandler', () => {
  const clientPaymentRepository = createMock<ClientPaymentRepository>();
  const reserveRepository = createMock<ReserveRepository>();
  const invoiceRepository = createMock<InvoiceRepository>();

  const repositories = createMock<Repositories>({
    clientPaymentRepository: clientPaymentRepository,
    reserve: reserveRepository,
    invoice: invoiceRepository,
  });

  let handler: ClientOverviewQueryHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientOverviewQueryHandler,
        Repositories,
        mockMikroORMProvider,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(Repositories)
      .useValue(repositories)
      .compile();

    handler = module.get(ClientOverviewQueryHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', async () => {
    expect(handler).toBeDefined();
    expect(repositories).toBeDefined();
    expect(repositories.invoice).toBeDefined();
    expect(repositories.reserve).toBeDefined();
    expect(repositories.clientPaymentRepository).toBeDefined();
  });

  it('Client overview is returned', async () => {
    jest
      .spyOn(reserveRepository, 'getTotalByClient')
      .mockResolvedValueOnce(100);
    jest.spyOn(invoiceRepository, 'count').mockResolvedValue(5);
    jest.spyOn(clientPaymentRepository, 'findOne').mockResolvedValueOnce(
      EntityStubs.buildStubClientPayment({
        id: 'id',
        amount: new Big(100),
      }) as Loaded<ClientPaymentEntity, string>,
    );

    const overview = await handler.execute(new ClientOverviewQuery(''));

    expect(overview.totalReservesAmount.toNumber()).toBe(100);
    expect(overview.invoicesNeedsAttentionCount).toBe(5);
    expect(overview.invoicesPossibleChargebacksCount).toBe(5);
    expect(overview.invoicesProcessingCount).toBe(5);
    expect(overview.lastTransfer?.id).toBe('id');
    expect(overview.lastTransfer?.amount.toNumber()).toBe(100);
  });
});
