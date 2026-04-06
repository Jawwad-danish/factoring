import { PortoflioReserveReportRequest } from '@fs-bobtail/factoring/data';
import { ReportCommand } from './report.command';

export class PortoflioReserveReportCommand extends ReportCommand<PortoflioReserveReportRequest> {
  constructor(request: PortoflioReserveReportRequest) {
    super(request, 'Portoflio Reserves');
  }
}
