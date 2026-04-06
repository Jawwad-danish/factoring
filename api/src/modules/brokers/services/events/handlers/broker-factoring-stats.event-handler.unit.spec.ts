import { mockMikroORMProvider, mockToken } from '@core/test';

import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { BrokerPaymentCreatedEvent } from '@module-broker-payments/data';
import { CommandRunner } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import {
  CreateInvoiceEvent,
  PurchaseInvoiceEvent,
} from '@module-invoices/data';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { BrokerFactoringStatsEventHandler } from './broker-factoring-stats.event-handler';

describe('Factoring stats - Broker payment create event handler', () => {
  let entityManager: EntityManager;
  let eventHandler: BrokerFactoringStatsEventHandler;
  let databaseService: DatabaseService;
  let commandRunner: CommandRunner;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BrokerFactoringStatsEventHandler, mockMikroORMProvider],
    })
      .useMocker((token) => {
        return mockToken(token);
      })

      .compile();

    eventHandler = module.get(BrokerFactoringStatsEventHandler);
    databaseService = module.get(DatabaseService);
    commandRunner = module.get(CommandRunner);
    entityManager = createMock<EntityManager>();

    jest
      .spyOn(databaseService, 'withRequestContext')
      .mockImplementation(async (callback: () => Promise<any>) => {
        return await callback();
      });
    jest
      .spyOn(databaseService, 'getEntityManager')
      .mockReturnValue(entityManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(eventHandler).toBeDefined();
  });

  it('When create broker payment event is received, broker factoring stats are updated', async () => {
    jest.spyOn(entityManager, 'findOneOrFail').mockResolvedValue(
      EntityStubs.buildStubBrokerPayment({
        invoice: EntityStubs.buildStubInvoice({
          brokerId: 'id',
        }),
      }),
    );
    await eventHandler.handleBrokerPaymentCreate(
      new BrokerPaymentCreatedEvent('id'),
    );
    expect(commandRunner.run).toBeCalledTimes(1);
  });

  it('When create invoice event with broker is received, broker factoring stats are updated', async () => {
    const runSpy = jest.spyOn(commandRunner, 'run');
    await eventHandler.handleInvoiceCreate(
      new CreateInvoiceEvent({
        invoice: EntityStubs.buildStubInvoice({ brokerId: 'id' }),
      }),
    );
    expect(runSpy).toBeCalledTimes(1);
  });

  it('When create invoice event with no broker is received, broker factoring stats are not updated', async () => {
    const runSpy = jest.spyOn(commandRunner, 'run');
    await eventHandler.handleInvoiceCreate(
      new CreateInvoiceEvent({
        invoice: EntityStubs.buildStubInvoice({ brokerId: null }),
      }),
    );
    expect(runSpy).toBeCalledTimes(0);
  });

  it('When purchase invoice event is received, broker factoring stats are updated', async () => {
    const runSpy = jest.spyOn(commandRunner, 'run');
    await eventHandler.handleInvoicePurchase(
      new PurchaseInvoiceEvent({
        brokerId: 'id',
      }),
    );
    expect(runSpy).toBeCalledTimes(1);
  });
});
