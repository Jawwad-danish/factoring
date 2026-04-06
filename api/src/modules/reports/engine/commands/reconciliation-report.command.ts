import { ReconciliationReportRequest } from '@fs-bobtail/factoring/data';
import { ReportCommand } from './report.command';

export class ReconciliationReportCommand extends ReportCommand<ReconciliationReportRequest> {
  constructor(request: ReconciliationReportRequest) {
    super(request, 'reconciliation');
  }
}
