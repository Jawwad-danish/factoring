import { ClientAgingReportRequest } from '@fs-bobtail/factoring/data';
import { ReportCommand } from './report.command';

export class ClientAgingReportCommand extends ReportCommand<ClientAgingReportRequest> {
  constructor(request: ClientAgingReportRequest) {
    super(request, 'Client Aging');
  }
}
