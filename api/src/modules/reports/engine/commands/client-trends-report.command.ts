import { ReportCommand } from './report.command';
import { ClientTrendsReportCreateRequest } from '@fs-bobtail/factoring/data';

export class ClientTrendsReportCommand extends ReportCommand<ClientTrendsReportCreateRequest> {
  constructor(request: ClientTrendsReportCreateRequest) {
    super(request, 'Client Trends');
  }
}
