import { BrokerLimitEvent } from '@common';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { DatabaseService } from '@module-database';
import { Test, TestingModule } from '@nestjs/testing';
import { TagInvoicesBrokerLimitChangeEventHandler } from './tag-invoices.broker-limit-change.event-handler';

describe('InvoiceTagBrokerLimitChangeEventHandler', () => {
  let handler: TagInvoicesBrokerLimitChangeEventHandler;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagInvoicesBrokerLimitChangeEventHandler,
        mockMikroORMProvider,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get(TagInvoicesBrokerLimitChangeEventHandler);
    databaseService = module.get(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should handle the event and call update method', async () => {
    const event: BrokerLimitEvent = { brokerId: '123' };

    jest
      .spyOn(databaseService, 'withRequestContext')
      .mockImplementation(async (callback) => {
        await callback();
      });

    const updateSpy = jest
      .spyOn(handler, 'update')
      .mockResolvedValueOnce(undefined);

    await handler.handle(event);

    expect(databaseService.withRequestContext).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledWith(event);
  });
});
