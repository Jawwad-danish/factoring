import { NetFundsEmployedReportRequest } from '@fs-bobtail/factoring/data';
import { ReportCommand } from './report.command';

export class NetFundsEmployedReportCommand extends ReportCommand<NetFundsEmployedReportRequest> {
  constructor(request: NetFundsEmployedReportRequest) {
    super(request, 'Net Funds Employed');
  }
}
