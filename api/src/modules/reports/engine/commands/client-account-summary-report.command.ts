import { ClientAccountSummaryReportRequest } from '@fs-bobtail/factoring/data';
import { ReportCommand } from './report.command';

export class ClientAccountSummaryReportCommand extends ReportCommand<ClientAccountSummaryReportRequest> {
  constructor(request: ClientAccountSummaryReportRequest) {
    super(request, 'Client Account Summary');
  }
}
