import { BrokerRatingReportRequest } from '@fs-bobtail/factoring/data';
import { ReportCommand } from './report.command';

export class BrokerRatingReportCommand extends ReportCommand<BrokerRatingReportRequest> {
  constructor(request: BrokerRatingReportRequest) {
    super(request, 'Broker Rating');
  }
}
