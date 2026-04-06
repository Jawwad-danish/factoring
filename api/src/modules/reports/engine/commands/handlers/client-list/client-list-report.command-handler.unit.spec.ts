import { mockMikroORMProvider, mockToken } from '@core/test';
import { ReportType } from '@fs-bobtail/factoring/data';
import { createMock } from '@golevelup/ts-jest';
import { QueryBuilder } from '@mikro-orm/postgresql';
import { ClientContactType, ClientService } from '@module-clients';
import { buildStubClient, buildStubClientContact } from '@module-clients/test';
import {
  ClientFactoringConfigsEntity,
  ClientFactoringStatus,
  InvoiceEntity,
  ReportName,
} from '@module-persistence/entities';
import { Repositories } from '@module-persistence/repositories';
import { buildStubClientListRequest, captureStreamRows } from '@module-reports';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { PassThrough, Readable } from 'stream';
import { ClientListReportCommand } from '../../client-list-report.command';
import { ReportHandler } from '../report-handler';
import { ClientListReportCommandHandler } from './client-list-report.command-handler';

const transformMock = new PassThrough();

describe('ClientListReportCommandHandler', () => {
  let handler: ClientListReportCommandHandler;
  const clientService = createMock<ClientService>();
  const reportHandler = createMock<ReportHandler>();

  const repositories = createMock<Repositories>();

  beforeEach(async () => {
    jest.clearAllMocks();

    reportHandler.processReport.mockResolvedValue(transformMock);
    clientService.findByIds.mockResolvedValue([
      buildStubClient({
        id: 'client-1',
        name: 'Test Client',
        email: 'test@client.com',
        dot: 'DOT123',
        mc: 'MC456',
        authorityDate: '2024-01-01',
        languages: ['English', 'Spanish'],
        createdAt: new Date('2024-06-01'),
        factoringConfig: {
          status: ClientFactoringStatus.Active,
          clientLimitAmount: new Big(50000),
          totalTrucksAmount: 10,
          clientSuccessTeam: {
            name: 'Team A',
          },
        } as any,
        clientContacts: [
          {
            primary: true,
            type: ClientContactType.OWNER,
            name: 'John Doe',
            contactPhones: [{ phone: '555-1234' }],
            address: {
              address: '123 Main St',
              city: 'Los Angeles',
              state: 'CA',
              zip: '90001',
            },
          },
        ] as any,
      }),
    ]);

    const mockEntityManager =
      createMock<QueryBuilder<ClientFactoringConfigsEntity>>();
    mockEntityManager['find'].mockResolvedValue([{ clientId: 'client-1' }]);

    repositories.getEntityManager.mockReturnValue(mockEntityManager as any);

    const mockInvoiceQueryBuilder = createMock<QueryBuilder<InvoiceEntity>>();
    mockInvoiceQueryBuilder.select = jest.fn().mockReturnThis();
    mockInvoiceQueryBuilder.where = jest.fn().mockReturnThis();
    mockInvoiceQueryBuilder.groupBy = jest.fn().mockReturnThis();
    mockInvoiceQueryBuilder.execute = jest.fn().mockResolvedValue([
      {
        client_id: 'client-1',
        last_30_days: 15000,
        last_12_months: 120000,
      },
    ]);

    repositories.invoice.queryBuilder = jest
      .fn()
      .mockReturnValue(mockInvoiceQueryBuilder as QueryBuilder<InvoiceEntity>);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientListReportCommandHandler,
        Repositories,
        mockMikroORMProvider,
        {
          provide: ClientService,
          useValue: clientService,
        },
        {
          provide: ReportHandler,
          useValue: reportHandler,
        },
        {
          provide: Repositories,
          useValue: repositories,
        },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get<ClientListReportCommandHandler>(
      ClientListReportCommandHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should execute client list report command', async () => {
    const processReportSpy = reportHandler.processReport.mockResolvedValueOnce(
      Readable.from([]),
    );
    const command = new ClientListReportCommand(buildStubClientListRequest());

    await handler.execute(command);

    expect(processReportSpy).toHaveBeenCalledTimes(1);
    expect(processReportSpy).toHaveBeenCalledWith(
      ReportType.CSV,
      ReportName.ClientList,
      expect.any(Readable),
      expect.objectContaining({
        formatDefinition: expect.any(Object),
        metadataRow: expect.stringContaining('Client List Report'),
      }),
    );
  });

  it('should fetch client factoring configs by end date', async () => {
    const findSpy = jest.spyOn(repositories.getEntityManager(), 'find');
    const command = new ClientListReportCommand(
      buildStubClientListRequest({ endDate: new Date('2025-01-31') }),
    );

    await handler.execute(command);

    expect(findSpy).toHaveBeenCalledWith(
      ClientFactoringConfigsEntity,
      {
        createdAt: {
          $lte: new Date('2025-01-31'),
        },
      },
      {
        fields: ['clientId'],
      },
    );
  });

  it('should fetch invoice related data for clients', async () => {
    const command = new ClientListReportCommand(buildStubClientListRequest());

    await handler.execute(command);

    expect(repositories.invoice.queryBuilder).toHaveBeenCalledWith('i');
    expect(repositories.invoice.queryBuilder).toHaveBeenCalledTimes(1);
  });

  it('should fetch first and last invoice dates for clients', async () => {
    const createQueryBuilderSpy = jest.spyOn(
      repositories.getEntityManager(),
      'createQueryBuilder',
    );
    const command = new ClientListReportCommand(buildStubClientListRequest());

    await handler.execute(command);

    expect(createQueryBuilderSpy).toHaveBeenCalledWith(InvoiceEntity);
  });

  it('should transform data to report rows correctly', async () => {
    const command = new ClientListReportCommand(buildStubClientListRequest());

    await handler.execute(command);

    expect(reportHandler.processReport).toHaveBeenCalledWith(
      ReportType.CSV,
      ReportName.ClientList,
      expect.any(Readable),
      expect.objectContaining({
        formatDefinition: expect.objectContaining({
          clientName: expect.objectContaining({ type: 'string' }),
          accountManagerName: expect.objectContaining({ type: 'string' }),
          registered: expect.objectContaining({ type: 'string' }),
          ownerName: expect.objectContaining({ type: 'string' }),
          firstInvoiceDate: expect.objectContaining({ type: 'date' }),
          lastInvoiceDate: expect.objectContaining({ type: 'date' }),
          authorityDate: expect.objectContaining({ type: 'date' }),
          numberOfTrucks: expect.objectContaining({ type: 'number' }),
          clientLimit: expect.objectContaining({ type: 'currency' }),
          clientMC: expect.objectContaining({ type: 'string' }),
          clientDOT: expect.objectContaining({ type: 'string' }),
          languages: expect.objectContaining({ type: 'string' }),
          sumOfLast30Days: expect.objectContaining({ type: 'currency' }),
          sumOfLast12Months: expect.objectContaining({ type: 'currency' }),
          status: expect.objectContaining({ type: 'string' }),
          phoneNumber: expect.objectContaining({ type: 'string' }),
          email: expect.objectContaining({ type: 'string' }),
          address: expect.objectContaining({ type: 'string' }),
          city: expect.objectContaining({ type: 'string' }),
          state: expect.objectContaining({ type: 'string' }),
          zipcode: expect.objectContaining({ type: 'string' }),
        }),
      }),
    );
  });

  it('should include metadata row with correct date format', async () => {
    const command = new ClientListReportCommand(
      buildStubClientListRequest({ endDate: new Date('2025-01-31') }),
    );

    await handler.execute(command);

    expect(reportHandler.processReport).toHaveBeenCalledWith(
      ReportType.CSV,
      ReportName.ClientList,
      expect.any(Readable),
      expect.objectContaining({
        metadataRow: expect.stringMatching(/Client List Report.*Date ran:/),
      }),
    );
  });

  it('should fetch clients by ids', async () => {
    const findByIdsSpy = jest.spyOn(clientService, 'findByIds');
    const command = new ClientListReportCommand(buildStubClientListRequest());

    await handler.execute(command);

    expect(findByIdsSpy).toHaveBeenCalledWith(['client-1']);
  });

  it('should generate complete report with primary contact data', async () => {
    const mockDateQueryBuilder = createMock<QueryBuilder<InvoiceEntity>>();
    mockDateQueryBuilder.select = jest.fn().mockReturnThis();
    mockDateQueryBuilder.where = jest.fn().mockReturnThis();
    mockDateQueryBuilder.groupBy = jest.fn().mockReturnThis();
    mockDateQueryBuilder.execute = jest.fn().mockResolvedValue([
      {
        client_id: 'client-1',
        first_date: new Date('2024-07-01'),
        last_date: new Date('2024-12-15'),
      },
    ]);

    const mockEntityManager = {
      find: jest.fn().mockResolvedValue([{ clientId: 'client-1' }]),
      createQueryBuilder: jest.fn().mockReturnValue(mockDateQueryBuilder),
    };
    repositories.getEntityManager.mockReturnValue(mockEntityManager as any);

    const mockInvoiceQueryBuilder = createMock<QueryBuilder<InvoiceEntity>>();
    mockInvoiceQueryBuilder.select = jest.fn().mockReturnThis();
    mockInvoiceQueryBuilder.where = jest.fn().mockReturnThis();
    mockInvoiceQueryBuilder.groupBy = jest.fn().mockReturnThis();
    mockInvoiceQueryBuilder.execute = jest.fn().mockResolvedValue([
      {
        client_id: 'client-1',
        last_30_days: 50000,
        last_12_months: 600000,
      },
    ]);

    repositories.invoice.queryBuilder = jest
      .fn()
      .mockReturnValue(mockInvoiceQueryBuilder as QueryBuilder<InvoiceEntity>);

    const client = buildStubClient({ id: 'client-1' });
    client.name = 'Test Client Inc';
    client.email = 'client@test.com';
    client.dot = 'DOT123';
    client.mc = 'MC456';
    client.authorityDate = '2024-01-15';
    client.languages = ['English', 'Spanish'];
    client.createdAt = new Date('2024-06-01');
    client.factoringConfig.status = ClientFactoringStatus.Active;
    client.factoringConfig.clientLimitAmount = new Big(100000);
    client.factoringConfig.totalTrucksAmount = 25;
    client.factoringConfig.clientSuccessTeam.name = 'Team Alpha';

    const primaryContact = buildStubClientContact();
    primaryContact.primary = true;
    primaryContact.type = ClientContactType.OWNER;
    primaryContact.name = 'John Primary';
    primaryContact.contactPhones[0].phone = '555-1111';
    primaryContact.address.address = '123 Primary St';
    primaryContact.address.city = 'Los Angeles';
    primaryContact.address.state = 'CA';
    primaryContact.address.zip = '90001';

    const businessContact = buildStubClientContact();
    businessContact.primary = false;
    businessContact.type = ClientContactType.BUSINESS;
    businessContact.name = 'Jane Business';
    businessContact.contactPhones[0].phone = '555-2222';
    businessContact.address.address = '456 Business Ave';
    businessContact.address.city = 'San Francisco';
    businessContact.address.state = 'CA';
    businessContact.address.zip = '94102';

    client.clientContacts = [primaryContact, businessContact];

    clientService.findByIds.mockResolvedValue([client]);

    const command = new ClientListReportCommand(buildStubClientListRequest());

    reportHandler.processReport.mockImplementationOnce(
      async (_type, _name, stream) => stream,
    );

    const resultStream = await handler.execute(command);
    const rows = await captureStreamRows(resultStream);

    expect(rows.length).toBe(1);
    const row = rows[0] as any;

    expect(row.clientName).toBe('Test Client Inc');
    expect(row.email).toBe('client@test.com');
    expect(row.clientDOT).toBe('DOT123');
    expect(row.clientMC).toBe('MC456');
    expect(row.authorityDate).toBeDefined();
    expect(row.authorityDate?.toISOString().split('T')[0]).toBe('2024-01-15');
    expect(row.languages).toBe('English, Spanish');
    expect(row.status).toBe(ClientFactoringStatus.Active);
    expect(row.clientLimit.toNumber()).toBe(100000);
    expect(row.numberOfTrucks).toBe(25);
    expect(row.accountManagerName).toBe('Team Alpha');
    expect(row.ownerName).toBe('John Primary');
    expect(row.phoneNumber).toBe('555-1111');
    expect(row.address).toBe('123 Primary St');
    expect(row.city).toBe('Los Angeles');
    expect(row.state).toBe('CA');
    expect(row.zipcode).toBe('90001');
    expect(row.sumOfLast30Days.toNumber()).toBe(50000);
    expect(row.sumOfLast12Months.toNumber()).toBe(600000);
    expect(row.firstInvoiceDate).toEqual(new Date('2024-07-01'));
    expect(row.lastInvoiceDate).toEqual(new Date('2024-12-15'));
  });

  it('should fallback to business contact when primary contact is missing', async () => {
    const mockDateQueryBuilder = createMock<QueryBuilder<InvoiceEntity>>();
    mockDateQueryBuilder.select = jest.fn().mockReturnThis();
    mockDateQueryBuilder.where = jest.fn().mockReturnThis();
    mockDateQueryBuilder.groupBy = jest.fn().mockReturnThis();
    mockDateQueryBuilder.execute = jest.fn().mockResolvedValue([]);

    const mockEntityManager = {
      find: jest.fn().mockResolvedValue([{ clientId: 'client-1' }]),
      createQueryBuilder: jest.fn().mockReturnValue(mockDateQueryBuilder),
    };
    repositories.getEntityManager.mockReturnValue(mockEntityManager as any);

    const client = buildStubClient({ id: 'client-1' });
    client.name = 'Business Only Client';
    client.email = 'business@test.com';
    client.dot = 'DOT789';
    client.mc = 'MC012';
    client.languages = ['English'];
    client.createdAt = new Date('2024-05-01');
    client.factoringConfig.status = ClientFactoringStatus.Active;
    client.factoringConfig.clientLimitAmount = new Big(75000);
    client.factoringConfig.totalTrucksAmount = 15;
    client.factoringConfig.clientSuccessTeam.name = 'Team Beta';

    const ownerContact = buildStubClientContact();
    ownerContact.primary = false;
    ownerContact.type = ClientContactType.OWNER;
    ownerContact.name = 'Owner Name';
    ownerContact.contactPhones = [];
    ownerContact.address = null;

    const businessContact = buildStubClientContact();
    businessContact.primary = false;
    businessContact.type = ClientContactType.BUSINESS;
    businessContact.name = 'Business Contact';
    businessContact.contactPhones[0].phone = '555-9999';
    businessContact.address.address = '789 Business Blvd';
    businessContact.address.city = 'San Diego';
    businessContact.address.state = 'CA';
    businessContact.address.zip = '92101';

    client.clientContacts = [ownerContact, businessContact];

    clientService.findByIds.mockResolvedValue([client]);

    const mockInvoiceQueryBuilder = createMock<QueryBuilder<InvoiceEntity>>();
    mockInvoiceQueryBuilder.select = jest.fn().mockReturnThis();
    mockInvoiceQueryBuilder.where = jest.fn().mockReturnThis();
    mockInvoiceQueryBuilder.groupBy = jest.fn().mockReturnThis();
    mockInvoiceQueryBuilder.execute = jest.fn().mockResolvedValue([
      {
        client_id: 'client-1',
        last_30_days: 25000,
        last_12_months: 300000,
      },
    ]);

    repositories.invoice.queryBuilder = jest
      .fn()
      .mockReturnValue(mockInvoiceQueryBuilder as QueryBuilder<InvoiceEntity>);

    const command = new ClientListReportCommand(buildStubClientListRequest());

    reportHandler.processReport.mockImplementationOnce(
      async (_type, _name, stream) => stream,
    );

    const resultStream = await handler.execute(command);
    const rows = await captureStreamRows(resultStream);

    expect(rows.length).toBe(1);
    const row = rows[0] as any;

    expect(row.clientName).toBe('Business Only Client');
    expect(row.phoneNumber).toBe('555-9999');
    expect(row.address).toBe('789 Business Blvd');
    expect(row.city).toBe('San Diego');
    expect(row.state).toBe('CA');
    expect(row.zipcode).toBe('92101');
    expect(row.ownerName).toBe('Owner Name');
  });

  it('should use N/A for missing contact information', async () => {
    const mockDateQueryBuilder = createMock<QueryBuilder<InvoiceEntity>>();
    mockDateQueryBuilder.select = jest.fn().mockReturnThis();
    mockDateQueryBuilder.where = jest.fn().mockReturnThis();
    mockDateQueryBuilder.groupBy = jest.fn().mockReturnThis();
    mockDateQueryBuilder.execute = jest.fn().mockResolvedValue([]);

    const mockEntityManager = {
      find: jest.fn().mockResolvedValue([{ clientId: 'client-1' }]),
      createQueryBuilder: jest.fn().mockReturnValue(mockDateQueryBuilder),
    };
    repositories.getEntityManager.mockReturnValue(mockEntityManager as any);

    const client = buildStubClient({ id: 'client-1' });
    client.name = 'Minimal Client';
    client.email = 'minimal@test.com';
    client.languages = [];
    client.createdAt = new Date('2024-08-01');
    client.factoringConfig.status = ClientFactoringStatus.Hold;
    client.factoringConfig.clientLimitAmount = new Big(0);
    client.factoringConfig.totalTrucksAmount = 0;
    client.factoringConfig.clientSuccessTeam.name = 'Team Gamma';
    client.clientContacts = [];

    clientService.findByIds.mockResolvedValue([client]);

    const mockInvoiceQueryBuilder = createMock<QueryBuilder<InvoiceEntity>>();
    mockInvoiceQueryBuilder.select = jest.fn().mockReturnThis();
    mockInvoiceQueryBuilder.where = jest.fn().mockReturnThis();
    mockInvoiceQueryBuilder.groupBy = jest.fn().mockReturnThis();
    mockInvoiceQueryBuilder.execute = jest.fn().mockResolvedValue([
      {
        client_id: 'client-1',
        last_30_days: 0,
        last_12_months: 0,
      },
    ]);

    repositories.invoice.queryBuilder = jest
      .fn()
      .mockReturnValue(mockInvoiceQueryBuilder as QueryBuilder<InvoiceEntity>);

    const command = new ClientListReportCommand(buildStubClientListRequest());

    reportHandler.processReport.mockImplementationOnce(
      async (_type, _name, stream) => stream,
    );

    const resultStream = await handler.execute(command);
    const rows = await captureStreamRows(resultStream);

    expect(rows.length).toBe(1);
    const row = rows[0] as any;

    expect(row.clientName).toBe('Minimal Client');
    expect(row.phoneNumber).toBe('N/A');
    expect(row.address).toBe('N/A');
    expect(row.city).toBe('N/A');
    expect(row.state).toBe('N/A');
    expect(row.zipcode).toBe('N/A');
    expect(row.ownerName).toBe('N/A');
    expect(row.languages).toBe('');
    expect(row.clientLimit.toNumber()).toBe(0);
    expect(row.numberOfTrucks).toBe(0);
  });

  it('should handle clients with no invoice data', async () => {
    const mockDateQueryBuilder = createMock<QueryBuilder<InvoiceEntity>>();
    mockDateQueryBuilder.select = jest.fn().mockReturnThis();
    mockDateQueryBuilder.where = jest.fn().mockReturnThis();
    mockDateQueryBuilder.groupBy = jest.fn().mockReturnThis();
    mockDateQueryBuilder.execute = jest.fn().mockResolvedValue([]);

    const mockEntityManager = {
      find: jest.fn().mockResolvedValue([{ clientId: 'client-1' }]),
      createQueryBuilder: jest.fn().mockReturnValue(mockDateQueryBuilder),
    };
    repositories.getEntityManager.mockReturnValue(mockEntityManager as any);

    const client = buildStubClient({ id: 'client-1' });
    client.name = 'New Client';
    client.createdAt = new Date('2024-12-01');
    client.factoringConfig.status = ClientFactoringStatus.Active;
    client.factoringConfig.clientLimitAmount = new Big(50000);
    client.factoringConfig.totalTrucksAmount = 5;
    client.factoringConfig.clientSuccessTeam.name = 'Team Delta';

    clientService.findByIds.mockResolvedValue([client]);

    const mockInvoiceQueryBuilder = createMock<QueryBuilder<InvoiceEntity>>();
    mockInvoiceQueryBuilder.select = jest.fn().mockReturnThis();
    mockInvoiceQueryBuilder.where = jest.fn().mockReturnThis();
    mockInvoiceQueryBuilder.groupBy = jest.fn().mockReturnThis();
    mockInvoiceQueryBuilder.execute = jest.fn().mockResolvedValue([]);

    repositories.invoice.queryBuilder = jest
      .fn()
      .mockReturnValue(mockInvoiceQueryBuilder as QueryBuilder<InvoiceEntity>);

    const command = new ClientListReportCommand(buildStubClientListRequest());

    reportHandler.processReport.mockImplementationOnce(
      async (_type, _name, stream) => stream,
    );

    const resultStream = await handler.execute(command);
    const rows = await captureStreamRows(resultStream);

    expect(rows.length).toBe(1);
    const row = rows[0] as any;

    expect(row.clientName).toBe('New Client');
    expect(row.sumOfLast30Days.toNumber()).toBe(0);
    expect(row.sumOfLast12Months.toNumber()).toBe(0);
    expect(row.firstInvoiceDate).toBeUndefined();
    expect(row.lastInvoiceDate).toBeUndefined();
  });
});
