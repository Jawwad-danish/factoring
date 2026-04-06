import { ClientSummaryRequest } from '@fs-bobtail/factoring/data';
import { ReportCommand } from './report.command';

export class ClientSummaryReportCommand extends ReportCommand<ClientSummaryRequest> {
  constructor(request: ClientSummaryRequest) {
    super(request, 'Client Summary');
  }
}
