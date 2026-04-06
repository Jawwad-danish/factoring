import {
  BrokerEvents,
  ClientEvents,
  EmailEvents,
  InvoiceEvents,
} from '@common/events';
import { PageCriteria, PageResult, QueryCriteria } from '@core/data';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { Invoice } from '@fs-bobtail/factoring/data';
import { createMock } from '@golevelup/ts-jest';
import { BrokerService } from '@module-brokers';
import { buildStubBroker } from '@module-brokers/test';
import { ClientService } from '@module-clients';
import { buildStubClient } from '@module-clients/test';
import { CommandRunner, EventPublisher, QueryRunner } from '@module-cqrs';
import { InvoiceRepository } from '@module-persistence/repositories';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { instanceToPlain } from 'class-transformer';
import { v4 } from 'uuid';
import {
  CompleteInvoiceKpiResponse,
  InvoiceKpiResponse,
  InvoiceMapper,
  PurchaseInvoiceRequest,
} from '../data';
import { INVOICE_ID } from '../mocks';
import {
  builStubInvoice,
  buildStubCreateInvoiceRequest,
  buildStubInvoiceContext,
} from '../tests';
import { DocumentsProcessor } from './documents-processing.service';
import { InvoiceService } from './invoice.service';

const PAGINATION_TOTAL_ITEMS_COUNT = 100;

const mockFindByIdHappyPath = (queryRunner: QueryRunner): jest.SpyInstance => {
  return jest
    .spyOn(queryRunner, 'run')
    .mockResolvedValueOnce(builStubInvoice());
};

const mockFindAllPaginatedHappyPath = (
  queryRunner: QueryRunner,
): jest.SpyInstance => {
  return jest.spyOn(queryRunner, 'run').mockResolvedValueOnce({
    invoiceEntities: [EntityStubs.buildStubInvoice()],
    count: PAGINATION_TOTAL_ITEMS_COUNT,
    totalAmount: 100,
  });
};

describe('InvoiceService', () => {
  let invoicesService: InvoiceService;
  let invoiceRepository: InvoiceRepository;
  let clientService: ClientService;
  let brokerService: BrokerService;
  let queryRunner: QueryRunner;
  let commandRunner: CommandRunner;
  let eventEmitter: EventPublisher;
  const documentsProcessor = createMock<DocumentsProcessor>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockMikroORMProvider,
        InvoiceMapper,
        InvoiceService,
        DocumentsProcessor,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(DocumentsProcessor)
      .useValue(documentsProcessor)
      .compile();

    invoiceRepository = module.get<InvoiceRepository>(InvoiceRepository);
    clientService = module.get<ClientService>(ClientService);
    brokerService = module.get(BrokerService);
    queryRunner = module.get(QueryRunner);
    jest
      .spyOn(clientService, 'getOneById')
      .mockResolvedValue(buildStubClient());
    jest
      .spyOn(clientService, 'findByIds')
      .mockResolvedValue([buildStubClient(), buildStubClient()]);

    jest
      .spyOn(brokerService, 'findOneById')
      .mockResolvedValue(buildStubBroker());
    jest
      .spyOn(brokerService, 'findByIds')
      .mockResolvedValue([buildStubBroker(), buildStubBroker()]);
    invoicesService = module.get<InvoiceService>(InvoiceService);
    commandRunner = module.get(CommandRunner);
    eventEmitter = module.get(EventPublisher);
  });

  afterEach(() => {
    // Using resetAllMocks will basically delete the current
    // implementation for the repository mock and others
    // e.g.: jest.mock('../invoices.repository', () => jest.fn());
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(invoicesService).toBeDefined();
  });

  it('Find by ID is successful if ID is found', async () => {
    const findSpy = mockFindByIdHappyPath(queryRunner);
    const response = await invoicesService.getOneById(INVOICE_ID);

    expect(response).toBeInstanceOf(Invoice);
    expect(findSpy).toBeCalledTimes(1);
  });

  it('Find all paginated is successful', async () => {
    const findAllSpy = mockFindAllPaginatedHappyPath(queryRunner);
    const response = await invoicesService.findAll(
      new QueryCriteria({
        page: new PageCriteria({
          limit: 25,
          page: 1,
        }),
        sort: [],
        filters: [],
      }),
    );

    expect(response).toBeInstanceOf(PageResult);
    expect(response.pagination.page).toBe(1);
    expect(response.pagination.itemsPerPage).toBe(25);
    expect(response.pagination.totalItems).toBe(PAGINATION_TOTAL_ITEMS_COUNT);
    expect(response.pagination.totalPages).toBe(4);
    expect(findAllSpy).toBeCalledTimes(1);
  });

  it('Document is sent to processing after command finished', async () => {
    jest
      .spyOn(commandRunner, 'run')
      .mockResolvedValueOnce(buildStubInvoiceContext({}));
    await invoicesService.create(buildStubCreateInvoiceRequest());
    expect(documentsProcessor.sendToProcess).toBeCalledTimes(1);
  });

  it('Event is emitted when creating an invoice', async () => {
    jest
      .spyOn(commandRunner, 'run')
      .mockResolvedValueOnce(buildStubInvoiceContext({}));
    await invoicesService.create(buildStubCreateInvoiceRequest());
    const emitSpy = jest.spyOn(eventEmitter, 'emit');
    expect(emitSpy).toBeCalledWith(
      InvoiceEvents.CreateInvoice,
      expect.anything(),
    );
  });

  it('Event is emitted when purchasing an invoice', async () => {
    jest
      .spyOn(commandRunner, 'run')
      .mockResolvedValueOnce(buildStubInvoiceContext({}));
    await invoicesService.purchase('invoice_id', new PurchaseInvoiceRequest());
    const emitSpy = jest.spyOn(eventEmitter, 'emit');
    expect(emitSpy).toBeCalledTimes(4);
    expect(emitSpy).toBeCalledWith(
      InvoiceEvents.PurchaseInvoice,
      expect.anything(),
    );
    expect(emitSpy).toBeCalledWith(ClientEvents.Limit, expect.anything());
    expect(emitSpy).toBeCalledWith(EmailEvents.Purchase, expect.anything());
    expect(emitSpy).toBeCalledWith(BrokerEvents.Limit, expect.anything());
  });

  it('BrokerEvents.Limit is emitted for both old and new brokers when invoice broker is changed', async () => {
    const oldBrokerId = v4();
    const newBrokerId = v4();
    const invoiceId = v4();

    const oldInvoice = EntityStubs.buildStubInvoice({
      id: invoiceId,
      brokerId: oldBrokerId,
    });

    const updatedInvoice = EntityStubs.buildStubInvoice({
      id: invoiceId,
      brokerId: newBrokerId,
    });

    jest
      .spyOn(invoiceRepository, 'getOneById')
      .mockResolvedValueOnce(oldInvoice);

    jest.spyOn(commandRunner, 'run').mockResolvedValueOnce(
      buildStubInvoiceContext({
        entity: updatedInvoice,
      }),
    );

    const emitSpy = jest.spyOn(eventEmitter, 'emit');

    await invoicesService.update(invoiceId, {});

    expect(emitSpy).toBeCalledWith(
      BrokerEvents.Limit,
      expect.objectContaining({ brokerId: oldBrokerId }),
    );
    expect(emitSpy).toBeCalledWith(
      BrokerEvents.Limit,
      expect.objectContaining({ brokerId: newBrokerId }),
    );
  });

  it('BrokerEvents.Limit is emitted only for new broker when invoice had no previous broker', async () => {
    const newBrokerId = v4();
    const invoiceId = v4();

    const oldInvoice = EntityStubs.buildStubInvoice({
      id: invoiceId,
      brokerId: null,
    });

    const updatedInvoice = EntityStubs.buildStubInvoice({
      id: invoiceId,
      brokerId: newBrokerId,
    });

    jest
      .spyOn(invoiceRepository, 'getOneById')
      .mockResolvedValueOnce(oldInvoice);

    jest.spyOn(commandRunner, 'run').mockResolvedValueOnce(
      buildStubInvoiceContext({
        entity: updatedInvoice,
      }),
    );

    const emitSpy = jest.spyOn(eventEmitter, 'emit');

    await invoicesService.update(invoiceId, {});

    expect(emitSpy).toBeCalledWith(
      BrokerEvents.Limit,
      expect.objectContaining({ brokerId: newBrokerId }),
    );
    expect(emitSpy).not.toBeCalledWith(
      BrokerEvents.Limit,
      expect.objectContaining({ brokerId: null }),
    );
  });

  it('BrokerEvents.Limit is not emitted when broker is not changed', async () => {
    const brokerId = v4();
    const invoiceId = v4();

    const oldInvoice = EntityStubs.buildStubInvoice({
      id: invoiceId,
      brokerId: brokerId,
    });

    const updatedInvoice = EntityStubs.buildStubInvoice({
      id: invoiceId,
      brokerId: brokerId,
    });

    jest
      .spyOn(invoiceRepository, 'getOneById')
      .mockResolvedValueOnce(oldInvoice);

    jest.spyOn(commandRunner, 'run').mockResolvedValueOnce(
      buildStubInvoiceContext({
        entity: updatedInvoice,
      }),
    );

    const emitSpy = jest.spyOn(eventEmitter, 'emit');

    await invoicesService.update(invoiceId, {});

    const brokerLimitCalls = emitSpy.mock.calls.filter(
      (call) => call[0] === BrokerEvents.Limit,
    );
    expect(brokerLimitCalls).toHaveLength(0);
  });

  it('should return correct KPIs', async () => {
    const clientId = v4();
    const invoiceValue = new Big(1000);

    jest
      .spyOn(invoiceRepository, 'getTotalPurchasedInvoicesByClientId')
      .mockResolvedValue(invoiceValue);

    jest
      .spyOn(invoiceRepository, 'getTotalUnderReviewInvoicesByClientId')
      .mockResolvedValue(invoiceValue);

    jest
      .spyOn(invoiceRepository, 'getTotalInvoicesWithIssuesByClientId')
      .mockResolvedValue(invoiceValue);

    const expectedKpis = new InvoiceKpiResponse(
      invoiceValue,
      invoiceValue,
      invoiceValue,
    );

    const kpis = await invoicesService.getProcessingInvoicesKpis(clientId);

    expect(instanceToPlain(kpis)).toEqual(instanceToPlain(expectedKpis));
    expect(
      invoiceRepository.getTotalPurchasedInvoicesByClientId,
    ).toBeCalledWith(clientId);
    expect(
      invoiceRepository.getTotalUnderReviewInvoicesByClientId,
    ).toBeCalledWith(clientId);
    expect(
      invoiceRepository.getTotalInvoicesWithIssuesByClientId,
    ).toBeCalledWith(clientId);
  });

  it('should return correct completed invoice KPIs by client ID', async () => {
    const clientId = v4();
    const kpis = {
      accountsReceivable0to30: new Big(500),
      accountsReceivable30to60: new Big(1000),
      accountsReceivableOver60: new Big(1500),
      accountsReceivableTotal: new Big(3000),
    };

    jest
      .spyOn(invoiceRepository, 'getCompletedInvoiceKpisByClientId')
      .mockResolvedValue(kpis);

    const expectedKpis = new CompleteInvoiceKpiResponse(
      kpis.accountsReceivable0to30,
      kpis.accountsReceivable30to60,
      kpis.accountsReceivableOver60,
      kpis.accountsReceivableTotal,
    );

    const result = await invoicesService.getCompletedInvoiceKpisByClientId(
      clientId,
    );

    expect(instanceToPlain(result)).toEqual(instanceToPlain(expectedKpis));
    expect(invoiceRepository.getCompletedInvoiceKpisByClientId).toBeCalledWith(
      clientId,
    );
  });
});
