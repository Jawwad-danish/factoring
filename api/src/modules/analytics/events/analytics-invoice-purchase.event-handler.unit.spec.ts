import { mockMikroORMProvider, mockToken } from '@core/test';

import { penniesToDollars } from '@core/formulas';
import { createMock } from '@golevelup/ts-jest';
import { buildStubClient } from '@module-clients/test';
import {
  ClientFactoringAnalyticsRepository,
  InvoiceRepository,
  Repositories,
} from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { SegmentService } from '../services';
import { EntityStubs } from '@module-persistence/test';
import { AnalyticsInvoicePurchaseEventHandler } from './analytics-invoice-purchase.event-handler';

describe('Analytics - invoice purchase event handler', () => {
  let handler: AnalyticsInvoicePurchaseEventHandler;
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
        AnalyticsInvoicePurchaseEventHandler,
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

    handler = module.get(AnalyticsInvoicePurchaseEventHandler);
    segmentService = module.get(SegmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Create new analytics if not found', async () => {
    const factoredVolumeMock = Big(1000);
    const findSpy =
      analyticsRepository.findByClientId.mockResolvedValueOnce(null);
    const client = buildStubClient();

    invoiceRepository.getTotalPurchasedInvoicesByClientId.mockResolvedValueOnce(
      factoredVolumeMock,
    );

    await handler.update({ client, purchasedAt: new Date(), brokerId: '123' });
    expect(
      invoiceRepository.getTotalPurchasedInvoicesByClientId,
    ).toHaveBeenCalledWith(client.id);
    expect(findSpy).toHaveBeenCalledWith(client.id);
    expect(repositories.persist).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: client.id,
      }),
    );
  });

  it('Return early if analytics firstPurchasedDate already in db', async () => {
    const factoredVolumeMock = Big(2000);
    const entity = EntityStubs.buildClientFactoringAnalytics({
      firstPurchasedDate: new Date(),
    });
    const findSpy =
      analyticsRepository.findByClientId.mockResolvedValueOnce(entity);
    const client = buildStubClient();

    invoiceRepository.getTotalPurchasedInvoicesByClientId.mockResolvedValueOnce(
      factoredVolumeMock,
    );

    await handler.update({ client, purchasedAt: new Date(), brokerId: '123' });

    expect(findSpy).toHaveBeenCalledWith(client.id);
    expect(segmentService.identify).toHaveBeenCalled();
    expect(segmentService.track).toHaveBeenCalled();
  });

  it('Update firstPurchasedInvoiceDate and call segment service', async () => {
    const entity = EntityStubs.buildClientFactoringAnalytics({
      firstPurchasedDate: undefined,
    });
    const factoredVolumeMock = Big(3000);
    const findSpy =
      analyticsRepository.findByClientId.mockResolvedValueOnce(entity);
    const client = buildStubClient();
    const firstPurchasedInvoiceDateStub = new Date();
    invoiceRepository.firstPurchasedInvoiceDate.mockResolvedValueOnce(
      firstPurchasedInvoiceDateStub,
    );
    invoiceRepository.getTotalPurchasedInvoicesByClientId.mockResolvedValueOnce(
      factoredVolumeMock,
    );

    await handler.update({ client, purchasedAt: new Date(), brokerId: '123' });
    expect(findSpy).toHaveBeenCalledWith(client.id);
    expect(entity.firstPurchasedDate).toEqual(firstPurchasedInvoiceDateStub);
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
      'first-invoice-purchased-date',
      expect.objectContaining({
        email: client.email,
        id: client.id,
        dot: client.dot,
        firstPurchasedDate: firstPurchasedInvoiceDateStub.toISOString(),
      }),
    );

    expect(
      invoiceRepository.getTotalPurchasedInvoicesByClientId,
    ).toHaveBeenCalledWith(client.id);
    expect(segmentService.identify).toHaveBeenCalledWith(client.mc, {
      email: client.email,
      id: client.id,
      dot: client.dot,
    });
    expect(segmentService.track).toHaveBeenCalledWith(
      client.mc,
      'analytics-invoice-purchase',
      {
        email: client.email,
        id: client.id,
        dot: client.dot,
        factoredVolume: penniesToDollars(factoredVolumeMock).toFixed(2),
        factoredVolumePennies: factoredVolumeMock.toFixed(),
      },
    );
  });
});
