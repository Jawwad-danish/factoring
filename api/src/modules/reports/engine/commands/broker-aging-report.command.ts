import { BrokerAgingReportCreateRequest } from '@fs-bobtail/factoring/data';
import { ReportCommand } from './report.command';

export class BrokerAgingReportCommand extends ReportCommand<BrokerAgingReportCreateRequest> {
  constructor(request: BrokerAgingReportCreateRequest) {
    super(request, 'Broker Aging');
  }
}
