import { Test, TestingModule } from '@nestjs/testing';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { DashboardService } from './dashboard-service';
import { InvoiceRepository } from '@module-persistence/repositories';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotificationsResponse } from '../data';

describe('Dashboard service', () => {
  let invoiceRepository: DeepMocked<InvoiceRepository>;
  let dashboardService: DashboardService;
  beforeEach(async () => {
    const invoiceRepositoryMock = createMock<InvoiceRepository>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, DashboardService],
    })
      .overrideProvider(InvoiceRepository)
      .useValue(invoiceRepositoryMock)
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();
    dashboardService = module.get(DashboardService);
    invoiceRepository = module.get(InvoiceRepository);
  });
  it('Get notifications', async () => {
    invoiceRepository.getChargebackStatsForClient.mockResolvedValueOnce({
      count: 1,
      total: 1,
    });
    invoiceRepository.getOriginalsRequiredStatsByClient.mockResolvedValueOnce({
      count: 2,
      total: 2,
    });
    invoiceRepository.getPaperworkIssuesStatsForClient.mockResolvedValueOnce({
      count: 3,
      total: 3,
    });

    const result = await dashboardService.getNotificationsData('abc');
    const expected: NotificationsResponse = {
      upcomingChargebacksStats: {
        count: 1,
        total: 1,
      },
      originalsRequiredStats: {
        count: 2,
        total: 2,
      },
      paperworkIssuesStats: {
        count: 3,
        total: 3,
      },
    };
    expect(result).toMatchObject(expected);
  });
});
