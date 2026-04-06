import { BrokerPaymentReportRequest } from '@fs-bobtail/factoring/data';
import { ReportCommand } from './report.command';

export class BrokerPaymentReportCommand extends ReportCommand<BrokerPaymentReportRequest> {
  constructor(request: BrokerPaymentReportRequest) {
    super(request, 'BrokerPayment');
  }
}
