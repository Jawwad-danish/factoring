import { mockMikroORMProvider, mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { ClientApi } from '@module-clients';
import { buildStubClient } from '@module-clients/test';
import { DatabaseService } from '@module-database';
import { AuditLogEntity, AuditLogType } from '@module-persistence/entities';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { BrokerPaymentDeletedEvent } from '../../../data';
import { BrokerPaymentDeletedAuditLogEventHandler } from './broker-payment-deleted-audit-log.event-handler';

describe('BrokerPaymentDeletedAuditLogEventHandler', () => {
  let entityManager: EntityManager;
  let clientApi: ClientApi;
  let databaseService: DatabaseService;
  let handler: BrokerPaymentDeletedAuditLogEventHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockMikroORMProvider,
        BrokerPaymentDeletedAuditLogEventHandler,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    entityManager = createMock<EntityManager>();
    clientApi = module.get(ClientApi);
    databaseService = module.get(DatabaseService);
    handler = module.get(BrokerPaymentDeletedAuditLogEventHandler);
    mockDatabaseService();
  });

  const mockDatabaseService = () => {
    jest
      .spyOn(databaseService, 'withRequestContext')
      .mockImplementation(async (callback: () => Promise<any>) => {
        return await callback();
      });
    jest
      .spyOn(databaseService, 'getEntityManager')
      .mockReturnValue(entityManager);
  };

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should persist audit log', async () => {
    const brokerPayment = EntityStubs.buildStubBrokerPayment({
      checkNumber: 'check',
    });
    jest
      .spyOn(entityManager, 'findOneOrFail')
      .mockResolvedValueOnce(brokerPayment);
    jest.spyOn(clientApi, 'findById').mockResolvedValue(buildStubClient());
    await handler.handleBrokerPaymentCreate(new BrokerPaymentDeletedEvent(''));

    expect(entityManager.persist).toBeCalledTimes(1);

    const persistArguments = jest.spyOn(entityManager, 'persist').mock.calls[0];
    expect(persistArguments[0]).toBeInstanceOf(AuditLogEntity);

    const auditLog = persistArguments[0] as AuditLogEntity;
    expect(auditLog.type).toBe(AuditLogType.BrokerPayment);
    expect(auditLog.payload).toEqual({
      operation: 'delete',
      invoiceId: brokerPayment.invoice.id,
      invoiceNumber: brokerPayment.invoice.displayId,
      invoiceCreationDate: brokerPayment.invoice.createdAt,
      brokerPaymentId: brokerPayment.id,
      brokerPaymentAmount: brokerPayment.amount,
      brokerPaymentCreationDate: brokerPayment.createdAt,
      brokerPaymentBatchDate: brokerPayment.batchDate,
      brokerPaymentCheckNumber: brokerPayment.checkNumber,
      brokerPaymentType: brokerPayment.type,
    });
  });
});
