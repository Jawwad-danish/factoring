import { mockMikroORMProvider, mockToken } from '@core/test';

import { createMock } from '@golevelup/ts-jest';
import { buildStubClient } from '@module-clients/test';
import {
  ClientFactoringAnalyticsRepository,
  InvoiceRepository,
  Repositories,
} from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import { SegmentService } from '../services';
import { AnalyticsInvoiceCreateEventHandler } from './analytics-invoice-create.event-handler';
import { EntityStubs } from '@module-persistence/test';

describe('Analytics - invoice create event handler', () => {
  let handler: AnalyticsInvoiceCreateEventHandler;
  let segmentService: SegmentService;
  const invoiceRepository = createMock<InvoiceRepository>();
  const analyticsRepository = createMock<ClientFactoringAnalyticsRepository>();

  const repositories = createMock<Repositories>({
    clientFactoringAnalytics: analyticsRepository,
    invoice: invoiceRepository,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsInvoiceCreateEventHandler,
        Repositories,
        mockMikroORMProvider,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(Repositories)
      .useValue(repositories)

      .compile();

    handler = module.get(AnalyticsInvoiceCreateEventHandler);
    segmentService = module.get(SegmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Create new analytics if not found', async () => {
    const findSpy =
      analyticsRepository.findByClientId.mockResolvedValueOnce(null);
    const invoice = EntityStubs.buildStubInvoice();
    const client = buildStubClient();

    await handler.update({ client, invoice: invoice });
    expect(findSpy).toHaveBeenCalledWith(client.id);
    expect(repositories.persist).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: client.id,
      }),
    );
  });

  it('If no first creation date is found on analytics, handle first creation date, update entity', async () => {
    const entity = EntityStubs.buildClientFactoringAnalytics({
      firstCreatedDate: undefined,
    });
    const findSpy =
      analyticsRepository.findByClientId.mockResolvedValueOnce(entity);
    const dateStub = new Date();
    const invoiceSpy =
      invoiceRepository.firstCreatedInvoiceDate.mockResolvedValueOnce(dateStub);
    const invoice = EntityStubs.buildStubInvoice();
    const client = buildStubClient();

    await handler.update({ client, invoice: invoice });

    expect(findSpy).toHaveBeenCalledWith(client.id);
    expect(invoiceSpy).toHaveBeenCalledWith(client.id);
    expect(segmentService.identify).toHaveBeenCalledWith(
      client.mc,
      expect.objectContaining({
        email: client.email,
        id: client.id,
        dot: client.dot,
      }),
    );
    expect(segmentService.track).toHaveBeenCalledWith(
      client.mc,
      'first-invoice-submitted-date',
      expect.objectContaining({
        email: client.email,
        id: client.id,
        dot: client.dot,
        firstSubmittedInvoiceDate: dateStub.toISOString(),
      }),
    );
    expect(entity.firstCreatedDate).toEqual(dateStub);
  });

  it('Call segment service on event handle', async () => {
    const entity = EntityStubs.buildClientFactoringAnalytics({
      firstCreatedDate: new Date(),
    });
    const findSpy =
      analyticsRepository.findByClientId.mockResolvedValueOnce(entity);
    const invoice = EntityStubs.buildStubInvoice();
    const client = buildStubClient();

    await handler.update({ client, invoice: invoice });

    expect(findSpy).toHaveBeenCalledWith(client.id);
    expect(segmentService.identify).toHaveBeenCalledWith(
      client.mc,
      expect.objectContaining({
        email: client.email,
        id: client.id,
        dot: client.dot,
      }),
    );
    expect(segmentService.track).toHaveBeenCalledWith(
      client.mc,
      'last-invoice-submitted-date',
      expect.objectContaining({
        email: client.email,
        id: client.id,
        dot: client.dot,
        lastSubmittedInvoiceDate: invoice.createdAt.toISOString(),
      }),
    );
  });
});
