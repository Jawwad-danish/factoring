import { ClientTotalReserveReportCreateRequest } from '@fs-bobtail/factoring/data';
import { ReportCommand } from './report.command';

export class ClientTotalReserveReportCommand extends ReportCommand<ClientTotalReserveReportCreateRequest> {
  constructor(request: ClientTotalReserveReportCreateRequest) {
    super(request, 'Client Total Reserve');
  }
}
