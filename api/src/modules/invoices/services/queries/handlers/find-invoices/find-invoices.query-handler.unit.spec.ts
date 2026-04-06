import { FilterOperator, QueryCriteria, SortingOrder } from '@core/data';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { QueryBuilder } from '@mikro-orm/postgresql';
import {
  BrokerPaymentStatus,
  ClientFactoringConfigsEntity,
  ClientFactoringStatus,
  InvoiceStatus,
  RecordStatus,
  TagDefinitionGroupKey,
  TagDefinitionKey,
} from '@module-persistence/entities';
import {
  ClientFactoringConfigsRepository,
  InvoiceRepository,
  ReserveRepository,
} from '@module-persistence/repositories';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { FindInvoicesQuery } from '../../find-invoices.query';
import {
  BuyoutFilterCriteria,
  ClientIdFilterCriteria,
  ClientOperatingBalanceCriteria,
  FindInvoiceFilterCriteria,
  InactiveClientsFilterCriteria,
  InvoiceTagGroupsCriteria,
  InvoiceTagsCriteria,
  NonpaymentFilterCriteria,
  OutstandingFilterCriteria,
  SuccessTeamFilterCriteria,
  TransferFilterCriteria,
  TransferTypeFilterCriteria,
  VipFilterCriteria,
} from './find-invoices.filter-criteria';
import { FindInvoicesQueryHandler } from './find-invoices.query-handler';
import { FindInvoiceSortCriteria } from './find-invoices.sort-criteria';

describe('FindInvoicesQueryHandler', () => {
  let queryHandler: FindInvoicesQueryHandler;
  let invoiceRepository: InvoiceRepository;
  let reserveRepository: ReserveRepository;
  const clientQueryBuilderMock = createMock<
    QueryBuilder<ClientFactoringConfigsEntity>
  >({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    execute: jest
      .fn()
      .mockResolvedValue([EntityStubs.buildClientFactoringConfig({})]),
  });
  const clientFactoringConfigsRepository =
    createMock<ClientFactoringConfigsRepository>({
      queryBuilder: jest.fn().mockReturnValue(clientQueryBuilderMock),
    });

  const mockClientFactoringQbExecuteOnce = (
    data: ClientFactoringConfigsEntity[],
  ): void => {
    clientQueryBuilderMock.execute.mockResolvedValueOnce(data);
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindInvoicesQueryHandler,
        mockMikroORMProvider,
        ClientFactoringConfigsRepository,
      ],
    })
      .overrideProvider(ClientFactoringConfigsRepository)
      .useValue(clientFactoringConfigsRepository)
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    queryHandler = module.get(FindInvoicesQueryHandler);
    invoiceRepository = module.get(InvoiceRepository);
    reserveRepository = module.get(ReserveRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(queryHandler).toBeDefined();
  });

  it('Invoice repository is called', async () => {
    const buildQueryConstraints = jest
      .spyOn(invoiceRepository, 'buildQueryConstraints')
      .mockResolvedValue({
        whereClause: {},
        findOptions: {},
      });
    const getStats = jest
      .spyOn(invoiceRepository, 'getStats')
      .mockResolvedValue({ total: 0, count: 0 });
    const findAll = jest
      .spyOn(invoiceRepository, 'findAll')
      .mockResolvedValue([[], 0]);
    await queryHandler.execute(new FindInvoicesQuery(new QueryCriteria()));
    expect(buildQueryConstraints).toBeCalledTimes(1);
    expect(getStats).toBeCalledTimes(1);
    expect(findAll).toBeCalledTimes(1);
  });

  it(`Filter criteria with outstanding and vip is generated correctly`, async () => {
    const outstandingFromDate = new Date();
    const outstandingToDate = new Date();
    const filterCriteria = new FindInvoiceFilterCriteria({
      vip: new VipFilterCriteria({
        value: true,
        operator: FilterOperator.EQ,
      }),
      outstanding: [
        new OutstandingFilterCriteria({
          operator: FilterOperator.LT,
          value: outstandingToDate,
        }),
        new OutstandingFilterCriteria({
          operator: FilterOperator.GT,
          value: outstandingFromDate,
        }),
      ],
    });

    mockClientFactoringQbExecuteOnce([
      EntityStubs.buildClientFactoringConfig(),
    ]);

    const result = await queryHandler.generateWhereClause(filterCriteria);

    expect(result['brokerPaymentStatus']).toEqual(
      BrokerPaymentStatus.NotReceived,
    );
    expect(result['$and']).toBeDefined();
    const [outstandingCondition] = result['$and'] ?? [];
    expect(outstandingCondition).toEqual({
      $or: [
        {
          buyout: { $eq: null },
          purchasedDate: {
            $lt: outstandingToDate,
            $gt: outstandingFromDate,
          },
        },
        {
          buyout: {
            paymentDate: {
              $lt: outstandingToDate,
              $gt: outstandingFromDate,
            },
          },
        },
      ],
    });
    expect(clientQueryBuilderMock.andWhere).toHaveBeenCalledWith({
      vip: { $eq: true },
    });
    expect(result['brokerPaymentStatus']).toEqual(
      BrokerPaymentStatus.NotReceived,
    );
  });

  it(`Expedited criteria is generated correctly`, async () => {
    const filterCriteria = new FindInvoiceFilterCriteria({
      transfer: new TransferFilterCriteria({
        value: TransferTypeFilterCriteria.Expedited,
        operator: FilterOperator.EQ,
      }),
    });

    const result = await queryHandler.generateWhereClause(filterCriteria);

    expect(result['expedited']).toEqual({
      $eq: true,
    });
  });

  it(`First transfer criteria is generated correctly`, async () => {
    const filterCriteria = new FindInvoiceFilterCriteria({
      transfer: new TransferFilterCriteria({
        value: TransferTypeFilterCriteria.FirstAch,
        operator: FilterOperator.EQ,
      }),
    });

    const result = await queryHandler.generateWhereClause(filterCriteria);

    expect(result['expedited']).toEqual({
      $eq: false,
    });
  });

  it(`Second transfer criteria is generated correctly`, async () => {
    const filterCriteria = new FindInvoiceFilterCriteria({
      transfer: new TransferFilterCriteria({
        value: TransferTypeFilterCriteria.SecondAch,
        operator: FilterOperator.EQ,
      }),
    });

    const result = await queryHandler.generateWhereClause(filterCriteria);

    expect(result['expedited']).toEqual({
      $eq: false,
    });
  });

  it(`Filter criteria with success team ID is generated correctly`, async () => {
    const filterCriteria = new FindInvoiceFilterCriteria({
      successTeamId: new SuccessTeamFilterCriteria({
        value: '123',
        operator: FilterOperator.EQ,
      }),
    });
    const clientSuccessTeamStub = EntityStubs.buildClientSuccessTeam({
      id: '123',
    });
    const clientConfigEntity = EntityStubs.buildClientFactoringConfig({
      clientSuccessTeam: clientSuccessTeamStub,
    });
    mockClientFactoringQbExecuteOnce([clientConfigEntity]);
    const result = await queryHandler.generateWhereClause(filterCriteria);

    expect(clientQueryBuilderMock.andWhere).toHaveBeenCalledWith({
      clientSuccessTeam: { id: { $in: ['123'] } },
    });

    expect(result['clientId']).toEqual({
      $in: [clientConfigEntity.clientId],
    });
  });

  it(`Sort criteria with clients total is generated correctly`, async () => {
    jest.spyOn(invoiceRepository, 'getDefaultPopulate').mockReturnValue([]);
    const sortCriteria = new FindInvoiceSortCriteria({
      clientUnderReviewTotal: {
        name: 'clientUnderReviewTotal',
        order: SortingOrder.ASC,
      },
    });

    const result = await queryHandler.generateFindOptions(sortCriteria);

    expect(result.orderBy).toEqual({
      clientUnderReviewTotal: 'ASC',
    });
    expect(result.populate).toContain('clientUnderReviewTotal');
  });

  it(`Buyout criteria is generated correctly`, async () => {
    const filterCriteria = new FindInvoiceFilterCriteria({
      buyout: new BuyoutFilterCriteria({
        value: true,
        operator: FilterOperator.NOTNULL,
      }),
    });

    const result = await queryHandler.generateWhereClause(filterCriteria);

    expect(result['buyout']).toEqual({
      $ne: null,
    });
  });

  it('Active clients invoices are fetched by default', async () => {
    const filterCriteria = new FindInvoiceFilterCriteria();

    const clientConfigEntity = EntityStubs.buildClientFactoringConfig({
      status: ClientFactoringStatus.Active,
    });
    mockClientFactoringQbExecuteOnce([clientConfigEntity]);
    const result = await queryHandler.generateWhereClause(filterCriteria);

    expect(clientQueryBuilderMock.where).toHaveBeenCalledWith(
      expect.objectContaining({
        status: { $eq: ClientFactoringStatus.Active },
      }),
    );
    expect(result['clientId']).toEqual({
      $in: [clientConfigEntity.clientId],
    });
  });

  it(`Inactive clients is generated correctly`, async () => {
    const filterCriteria = new FindInvoiceFilterCriteria({
      inactiveClients: new InactiveClientsFilterCriteria({
        value: true,
        operator: FilterOperator.EQ,
      }),
    });

    const clientConfigEntity = EntityStubs.buildClientFactoringConfig({
      status: ClientFactoringStatus.Active,
    });
    mockClientFactoringQbExecuteOnce([clientConfigEntity]);
    const result = await queryHandler.generateWhereClause(filterCriteria);

    expect(clientQueryBuilderMock.where).toHaveBeenCalledWith(
      expect.objectContaining({
        status: { $ne: ClientFactoringStatus.Active },
      }),
    );
    expect(result['clientId']).toEqual({
      $in: [clientConfigEntity.clientId],
    });
  });

  it(`Client Id criteria is generated corectly`, async () => {
    const clientId = '1234';
    const filterCriteria = new FindInvoiceFilterCriteria({
      clientId: new ClientIdFilterCriteria({
        value: clientId,
        operator: FilterOperator.EQ,
      }),
    });

    const config = EntityStubs.buildClientFactoringConfig({
      clientId: clientId,
      expediteTransferOnly: false,
    });

    mockClientFactoringQbExecuteOnce([config]);

    const result = await queryHandler.generateWhereClause(filterCriteria);
    expect(clientQueryBuilderMock.andWhere).toBeCalledWith({
      clientId: { $in: [clientId] },
    });

    expect(result['clientId']).toEqual({
      $in: [clientId],
    });
  });

  it(`Client TRUE expedite flag does override transfer`, async () => {
    const filterCriteria = new FindInvoiceFilterCriteria({
      clientId: new ClientIdFilterCriteria({
        value: '1234',
        operator: FilterOperator.EQ,
      }),
      transfer: new TransferFilterCriteria({
        value: TransferTypeFilterCriteria.SecondAch,
        operator: FilterOperator.EQ,
      }),
    });

    jest
      .spyOn(clientFactoringConfigsRepository, 'getOneByClientId')
      .mockResolvedValue(
        EntityStubs.buildClientFactoringConfig({ expediteTransferOnly: true }),
      );

    const result = await queryHandler.generateWhereClause(filterCriteria);

    expect(result['expedited']).toEqual({
      $eq: true,
    });
  });

  it(`Client FALSE expedite flag does not override ach transfer`, async () => {
    const filterCriteria = new FindInvoiceFilterCriteria({
      clientId: new ClientIdFilterCriteria({
        value: '1234',
        operator: FilterOperator.EQ,
      }),
      transfer: new TransferFilterCriteria({
        value: TransferTypeFilterCriteria.SecondAch,
        operator: FilterOperator.EQ,
      }),
    });

    jest
      .spyOn(clientFactoringConfigsRepository, 'getOneByClientId')
      .mockResolvedValue(
        EntityStubs.buildClientFactoringConfig({ expediteTransferOnly: false }),
      );

    const result = await queryHandler.generateWhereClause(filterCriteria);

    expect(result['expedited']).toEqual({
      $eq: false,
    });
  });

  it(`Client FALSE expedite flag does not override expedited transfer`, async () => {
    const filterCriteria = new FindInvoiceFilterCriteria({
      clientId: new ClientIdFilterCriteria({
        value: '1234',
        operator: FilterOperator.EQ,
      }),
      transfer: new TransferFilterCriteria({
        value: TransferTypeFilterCriteria.Expedited,
        operator: FilterOperator.EQ,
      }),
    });

    jest
      .spyOn(clientFactoringConfigsRepository, 'getOneByClientId')
      .mockResolvedValue(
        EntityStubs.buildClientFactoringConfig({ expediteTransferOnly: false }),
      );

    const result = await queryHandler.generateWhereClause(filterCriteria);

    expect(result['expedited']).toEqual({
      $eq: true,
    });
  });

  it(`Nonpayment criteria is generated correctly`, async () => {
    const currentDate = new Date();
    const monthsAgo = new Date(
      currentDate.setMonth(currentDate.getMonth() - 6),
    );
    const filterCriteria = new FindInvoiceFilterCriteria({
      nonpayment: new NonpaymentFilterCriteria({
        value: monthsAgo,
        operator: FilterOperator.GT,
      }),
    });

    const result = await queryHandler.generateWhereClause(filterCriteria);

    expect(result['$or']).toBeDefined();
    if (result.$or) {
      const [brokerPaymentFilter, paymentDateFilter] = result.$or;
      expect(brokerPaymentFilter).toStrictEqual({
        brokerPaymentStatus: {
          $eq: BrokerPaymentStatus.NonPayment,
        },
      });
      expect(paymentDateFilter).toStrictEqual({
        paymentDate: {
          $gt: monthsAgo,
        },
      });
    }
  });

  describe(`Client operating balance filter`, () => {
    it('Single filter', async () => {
      const filterCriteria = new FindInvoiceFilterCriteria({
        clientOperatingBalance: new ClientOperatingBalanceCriteria({
          value: Big(3000),
          operator: FilterOperator.GTE,
        }),
      });

      const reserveSpy = jest
        .spyOn(reserveRepository, 'getClientsByBalance')
        .mockResolvedValueOnce(['123']);

      mockClientFactoringQbExecuteOnce([
        EntityStubs.buildClientFactoringConfig({ clientId: '123' }),
      ]);
      const result = await queryHandler.generateWhereClause(filterCriteria);

      expect(reserveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          gte: Big(3000),
        }),
      );
      expect(clientQueryBuilderMock.andWhere).toBeCalledWith({
        clientId: { $in: ['123'] },
      });
      expect(result['clientId']).toBeDefined();
      expect(result['clientId']).toMatchObject({ $in: ['123'] });
    });

    it('Multiple filters', async () => {
      const filterCriteria = new FindInvoiceFilterCriteria({
        clientOperatingBalance: [
          new ClientOperatingBalanceCriteria({
            value: Big(3000),
            operator: FilterOperator.GTE,
          }),
          new ClientOperatingBalanceCriteria({
            value: Big(10000),
            operator: FilterOperator.LTE,
          }),
        ],
      });

      const reserveSpy = jest
        .spyOn(reserveRepository, 'getClientsByBalance')
        .mockResolvedValueOnce(['123']);

      mockClientFactoringQbExecuteOnce([
        EntityStubs.buildClientFactoringConfig({ clientId: '123' }),
      ]);

      const result = await queryHandler.generateWhereClause(filterCriteria);

      expect(reserveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          lte: Big(10000),
          gte: Big(3000),
        }),
      );
      expect(clientQueryBuilderMock.andWhere).toBeCalledWith({
        clientId: { $in: ['123'] },
      });
      expect(result['clientId']).toBeDefined();
      expect(result['clientId']).toMatchObject({ $in: ['123'] });
    });
  });

  describe(`Tag keys`, () => {
    it('Single tag key filter', async () => {
      const filterCriteria = new FindInvoiceFilterCriteria({
        tags: new InvoiceTagsCriteria({
          value: TagDefinitionKey.BROKER_NOT_FOUND,
          operator: FilterOperator.EQ,
        }),
      });

      const result = await queryHandler.generateWhereClause(filterCriteria);

      expect(result['tags']).toBeDefined();
      expect(result['tags']).toMatchObject({
        $and: [
          { recordStatus: RecordStatus.Active },
          {
            tagDefinition: {
              key: {
                $eq: TagDefinitionKey.BROKER_NOT_FOUND,
              },
            },
          },
        ],
      });
    });

    it('Multiple tag key filters', async () => {
      const filterCriteria = new FindInvoiceFilterCriteria({
        tags: [
          new InvoiceTagsCriteria({
            value: TagDefinitionKey.BROKER_NOT_FOUND,
            operator: FilterOperator.EQ,
          }),
          new InvoiceTagsCriteria({
            value: [
              TagDefinitionKey.ADVANCE_TAKEN,
              TagDefinitionKey.CLIENT_HAS_NEGATIVE_RESERVES,
            ],
            operator: FilterOperator.NIN,
          }),
        ],
      });

      const result = await queryHandler.generateWhereClause(filterCriteria);

      expect(result['tags']).toBeDefined();
      expect(result['tags']).toMatchObject({
        $and: [
          { recordStatus: RecordStatus.Active },
          {
            tagDefinition: {
              key: {
                $eq: TagDefinitionKey.BROKER_NOT_FOUND,
                $nin: [
                  TagDefinitionKey.ADVANCE_TAKEN,
                  TagDefinitionKey.CLIENT_HAS_NEGATIVE_RESERVES,
                ],
              },
            },
          },
        ],
      });
    });
  });

  describe(`Tag group keys`, () => {
    it('Single tag group key filter', async () => {
      const filterCriteria = new FindInvoiceFilterCriteria({
        tagGroups: new InvoiceTagGroupsCriteria({
          value: TagDefinitionGroupKey.INVOICE_ISSUES,
          operator: FilterOperator.EQ,
        }),
      });

      const result = await queryHandler.generateWhereClause(filterCriteria);

      expect(result['tags']).toBeDefined();
      expect(result['tags']).toMatchObject({
        $and: [
          { recordStatus: RecordStatus.Active },
          {
            tagDefinition: {
              group: {
                group: {
                  key: {
                    $eq: TagDefinitionGroupKey.INVOICE_ISSUES,
                  },
                },
              },
            },
          },
        ],
      });
    });

    it('Multiple tag group key filters', async () => {
      const filterCriteria = new FindInvoiceFilterCriteria({
        tagGroups: [
          new InvoiceTagGroupsCriteria({
            value: TagDefinitionGroupKey.INVOICE_ISSUES,
            operator: FilterOperator.EQ,
          }),
          new InvoiceTagGroupsCriteria({
            value: [
              TagDefinitionGroupKey.BROKER_CONFIGURATION,
              TagDefinitionGroupKey.BROKER_PAYMENT_ISSUES,
            ],
            operator: FilterOperator.NIN,
          }),
        ],
      });

      const result = await queryHandler.generateWhereClause(filterCriteria);

      expect(result['tags']).toBeDefined();
      expect(result['tags']).toMatchObject({
        $and: [
          { recordStatus: RecordStatus.Active },
          {
            tagDefinition: {
              group: {
                group: {
                  key: {
                    $eq: TagDefinitionGroupKey.INVOICE_ISSUES,
                    $nin: [
                      TagDefinitionGroupKey.BROKER_CONFIGURATION,
                      TagDefinitionGroupKey.BROKER_PAYMENT_ISSUES,
                    ],
                  },
                },
              },
            },
          },
        ],
      });
    });
  });

  describe(`Combined tag related filters`, () => {
    it('Multiple tag key and tag group key filters', async () => {
      const filterCriteria = new FindInvoiceFilterCriteria({
        tags: new InvoiceTagsCriteria({
          value: TagDefinitionKey.BROKER_NOT_FOUND,
          operator: FilterOperator.EQ,
        }),
        tagGroups: [
          new InvoiceTagGroupsCriteria({
            value: TagDefinitionGroupKey.INVOICE_ISSUES,
            operator: FilterOperator.EQ,
          }),
        ],
      });

      const result = await queryHandler.generateWhereClause(filterCriteria);

      expect(result['tags']).toBeDefined();
      expect(result['tags']).toMatchObject({
        $and: [
          { recordStatus: RecordStatus.Active },
          {
            tagDefinition: {
              key: {
                $eq: TagDefinitionKey.BROKER_NOT_FOUND,
              },
            },
          },
          {
            tagDefinition: {
              group: {
                group: {
                  key: {
                    $eq: TagDefinitionGroupKey.INVOICE_ISSUES,
                  },
                },
              },
            },
          },
        ],
      });
    });
  });

  describe('Total amount', () => {
    it('Under review status uses value column', async () => {
      jest.spyOn(invoiceRepository, 'buildQueryConstraints').mockResolvedValue({
        whereClause: {},
        findOptions: {},
      });
      jest.spyOn(invoiceRepository, 'findAll').mockResolvedValue([[], 0]);

      const getStatsSpy = jest
        .spyOn(invoiceRepository, 'getStats')
        .mockResolvedValue({ total: 0, count: 0 });

      await queryHandler.execute(
        new FindInvoicesQuery(
          new QueryCriteria({
            filters: [
              {
                name: 'status',
                value: InvoiceStatus.UnderReview,
                operator: FilterOperator.EQ,
              },
            ],
          }),
        ),
      );

      expect(getStatsSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          amountColumnForTotal: 'value',
        }),
      );
    });

    it('Purchased status uses accounts_receivable_value column', async () => {
      jest.spyOn(invoiceRepository, 'buildQueryConstraints').mockResolvedValue({
        whereClause: {},
        findOptions: {},
      });
      jest.spyOn(invoiceRepository, 'findAll').mockResolvedValue([[], 0]);

      const getStatsSpy = jest
        .spyOn(invoiceRepository, 'getStats')
        .mockResolvedValue({ total: 0, count: 0 });

      await queryHandler.execute(
        new FindInvoicesQuery(
          new QueryCriteria({
            filters: [
              {
                name: 'status',
                value: InvoiceStatus.Purchased,
                operator: FilterOperator.EQ,
              },
            ],
          }),
        ),
      );

      expect(getStatsSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          amountColumnForTotal: 'accounts_receivable_value',
        }),
      );
    });

    it('Rejected status uses value column', async () => {
      jest.spyOn(invoiceRepository, 'buildQueryConstraints').mockResolvedValue({
        whereClause: {},
        findOptions: {},
      });
      jest.spyOn(invoiceRepository, 'findAll').mockResolvedValue([[], 0]);

      const getStatsSpy = jest
        .spyOn(invoiceRepository, 'getStats')
        .mockResolvedValue({ total: 0, count: 0 });

      await queryHandler.execute(
        new FindInvoicesQuery(
          new QueryCriteria({
            filters: [
              {
                name: 'status',
                value: InvoiceStatus.Rejected,
                operator: FilterOperator.EQ,
              },
            ],
          }),
        ),
      );

      expect(getStatsSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          amountColumnForTotal: 'value',
        }),
      );
    });

    it('Multiple statuses uses value column', async () => {
      jest.spyOn(invoiceRepository, 'buildQueryConstraints').mockResolvedValue({
        whereClause: {},
        findOptions: {},
      });
      jest.spyOn(invoiceRepository, 'findAll').mockResolvedValue([[], 0]);

      const getStatsSpy = jest
        .spyOn(invoiceRepository, 'getStats')
        .mockResolvedValue({ total: 0, count: 0 });

      await queryHandler.execute(
        new FindInvoicesQuery(
          new QueryCriteria({
            filters: [
              {
                name: 'status',
                value: [InvoiceStatus.UnderReview, InvoiceStatus.Rejected],
                operator: FilterOperator.IN,
              },
            ],
          }),
        ),
      );

      expect(getStatsSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          amountColumnForTotal: 'value',
        }),
      );
    });
  });
});
