import { Injectable, Logger } from '@nestjs/common';
import { InvoiceRepository } from '@module-persistence/repositories';
import { NotificationsResponse } from '../data';

@Injectable()
export class DashboardService {
  private logger: Logger = new Logger(DashboardService.name);

  constructor(private invoiceRepository: InvoiceRepository) {}

  async getNotificationsData(clientId: string): Promise<NotificationsResponse> {
    this.logger.log('Getting notifications data');

    const [
      upcomingChargebacksStats,
      paperworkIssuesStats,
      originalsRequiredStats,
    ] = await Promise.all([
      this.invoiceRepository.getChargebackStatsForClient(clientId),
      this.invoiceRepository.getPaperworkIssuesStatsForClient(clientId),
      this.invoiceRepository.getOriginalsRequiredStatsByClient(clientId),
    ]);

    return {
      paperworkIssuesStats: paperworkIssuesStats,
      originalsRequiredStats: originalsRequiredStats,
      upcomingChargebacksStats: upcomingChargebacksStats,
    };
  }
}
