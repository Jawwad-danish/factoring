import { EntityNotFoundError } from '@core/errors';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { BrokerService } from '@module-brokers';
import { InvoiceService } from '@module-invoices';
import { RecordStatus } from '@module-persistence/entities';
import { PendingBuyoutRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { buildStubBroker } from '../../../../../brokers/test';
import { buildStubInvoiceContext } from '../../../../../invoices/tests';
import { EntityStubs } from '../../../../../persistence';
import { BulkPurchaseCommand } from '../../bulk-purchase.command';
import { BulkPurchaseCommandHandler } from './bulk-purchase.command-handler';

describe('BulkPurchaseCommandHandler', () => {
  let handler: BulkPurchaseCommandHandler;
  const buyoutsRepository = createMock<PendingBuyoutRepository>();
  const brokerService = createMock<BrokerService>();
  const invoiceService = createMock<InvoiceService>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockMikroORMProvider,
        BulkPurchaseCommandHandler,
        PendingBuyoutRepository,
        BrokerService,
        InvoiceService,
      ],
    })
      .overrideProvider(PendingBuyoutRepository)
      .useValue(buyoutsRepository)
      .overrideProvider(BrokerService)
      .useValue(brokerService)
      .overrideProvider(InvoiceService)
      .useValue(invoiceService)
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get(BulkPurchaseCommandHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should fetch active buyouts, create invoices, and mark buyouts as inactive', async () => {
      const pendingBuyout = EntityStubs.buildStubPendingBuyout({
        recordStatus: RecordStatus.Active,
        brokerMC: '123',
        brokerName: 'Broker Name',
      });
      const broker = buildStubBroker();
      const invoiceEntity = EntityStubs.buildStubInvoice();

      buyoutsRepository.findAll.mockResolvedValue([[pendingBuyout], 1]);

      brokerService.findOneByMC.mockResolvedValue(broker);

      const contextMock = buildStubInvoiceContext({ entity: invoiceEntity });

      invoiceService.create.mockResolvedValue(contextMock);

      const result = await handler.execute(new BulkPurchaseCommand());

      expect(buyoutsRepository.findAll).toHaveBeenCalledWith({
        recordStatus: RecordStatus.Active,
      });
      expect(brokerService.findOneByMC).toHaveBeenCalledWith(
        pendingBuyout.brokerMC,
      );
      expect(invoiceService.create).toHaveBeenCalledTimes(1);

      expect(pendingBuyout.recordStatus).toBe(RecordStatus.Inactive);
      expect(result).toEqual([contextMock]);
    });

    it('If no broker mc is provided, should try to find broker by name', async () => {
      const pendingBuyout = EntityStubs.buildStubPendingBuyout({
        recordStatus: RecordStatus.Active,
        brokerName: 'Broker Name',
      });
      pendingBuyout.brokerMC = null;
      const broker = buildStubBroker();
      const invoiceEntity = EntityStubs.buildStubInvoice();

      buyoutsRepository.findAll.mockResolvedValue([[pendingBuyout], 1]);

      brokerService.findOneByName.mockResolvedValue(broker);

      const contextMock = buildStubInvoiceContext({ entity: invoiceEntity });

      invoiceService.create.mockResolvedValue(contextMock);

      const result = await handler.execute(new BulkPurchaseCommand());

      expect(buyoutsRepository.findAll).toHaveBeenCalledWith({
        recordStatus: RecordStatus.Active,
      });
      expect(brokerService.findOneByName).toHaveBeenCalledWith(
        pendingBuyout.brokerName,
      );
      expect(invoiceService.create).toHaveBeenCalledTimes(1);

      expect(pendingBuyout.recordStatus).toBe(RecordStatus.Inactive);
      expect(result).toEqual([contextMock]);
    });

    it('If broker mc is provided but could not find by mc, should try to find broker by name', async () => {
      const pendingBuyout = EntityStubs.buildStubPendingBuyout({
        recordStatus: RecordStatus.Active,
        brokerName: 'Broker Name',
      });
      pendingBuyout.brokerMC = '123';
      const broker = buildStubBroker();
      const invoiceEntity = EntityStubs.buildStubInvoice();

      buyoutsRepository.findAll.mockResolvedValue([[pendingBuyout], 1]);

      brokerService.findOneByMC.mockResolvedValue(null);
      brokerService.findOneByName.mockResolvedValue(broker);

      const contextMock = buildStubInvoiceContext({ entity: invoiceEntity });

      invoiceService.create.mockResolvedValue(contextMock);

      const result = await handler.execute(new BulkPurchaseCommand());

      expect(buyoutsRepository.findAll).toHaveBeenCalledWith({
        recordStatus: RecordStatus.Active,
      });
      expect(brokerService.findOneByName).toHaveBeenCalledWith(
        pendingBuyout.brokerName,
      );
      expect(invoiceService.create).toHaveBeenCalledTimes(1);

      expect(pendingBuyout.recordStatus).toBe(RecordStatus.Inactive);
      expect(result).toEqual([contextMock]);
    });

    it('should throw error if broker is not found', async () => {
      const pendingBuyout = EntityStubs.buildStubPendingBuyout({
        recordStatus: RecordStatus.Active,
      });
      buyoutsRepository.findAll.mockResolvedValue([[pendingBuyout], 1]);
      brokerService.findOneByMC.mockResolvedValue(null);
      brokerService.findOneByName.mockResolvedValue(null);
      await expect(
        handler.execute(new BulkPurchaseCommand()),
      ).rejects.toThrowError(EntityNotFoundError);
    });
  });
});
