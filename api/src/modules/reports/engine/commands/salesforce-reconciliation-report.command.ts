import { SalesforceReconciliationReportRequest } from '@fs-bobtail/factoring/data';
import { ReportCommand } from './report.command';

export class SalesforceReconciliationReportCommand extends ReportCommand<SalesforceReconciliationReportRequest> {
  constructor(request: SalesforceReconciliationReportRequest) {
    super(request, 'Salesforce reconciliation');
  }
}
