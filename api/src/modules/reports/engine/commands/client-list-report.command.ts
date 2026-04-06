import { ClientListReportRequest } from '@fs-bobtail/factoring/data';
import { ReportCommand } from './report.command';

export class ClientListReportCommand extends ReportCommand<ClientListReportRequest> {
  constructor(request: ClientListReportRequest) {
    super(request, 'Client List');
  }
}
