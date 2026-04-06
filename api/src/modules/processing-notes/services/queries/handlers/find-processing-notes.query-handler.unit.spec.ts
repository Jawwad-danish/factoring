import { FilterOperator, QueryCriteria } from '@core/data';
import { mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import {
  InvoiceRepository,
  ProcessingNotesEntity,
  ProcessingNotesRepository,
} from '@module-persistence';
import { RecordStatus } from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { FindProcessingNotesFilterCriteria } from '../../../data';
import { FindProcessingNotesQuery } from '../find-processing-notes.query';
import { FindProcessingNotesQueryHandler } from './find-processing-notes.query-handler';
import { EntityStubs } from '@module-persistence/test';

describe('Find Processing Notes Query Handler', () => {
  const processingNotesRepository = createMock<ProcessingNotesRepository>();
  const invoiceRepository = createMock<InvoiceRepository>();
  let handler: FindProcessingNotesQueryHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindProcessingNotesQueryHandler,
        ProcessingNotesRepository,
        InvoiceRepository,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(ProcessingNotesRepository)
      .useValue(processingNotesRepository)
      .overrideProvider(InvoiceRepository)
      .useValue(invoiceRepository)
      .compile();

    handler = module.get(FindProcessingNotesQueryHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return processing notes with count', async () => {
      const mockEntities: ProcessingNotesEntity[] = [
        EntityStubs.buildStubProcessingNotes(),
        EntityStubs.buildStubProcessingNotes(),
      ];
      const mockCount = 2;
      const mockCriteria = new QueryCriteria();

      processingNotesRepository.findByQueryCriteria.mockResolvedValueOnce([
        mockEntities,
        mockCount,
      ]);

      const result = await handler.execute(
        new FindProcessingNotesQuery(mockCriteria),
      );

      expect(result.entities).toEqual(mockEntities);
      expect(result.count).toEqual(mockCount);
      expect(
        processingNotesRepository.findByQueryCriteria,
      ).toHaveBeenCalledWith(
        mockCriteria,
        expect.objectContaining({
          additionalWhereClause: { recordStatus: RecordStatus.Active },
          knownFilterCriteriaOptions: expect.any(Object),
          populate: ['createdBy'],
        }),
      );
    });
  });

  describe('generateWhereClause', () => {
    it('should generate where clause with client general, broker general, and client-broker notes when invoice has broker ID', async () => {
      const mockInvoiceId = UUID.get();
      const mockClientId = UUID.get();
      const mockBrokerId = UUID.get();
      const filterCriteria = new FindProcessingNotesFilterCriteria();
      filterCriteria.invoiceId = {
        value: mockInvoiceId,
        operator: FilterOperator.EQ,
      };

      invoiceRepository.getOneById.mockResolvedValueOnce(
        EntityStubs.buildStubInvoice({
          id: mockInvoiceId,
          clientId: mockClientId,
          brokerId: mockBrokerId,
        }),
      );

      const result = await handler.generateWhereClause(filterCriteria);

      expect(result).toEqual({
        $or: [
          { clientId: mockClientId, brokerId: null },
          { brokerId: mockBrokerId, clientId: null },
          { brokerId: mockBrokerId, clientId: mockClientId },
        ],
      });
      expect(invoiceRepository.getOneById).toHaveBeenCalledWith(mockInvoiceId);
    });

    it('should generate where clause with only client general notes when invoice has no broker ID', async () => {
      const mockInvoiceId = UUID.get();
      const mockClientId = UUID.get();
      const filterCriteria = new FindProcessingNotesFilterCriteria();
      filterCriteria.invoiceId = {
        value: mockInvoiceId,
        operator: FilterOperator.EQ,
      };

      invoiceRepository.getOneById.mockResolvedValueOnce(
        EntityStubs.buildStubInvoice({
          id: mockInvoiceId,
          clientId: mockClientId,
          brokerId: null,
        }),
      );

      const result = await handler.generateWhereClause(filterCriteria);

      expect(result).toEqual({
        $or: [
          {
            clientId: mockClientId,
            brokerId: null,
          },
        ],
      });
      expect(invoiceRepository.getOneById).toHaveBeenCalledWith(mockInvoiceId);
    });

    it('should return empty where clause when no filters are provided', async () => {
      const filterCriteria = new FindProcessingNotesFilterCriteria();

      const result = await handler.generateWhereClause(filterCriteria);

      expect(result).toEqual({});
    });
  });
});
