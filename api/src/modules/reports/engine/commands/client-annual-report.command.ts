import { ClientAnnualReportRequest } from '@fs-bobtail/factoring/data';
import { ReportCommand } from './report.command';

export class ClientAnnualReportCommand extends ReportCommand<ClientAnnualReportRequest> {
  constructor(request: ClientAnnualReportRequest) {
    super(request, 'Client Annual');
  }
}
