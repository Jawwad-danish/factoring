import { mockToken } from '@core/test';
import { EntityStubs } from '@module-persistence/test';
import { PendingBuyoutRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { UpdateBuyoutRequest } from '@fs-bobtail/factoring/data';
import { UpdateBuyoutCommand } from '../../update-buyout.command';
import { UpdateBuyoutCommandHandler } from './update-buyout.command-handler';
import { UpdateBuyoutRequestBuilder } from '@module-buyouts/test';

describe('UpdateBuyoutCommandHandler', () => {
  let pendingBuyoutRepository: PendingBuyoutRepository;
  let handler: UpdateBuyoutCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateBuyoutCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    pendingBuyoutRepository = module.get(PendingBuyoutRepository);
    handler = module.get(UpdateBuyoutCommandHandler);
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Should update payment date', async () => {
    const date = new Date('2000-01-01');
    jest
      .spyOn(pendingBuyoutRepository, 'getOneById')
      .mockResolvedValueOnce(EntityStubs.buildStubPendingBuyout());
    const result = await handler.execute(
      new UpdateBuyoutCommand(
        '',
        UpdateBuyoutRequestBuilder.from({ paymentDate: date }),
      ),
    );
    expect(result.paymentDate).toBe(date);
  });

  it('Should update load number', async () => {
    jest
      .spyOn(pendingBuyoutRepository, 'getOneById')
      .mockResolvedValueOnce(EntityStubs.buildStubPendingBuyout());
    const result = await handler.execute(
      new UpdateBuyoutCommand(
        '',
        UpdateBuyoutRequestBuilder.from({ loadNumber: 'NEW-LOAD-123' }),
      ),
    );
    expect(result.loadNumber).toBe('NEW-LOAD-123');
  });

  it('Should update rate', async () => {
    const newRate = Big(250);
    jest
      .spyOn(pendingBuyoutRepository, 'getOneById')
      .mockResolvedValueOnce(EntityStubs.buildStubPendingBuyout());
    const result = await handler.execute(
      new UpdateBuyoutCommand(
        '',
        UpdateBuyoutRequestBuilder.from({ rate: newRate }),
      ),
    );
    expect(result.rate).toEqual(newRate);
  });

  it('Should update broker name', async () => {
    jest
      .spyOn(pendingBuyoutRepository, 'getOneById')
      .mockResolvedValueOnce(EntityStubs.buildStubPendingBuyout());
    const result = await handler.execute(
      new UpdateBuyoutCommand(
        '',
        UpdateBuyoutRequestBuilder.from({ brokerName: 'New Broker' }),
      ),
    );
    expect(result.brokerName).toBe('New Broker');
  });

  it('Should update multiple fields at once', async () => {
    const date = new Date('2025-06-15');
    const rate = Big(500);
    jest
      .spyOn(pendingBuyoutRepository, 'getOneById')
      .mockResolvedValueOnce(EntityStubs.buildStubPendingBuyout());
    const result = await handler.execute(
      new UpdateBuyoutCommand(
        '',
        UpdateBuyoutRequestBuilder.from({
          loadNumber: 'MULTI-001',
          paymentDate: date,
          rate,
          brokerName: 'Multi Broker',
        }),
      ),
    );
    expect(result.loadNumber).toBe('MULTI-001');
    expect(result.paymentDate).toBe(date);
    expect(result.rate).toEqual(rate);
    expect(result.brokerName).toBe('Multi Broker');
  });

  it('Should not modify fields that are not provided', async () => {
    const existingBuyout = EntityStubs.buildStubPendingBuyout({
      loadNumber: 'ORIGINAL',
      brokerName: 'Original Broker',
      rate: Big(100),
    });
    jest
      .spyOn(pendingBuyoutRepository, 'getOneById')
      .mockResolvedValueOnce(existingBuyout);
    const result = await handler.execute(
      new UpdateBuyoutCommand(
        '',
        new UpdateBuyoutRequest({ paymentDate: new Date('2025-01-01') }),
      ),
    );
    expect(result.loadNumber).toBe('ORIGINAL');
    expect(result.brokerName).toBe('Original Broker');
    expect(result.rate).toEqual(Big(100));
  });
});
