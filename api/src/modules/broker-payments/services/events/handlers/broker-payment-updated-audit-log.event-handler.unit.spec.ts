import { mockMikroORMProvider, mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { ClientApi } from '@module-clients';
import { buildStubClient } from '@module-clients/test';
import { DatabaseService } from '@module-database';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AuditLogEntity,
  AuditLogType,
  BrokerPaymentType,
} from '../../../../persistence';
import { BrokerPaymentState, BrokerPaymentUpdatedEvent } from '../../../data';
import { BrokerPaymentUpdatedAuditLogEventHandler } from './broker-payment-updated-audit-log.event-handler';

describe('BrokerPaymentUpdatedAuditLogEventHandler', () => {
  let entityManager: EntityManager;
  let clientApi: ClientApi;
  let databaseService: DatabaseService;
  let handler: BrokerPaymentUpdatedAuditLogEventHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockMikroORMProvider,
        BrokerPaymentUpdatedAuditLogEventHandler,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    entityManager = createMock<EntityManager>();
    clientApi = module.get(ClientApi);
    databaseService = module.get(DatabaseService);
    handler = module.get(BrokerPaymentUpdatedAuditLogEventHandler);
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
      invoice: EntityStubs.buildStubInvoice(),
    });
    jest
      .spyOn(entityManager, 'findOneOrFail')
      .mockResolvedValueOnce(brokerPayment);
    jest.spyOn(clientApi, 'findById').mockResolvedValue(buildStubClient());

    const previousState = {
      type: BrokerPaymentType.Ach,
      checkNumber: null,
      batchDate: new Date(),
    };
    await handler.handleBrokerPaymentUpdate(
      new BrokerPaymentUpdatedEvent('', previousState),
    );

    expect(entityManager.persist).toBeCalledTimes(1);

    const persistArguments = jest.spyOn(entityManager, 'persist').mock.calls[0];
    expect(persistArguments[0]).toBeInstanceOf(AuditLogEntity);

    const auditLog = persistArguments[0] as AuditLogEntity;
    expect(auditLog.type).toBe(AuditLogType.BrokerPayment);
    expect(auditLog.payload).toEqual({
      operation: 'edit',
      invoiceId: brokerPayment.invoice.id,
      invoiceCreationDate: brokerPayment.invoice.createdAt,
      invoiceNumber: brokerPayment.invoice.displayId,
      brokerPaymentId: brokerPayment.id,
      brokerPaymentCreationDate: brokerPayment.createdAt,
      brokerPaymentBatchDate: brokerPayment.batchDate,
      brokerPaymentCheckNumber: brokerPayment.checkNumber,
      brokerPaymentType: brokerPayment.type,
      brokerPaymentAmount: brokerPayment.amount,
      previousBrokerPaymentCheckNumber: previousState.checkNumber,
      previousBrokerPaymentBatchDate: previousState.batchDate,
      previousBrokerPaymentType: previousState.type,
    });
  });

  it('should build notes correctly when transaction type changes from ACH to Check', async () => {
    const client = buildStubClient();
    const brokerPayment = EntityStubs.buildStubBrokerPayment({
      invoice: EntityStubs.buildStubInvoice(),
      type: BrokerPaymentType.Check,
      checkNumber: '123456',
      batchDate: new Date(),
    });
    jest
      .spyOn(entityManager, 'findOneOrFail')
      .mockResolvedValueOnce(brokerPayment);
    jest.spyOn(clientApi, 'findById').mockResolvedValue(client);

    const previousState: BrokerPaymentState = {
      type: BrokerPaymentType.Ach,
      checkNumber: null,
      batchDate: new Date(),
    };
    await handler.handleBrokerPaymentUpdate(
      new BrokerPaymentUpdatedEvent('', previousState),
    );

    expect(entityManager.persist).toBeCalledTimes(1);

    const persistArguments = jest.spyOn(entityManager, 'persist').mock.calls[0];
    expect(persistArguments[0]).toBeInstanceOf(AuditLogEntity);

    const auditLog = persistArguments[0] as AuditLogEntity;
    expect(auditLog.notes).toEqual([
      `${client.name}.`,
      `Changed transaction type from ${previousState.type} to ${brokerPayment.type}.`,
      `Set Check Number to ${brokerPayment.checkNumber}.`,
    ]);
  });

  it('should build notes correctly when transaction type changes from Check to ACH', async () => {
    const client = buildStubClient();
    const brokerPayment = EntityStubs.buildStubBrokerPayment({
      invoice: EntityStubs.buildStubInvoice(),
      type: BrokerPaymentType.Ach,
      batchDate: new Date(),
    });
    jest
      .spyOn(entityManager, 'findOneOrFail')
      .mockResolvedValueOnce(brokerPayment);
    jest.spyOn(clientApi, 'findById').mockResolvedValue(client);

    const previousState: BrokerPaymentState = {
      type: BrokerPaymentType.Check,
      checkNumber: '123456',
      batchDate: new Date(),
    };
    await handler.handleBrokerPaymentUpdate(
      new BrokerPaymentUpdatedEvent('', previousState),
    );

    expect(entityManager.persist).toBeCalledTimes(1);

    const persistArguments = jest.spyOn(entityManager, 'persist').mock.calls[0];
    expect(persistArguments[0]).toBeInstanceOf(AuditLogEntity);

    const auditLog = persistArguments[0] as AuditLogEntity;
    expect(auditLog.notes).toEqual([
      `${client.name}.`,
      `Changed transaction type from ${previousState.type} to ${brokerPayment.type}.`,
      `Removed Check Number ${previousState.checkNumber}.`,
    ]);
  });
});
